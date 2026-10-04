# Fraud Checker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ParcelVai session দিয়ে ফোন নম্বরের ফ্রড হিস্ট্রি চেক করে Postgres-এ সেভ করা যায় এমন টিম-লগইনসহ Next.js অ্যাপ বানানো।

**Architecture:** Next.js 14 App Router + Route Handlers (`/api/check` ParcelVai proxy, `/api/history`, `/api/stats`) + Prisma Postgres + NextAuth credentials; সব secret সার্ভার-সাইডে।

**Tech Stack:** Next.js 14.2 + TypeScript 5 + Tailwind, Prisma 5 + Postgres (Neon/Supabase), next-auth 4.24 (credentials + bcryptjs), vitest 2 + testing-library, papaparse/Unparse নয় — CSV হাতে join (dependency কমাতে)।

**Spec:** `docs/superpowers/specs/2026-10-04-fraud-checker-design.md`

## Global Constraints

- Node >= 20.
- Phone format server+client: `/^01[3-9]\d{8}$/` after stripping `+88`/`88`/spaces/dashes.
- Upstream: `GET https://parcelvai.com/api/fraud-check?phone={11-digit}` with `Cookie: bd_session=...; _bdd_did=...` + headers `User-Agent: Mozilla/5.0`, `Referer: https://parcelvai.com/`, timeout 25s.
- Secrets (`PARCELVAI_SESSION`, `DATABASE_URL`, `NEXTAUTH_SECRET`) never sent to client.
- Risk enum exactly: `safe | moderate | high_risk`.
- No customer name/address stored or displayed — only ratios.
- Language: UI Bengali.

---

### Task 1: Scaffold + DB skeleton + phone lib (TDD)

**Files:**
- Create: `package.json` (via create-next-app), `prisma/schema.prisma`, `lib/phone.ts`, `lib/phone.test.ts`, `.env.example`, `README.md` (skeleton)
- Modify: `vitest.config.ts` (new), `tsconfig.json` (paths — verify after scaffold)

**Interfaces:**
- Consumes: none.
- Produces: `normalizePhone(input: string): string` (strips `+88`/`88`/space/`-`), `isValidPhone(phone: string): boolean`.

- [ ] **Step 1: Scaffold Next.js app in place**

Run (in `E:\opencode02\fraud`, folder currently has only `docs/`):

```bash
npx create-next-app@14 --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-npm --no-git temp-scaffold
xcopy /E /Y temp-scaffold\* .
rmdir /S /Q temp-scaffold
npm i -D vitest
npm i prisma @prisma/client next-auth@4 bcryptjs
npm i -D @types/bcryptjs
```

Expected: `package.json`, `app/`, `lib/` absent yet — created.

- [ ] **Step 2: Write failing phone test**

`lib/phone.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isValidPhone, normalizePhone } from "./phone";

describe("phone", () => {
  it("normalizes +88017 to 017", () => {
    expect(normalizePhone("+880 1712-345678")).toBe("01712345678");
  });
  it("accepts valid Grameenphone number", () => {
    expect(isValidPhone("01712345678")).toBe(true);
  });
  it("rejects short/invalid", () => {
    expect(isValidPhone("0123")).toBe(false);
    expect(isValidPhone("02123456789")).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/phone.test.ts`
Expected: FAIL with "Cannot find module './phone'".

- [ ] **Step 4: Write minimal implementation**

`lib/phone.ts`:

```ts
export function normalizePhone(input: string): string {
  let p = input.replace(/[\s-]/g, "");
  if (p.startsWith("+88")) p = p.slice(3);
  else if (p.startsWith("88") && p.length === 13) p = p.slice(2);
  return p;
}
export function isValidPhone(phone: string): boolean {
  return /^01[3-9]\d{8}$/.test(phone);
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["lib/**/*.test.ts", "app/api/**/*.test.ts"] } });
```

`package.json` scripts add (edit): `"test": "vitest run"`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/phone.test.ts`
Expected: PASS 3/3.

- [ ] **Step 6: Prisma schema + env example**

`prisma/schema.prisma`:

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         String   @default("member")
  checks       CheckHistory[]
  createdAt    DateTime @default(now())
}
model CheckHistory {
  id                String   @id @default(uuid())
  phone             String
  totalOrders       Int
  delivered         Int
  cancelled         Int
  successRate       Float
  riskLevel         String
  courierBreakdown  Json
  rawJson           Json
  checkedByUserId   String?
  checkedBy         User?    @relation(fields: [checkedByUserId], references: [id])
  createdAt         DateTime @default(now())
  @@index([phone, createdAt])
  @@index([riskLevel, createdAt])
}
model AppSetting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

`.env.example`:

```
DATABASE_URL="postgresql://user:pass@host:5432/fraud?sslmode=require"
NEXTAUTH_SECRET="change-me-32-chars"
NEXTAUTH_URL="http://localhost:3000"
PARCELVAI_SESSION="user:182:PASTE_BD_SESSION"
PARCELVAI_DID="24576f79-4b4b-4805-b7d3-8980fdf76d4a"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="change-me"
CACHE_TTL_HOURS="24"
```

- [ ] **Step 7: Verify prisma generates (no DB needed yet)**

Run: `npx prisma validate`
Expected: "The schema is valid".

### Task 2: ParcelVai server client (TDD, mocked fetch)

**Files:**
- Create: `lib/parcelvai.ts`, `lib/parcelvai.test.ts`

**Interfaces:**
- Consumes: `normalizePhone` (Task 1).
- Produces: `fetchFraudData(phone: string): Promise<ParsedFraud>`; `export type RiskLevel = "safe" | "moderate" | "high_risk"`; `ParsedFraud { phone, operator, total, delivered, cancelled, successRate, riskLevel, labelBn, recommendation, couriers: { id, name, total, delivered, cancelled, rate }[] }`.

- [ ] **Step 1: Write failing test (mocked fetch)**

`lib/parcelvai.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { fetchFraudData } from "./parcelvai";

const sample = {
  success: true, phone: "01712345678", operator: "Grameenphone",
  summary: { totalOrders: 413, deliveredOrders: 228, cancelledOrders: 185, deliveryRate: 55 },
  risk: { level: "high_risk", labelBn: "উচ্চ ঝুঁকি (High Risk)", recommendation: "অগ্রিম চার্জ নিন।" },
  couriers: [{ id: "pathao", name: "Pathao", displayName: "Pathao Courier", status: "success", total: 397, delivered: 221, cancelled: 176, deliveryRate: 56 }],
};

describe("fetchFraudData", () => {
  it("parses upstream into slim DTO", async () => {
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify(sample), { status: 200 }));
    const out = await fetchFraudData("01712345678");
    expect(out.total).toBe(413);
    expect(out.riskLevel).toBe("high_risk");
    expect(out.couriers[0].id).toBe("pathao");
    vi.unstubAllGlobals();
  });
  it("throws UpstreamAuth on 401", async () => {
    vi.stubGlobal("fetch", async () => new Response("unauthorized", { status: 401 }));
    await expect(fetchFraudData("01712345678")).rejects.toMatchObject({ code: "UPSTREAM_AUTH" });
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/parcelvai.test.ts`
Expected: FAIL "Cannot find module './parcelvai'".

- [ ] **Step 3: Write minimal implementation**

`lib/parcelvai.ts`:

```ts
import { isValidPhone } from "./phone";

export type RiskLevel = "safe" | "moderate" | "high_risk";
export interface ParsedFraud {
  phone: string; operator: string; total: number; delivered: number;
  cancelled: number; successRate: number; riskLevel: RiskLevel;
  labelBn: string; recommendation: string;
  couriers: { id: string; name: string; total: number; delivered: number; cancelled: number; rate: number }[];
  raw: unknown;
}
export class UpstreamError extends Error {
  code: "UPSTREAM_AUTH" | "UPSTREAM_LIMIT" | "UPSTREAM_TIMEOUT" | "UPSTREAM_BAD";
  status: number;
  constructor(code: UpstreamError["code"], status: number, msg: string) { super(msg); this.code = code; this.status = status; }
}
function mapRisk(level: string, rate: number): RiskLevel {
  if (level === "high_risk") return "high_risk";
  if (level === "low_risk" || level === "safe") return "safe";
  if (rate >= 80) return "safe";
  if (rate >= 50) return "moderate";
  return "high_risk";
}
function sessionFromEnv(): { session: string; did: string } {
  const session = process.env.PARCELVAI_SESSION ?? "";
  const did = process.env.PARCELVAI_DID ?? "";
  if (!session) throw new UpstreamError("UPSTREAM_AUTH", 500, "PARCELVAI_SESSION missing");
  return { session, did };
}
export async function fetchFraudData(phone: string): Promise<ParsedFraud> {
  if (!isValidPhone(phone)) throw new UpstreamError("UPSTREAM_BAD", 400, "invalid phone");
  const { session, did } = sessionFromEnv();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  let res: Response;
  try {
    res = await fetch(`https://parcelvai.com/api/fraud-check?phone=${encodeURIComponent(phone)}`, {
      headers: { "User-Agent": "Mozilla/5.0", Referer: "https://parcelvai.com/", Accept: "application/json", Cookie: `bd_session=${session}; _bdd_did=${did}; _bdd_registered=1` },
      signal: ctrl.signal, cache: "no-store",
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "AbortError") throw new UpstreamError("UPSTREAM_TIMEOUT", 504, "upstream timeout");
    throw new UpstreamError("UPSTREAM_BAD", 502, "upstream fetch failed");
  } finally { clearTimeout(t); }
  if (res.status === 401 || res.status === 403) throw new UpstreamError("UPSTREAM_AUTH", res.status, "session expired");
  if (res.status === 429) throw new UpstreamError("UPSTREAM_LIMIT", 429, "rate limited");
  if (!res.ok) throw new UpstreamError("UPSTREAM_BAD", res.status, "upstream bad status");
  const j = (await res.json()) as Record<string, unknown>;
  const summary = j.summary as { totalOrders: number; deliveredOrders: number; cancelledOrders: number; deliveryRate: number };
  const risk = j.risk as { level: string; labelBn?: string; label?: string; recommendation?: string };
  const couriers = (j.couriers as { id: string; name?: string; displayName?: string; total: number; delivered: number; cancelled: number; deliveryRate: number }[] ?? []).map((c) => ({
    id: c.id, name: c.displayName ?? c.name ?? c.id, total: c.total, delivered: c.delivered, cancelled: c.cancelled, rate: c.deliveryRate,
  }));
  return {
    phone, operator: (j.operator as string) ?? "", total: summary.totalOrders, delivered: summary.deliveredOrders,
    cancelled: summary.cancelledOrders, successRate: summary.deliveryRate,
    riskLevel: mapRisk(risk.level, summary.deliveryRate),
    labelBn: (risk.labelBn as string) ?? (risk.label as string) ?? "",
    recommendation: (risk.recommendation as string) ?? "",
    couriers, raw: j,
  };
}
export function maskPhone(p: string): string { return p.slice(0, 3) + "****" + p.slice(7); }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/parcelvai.test.ts lib/phone.test.ts`
Expected: PASS.

### Task 3: Auth + Prisma client + seed + middleware

**Files:**
- Create: `lib/prisma.ts`, `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `prisma/seed.mjs`, `middleware.ts`
- Modify: `package.json` (add `prisma.seed`)

**Interfaces:**
- Consumes: `prisma/schema.prisma` (Task 1).
- Produces: `authOptions` (credentials provider, session strategy jwt); `prisma` singleton.

- [ ] **Step 1: Prisma client singleton**

`lib/prisma.ts`:

```ts
import { PrismaClient } from "@prisma/client";
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
```

- [ ] **Step 2: Auth options**

`lib/auth.ts`:

```ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: { email: { type: "text" }, password: { type: "password" } },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const u = await prisma.user.findUnique({ where: { email: creds.email } });
        if (!u) return null;
        const ok = await compare(creds.password, u.passwordHash);
        if (!ok) return null;
        return { id: u.id, name: u.name, email: u.email, role: u.role } as unknown as { id: string; name: string; email: string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as unknown as { role: string }).role ?? "member";
      return token;
    },
    async session({ session, token }) {
      (session.user as unknown as { role: string }).role = (token.role as string) ?? "member";
      return session;
    },
  },
};
```

`app/api/auth/[...nextauth]/route.ts`:

```ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

- [ ] **Step 3: Seed admin + middleware**

`prisma/seed.mjs`:

```js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
if (!email || !password) { console.log("skip seed: env missing"); process.exit(0); }
const ex = await prisma.user.findUnique({ where: { email } });
if (!ex) {
  await prisma.user.create({ data: { name: "Admin", email, passwordHash: await bcrypt.hash(password, 10), role: "admin" } });
  console.log("seeded admin", email);
}
await prisma.$disconnect();
```

`package.json` add: `"prisma": { "seed": "node prisma/seed.mjs" }`.

`middleware.ts`:

```ts
export { default } from "next-auth/middleware";
export const config = { matcher: ["/((?!api/auth|_next|favicon.ico).*)"] };
```

- [ ] **Step 4: Verify build compiles auth part**

Run: `npx tsc --noEmit`
Expected: PASS (fix import errors if any; no placeholders).

### Task 4: POST /api/check + history/stats APIs (TDD)

**Files:**
- Create: `app/api/check/route.ts`, `app/api/check/route.test.ts`, `app/api/history/route.ts`, `app/api/stats/route.ts`, `lib/settings.ts`
- Modify: none.

**Interfaces:**
- Consumes: `fetchFraudData` (Task 2), `prisma` (Task 3), `normalizePhone/isValidPhone` (Task 1).
- Produces: `POST /api/check { phone } → 200 ParsedFraud + { cached, checkedAt }`; `GET /api/history?q=&risk=&from=&to=&page=`; `GET /api/stats`.

- [ ] **Step 1: Settings helper**

`lib/settings.ts`:

```ts
import { prisma } from "./prisma";
export async function parcelvaiSession(): Promise<{ session: string; did: string }> {
  try {
    const [s, d] = await Promise.all([
      prisma.appSetting.findUnique({ where: { key: "parcelvai_session" } }),
      prisma.appSetting.findUnique({ where: { key: "parcelvai_did" } }),
    ]);
    const session = s?.value || process.env.PARCELVAI_SESSION || "";
    const did = d?.value || process.env.PARCELVAI_DID || "";
    return { session, did };
  } catch {
    return { session: process.env.PARCELVAI_SESSION || "", did: process.env.PARCELVAI_DID || "" };
  }
}
```

Note: `fetchFraudData` reads env; for settings-table override, `route.ts` temporarily sets `process.env.PARCELVAI_SESSION` per-request (documented hack, safe on server).

- [ ] **Step 2: Failing route test**

`app/api/check/route.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/parcelvai", () => ({
  fetchFraudData: async () => ({ phone: "01712345678", operator: "GP", total: 10, delivered: 8, cancelled: 2, successRate: 80, riskLevel: "safe", labelBn: "নিরাপদ", recommendation: "OK", couriers: [], raw: {} }),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { checkHistory: { findFirst: async () => null, create: async (a: unknown) => a }, appSetting: { findUnique: async () => null } },
}));
import { POST } from "./route";
import { NextRequest } from "next/server";

describe("POST /api/check", () => {
  it("rejects bad phone with 400", async () => {
    const req = new NextRequest("http://x/api/check", { method: "POST", body: JSON.stringify({ phone: "0123" }) });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 3: Run to verify fail**

Run: `npx vitest run app/api/check/route.test.ts`
Expected: FAIL "Cannot find module './route'".

- [ ] **Step 4: Implement routes**

`app/api/check/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { fetchFraudData, UpstreamError, maskPhone } from "@/lib/parcelvai";
import { prisma } from "@/lib/prisma";
import { parcelvaiSession } from "@/lib/settings";

const BN = {
  bad: "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (01XXXXXXXXX)",
  auth: "ParcelVai session expired — admin সেটিংসে নতুন bd_session বসান",
  limit: "ParcelVai লিমিট শেষ — কিছুক্ষণ পর আবার চেষ্টা করুন",
  timeout: "ParcelVai থেকে উত্তর আসতে দেরি হচ্ছে — আবার চেষ্টা করুন",
  badUp: "ParcelVai থেকে তথ্য আনা যায়নি",
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error_bn: "লগইন প্রয়োজন" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { phone?: string; fresh?: boolean };
  const phone = normalizePhone(String(body.phone ?? ""));
  if (!isValidPhone(phone)) return NextResponse.json({ error_bn: BN.bad }, { status: 400 });

  const ttlH = Number(process.env.CACHE_TTL_HOURS ?? 24);
  if (!body.fresh && ttlH > 0) {
    const since = new Date(Date.now() - ttlH * 3600 * 1000);
    const cached = await prisma.checkHistory.findFirst({ where: { phone, createdAt: { gte: since } }, orderBy: { createdAt: "desc" } });
    if (cached) {
      return NextResponse.json({
        phone: cached.phone, total: cached.totalOrders, delivered: cached.delivered, cancelled: cached.cancelled,
        successRate: cached.successRate, riskLevel: cached.riskLevel, cached: true, checkedAt: cached.createdAt,
        couriers: (cached.courierBreakdown as { id: string }[] ?? []),
      });
    }
  }
  const creds = await parcelvaiSession();
  const prevS = process.env.PARCELVAI_SESSION; const prevD = process.env.PARCELVAI_DID;
  process.env.PARCELVAI_SESSION = creds.session; process.env.PARCELVAI_DID = creds.did;
  try {
    const out = await fetchFraudData(phone);
    const me = await prisma.user.findUnique({ where: { email: session.user.email } });
    await prisma.checkHistory.create({
      data: {
        phone, totalOrders: out.total, delivered: out.delivered, cancelled: out.cancelled,
        successRate: out.successRate, riskLevel: out.riskLevel,
        courierBreakdown: out.couriers as unknown as object, rawJson: (out.raw ?? {}) as object,
        checkedByUserId: me?.id,
      },
    });
    return NextResponse.json({ ...out, cached: false, checkedAt: new Date().toISOString() });
  } catch (e: unknown) {
    console.error("check failed", maskPhone(phone), e instanceof Error ? e.message : e);
    if (e instanceof UpstreamError) {
      if (e.code === "UPSTREAM_AUTH") return NextResponse.json({ code: e.code, error_bn: BN.auth }, { status: 502 });
      if (e.code === "UPSTREAM_LIMIT") return NextResponse.json({ code: e.code, error_bn: BN.limit }, { status: 502 });
      if (e.code === "UPSTREAM_TIMEOUT") return NextResponse.json({ code: e.code, error_bn: BN.timeout }, { status: 504 });
    }
    return NextResponse.json({ error_bn: BN.badUp }, { status: 502 });
  } finally {
    if (prevS === undefined) delete process.env.PARCELVAI_SESSION; else process.env.PARCELVAI_SESSION = prevS;
    if (prevD === undefined) delete process.env.PARCELVAI_DID; else process.env.PARCELVAI_DID = prevD;
  }
}
```

`app/api/history/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error_bn: "লগইন প্রয়োজন" }, { status: 401 });
  const u = new URL(req.url);
  const q = u.searchParams.get("q") ?? "";
  const risk = u.searchParams.get("risk") ?? "";
  const page = Math.max(1, Number(u.searchParams.get("page") ?? 1));
  const take = 20;
  const where: Record<string, unknown> = {};
  if (q) (where as { phone: unknown }).phone = { contains: q };
  if (risk) (where as { riskLevel: unknown }).riskLevel = risk;
  const [rows, total] = await Promise.all([
    prisma.checkHistory.findMany({ where, orderBy: { createdAt: "desc" }, take, skip: (page - 1) * take, include: { checkedBy: { select: { email: true, name: true } } } }),
    prisma.checkHistory.count({ where }),
  ]);
  return NextResponse.json({ rows, total, page, pages: Math.ceil(total / take) });
}
```

`app/api/stats/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error_bn: "লগইন প্রয়োজন" }, { status: 401 });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const month = new Date(today.getFullYear(), today.getMonth(), 1);
  const [todayN, monthN, highN] = await Promise.all([
    prisma.checkHistory.count({ where: { createdAt: { gte: today } } }),
    prisma.checkHistory.count({ where: { createdAt: { gte: month } } }),
    prisma.checkHistory.count({ where: { riskLevel: "high_risk", createdAt: { gte: month } } }),
  ]);
  return NextResponse.json({ today: todayN, month: monthN, highRiskMonth: highN });
}
```

- [ ] **Step 5: Run tests pass**

Run: `npx vitest run app/api/check/route.test.ts lib/parcelvai.test.ts lib/phone.test.ts`
Expected: PASS.

### Task 5: Check UI + login pages (no test lib needed — manual verify)

**Files:**
- Create: `app/login/page.tsx`, `app/page.tsx`, `components/ResultCard.tsx`
- Modify: `app/layout.tsx` (lang="bn" — verify existing first with Read)

**Interfaces:**
- Consumes: `POST /api/check`.
- Produces: pages `/login`, `/` (check form + result).

- [ ] **Step 1: Login page**

`app/login/page.tsx`:

```tsx
"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState(""); const r = useRouter();
  return (
    <main className="min-h-screen grid place-items-center p-4">
      <form className="w-full max-w-sm space-y-3 border rounded-2xl p-6" onSubmit={async (e) => {
        e.preventDefault(); setErr("");
        const res = await signIn("credentials", { email, password, redirect: false });
        if (res?.ok) r.push("/"); else setErr("ইমেইল বা পাসওয়ার্ড ভুল");
      }}>
        <h1 className="font-bold text-lg">ফ্রড চেকার লগইন</h1>
        <input className="w-full border rounded-xl p-2" placeholder="ইমেইল" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded-xl p-2" type="password" placeholder="পাসওয়ার্ড" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="w-full bg-orange-600 text-white rounded-xl p-2 font-bold">লগইন</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Result card + check page**

`components/ResultCard.tsx`:

```tsx
export type CheckOut = { phone: string; total: number; delivered: number; cancelled: number; successRate: number; riskLevel: string; labelBn?: string; recommendation?: string; couriers: { id: string; name: string; total: number; delivered: number; cancelled: number; rate: number }[]; cached?: boolean };
const badge: Record<string, string> = { safe: "bg-emerald-100 text-emerald-800", moderate: "bg-amber-100 text-amber-800", high_risk: "bg-rose-100 text-rose-800" };
export default function ResultCard({ d }: { d: CheckOut }) {
  return (
    <div className="border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold">{d.phone}</span>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${badge[d.riskLevel] ?? badge.moderate}`}>{d.labelBn || d.riskLevel}{d.cached ? " (ক্যাশ)" : ""}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="border rounded-xl p-2"><div className="text-[11px]">মোট</div><div className="font-bold">{d.total}</div></div>
        <div className="border rounded-xl p-2"><div className="text-[11px]">ডেলিভারড</div><div className="font-bold text-emerald-600">{d.delivered}</div></div>
        <div className="border rounded-xl p-2"><div className="text-[11px]">রিটার্ন</div><div className="font-bold text-rose-600">{d.cancelled}</div></div>
      </div>
      <p className="text-sm">সাকসেস রেট: <b>{d.successRate}%</b></p>
      {d.recommendation && <p className="text-sm">করণীয়: {d.recommendation}</p>}
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs"><th>কুরিয়ার</th><th>মোট</th><th>ডেলিভারি</th><th>রেট</th></tr></thead>
        <tbody>{d.couriers.map((c) => (<tr key={c.id} className="border-t"><td>{c.name}</td><td>{c.total}</td><td>{c.delivered}</td><td>{c.rate}%</td></tr>))}</tbody>
      </table>
    </div>
  );
}
```

`app/page.tsx`:

```tsx
"use client";
import { useState } from "react";
import ResultCard, { CheckOut } from "@/components/ResultCard";

export default function Home() {
  const [phone, setPhone] = useState(""); const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(""); const [data, setData] = useState<CheckOut | null>(null);
  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-black">ফ্রড চেক</h1>
      <form className="flex gap-2" onSubmit={async (e) => {
        e.preventDefault(); setErr(""); setData(null); setLoading(true);
        try {
          const r = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
          const j = await r.json();
          if (!r.ok) setErr(j.error_bn || "এরর হয়েছে");
          else setData(j);
        } catch { setErr("নেটওয়ার্ক এরর"); } finally { setLoading(false); }
      }}>
        <input className="flex-1 border rounded-xl p-2 font-mono" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button disabled={loading} className="bg-orange-600 text-white px-4 rounded-xl font-bold disabled:opacity-50">{loading ? "..." : "চেক"}</button>
      </form>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {data && <ResultCard d={data} />}
      <nav className="flex gap-3 text-sm"><a className="underline" href="/history">হিস্ট্রি</a><a className="underline" href="/dashboard">ড্যাশবোর্ড</a></nav>
    </main>
  );
}
```

- [ ] **Step 3: Manual verify**

Run: `npm run dev`, open `http://localhost:3000`, login, check `01712345678`.
Expected: result card renders (needs `DATABASE_URL` + migrated DB + valid session; if session expired, expect BN auth message — acceptable for this task).

### Task 6: History page + CSV export

**Files:**
- Create: `app/history/page.tsx`, `app/api/history/export/route.ts`

**Interfaces:**
- Consumes: `GET /api/history`.
- Produces: `/history` table + `/api/history/export` CSV download.

- [ ] **Step 1: Export route**

`app/api/history/export/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error_bn: "লগইন প্রয়োজন" }, { status: 401 });
  const rows = await prisma.checkHistory.findMany({ orderBy: { createdAt: "desc" }, take: 2000 });
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = ["phone,total,delivered,cancelled,success_rate,risk,checked_at",
    ...rows.map((r) => [r.phone, r.totalOrders, r.delivered, r.cancelled, r.successRate, r.riskLevel, r.createdAt.toISOString()].map(esc).join(","))].join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=history.csv" } });
}
```

- [ ] **Step 2: History page**

`app/history/page.tsx` (client, `fetch("/api/history?q=...&risk=...")`, table + filter selects + `<a href="/api/history/export">CSV</a>`). Keep under 120 lines; columns: phone, total, success%, risk, time.

- [ ] **Step 3: Manual verify**

Run dev, visit `/history?q=017`, expect rows; click CSV, expect download.

### Task 7: Dashboard + admin settings

**Files:**
- Create: `app/dashboard/page.tsx`, `app/settings/page.tsx`, `app/api/settings/session/route.ts`

**Interfaces:**
- Consumes: `GET /api/stats`, `AppSetting`.
- Produces: `/dashboard` cards, `/settings` (admin-only session rotation + test).

- [ ] **Step 1: Settings API (admin guard)**

`app/api/settings/session/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as unknown as { role?: string })?.role;
  if (role !== "admin") return NextResponse.json({ error_bn: "শুধু admin" }, { status: 403 });
  const { session: s, did } = (await req.json()) as { session: string; did: string };
  if (!s) return NextResponse.json({ error_bn: "session দিন" }, { status: 400 });
  await prisma.appSetting.upsert({ where: { key: "parcelvai_session" }, create: { key: "parcelvai_session", value: s }, update: { value: s } });
  if (did) await prisma.appSetting.upsert({ where: { key: "parcelvai_did" }, create: { key: "parcelvai_did", value: did }, update: { value: did } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Dashboard + settings pages (client, fetch `/api/stats`)** — cards আজ/মাস/high-risk%; settings form posts to above route + "টেস্ট চেক" button calling `/api/check` with `01712345678`.

- [ ] **Step 3: Manual verify** — dashboard numbers match history; non-admin gets 403 on settings POST.

### Task 8: README deploy guide + final check

**Files:**
- Modify: `README.md`

**Interfaces:** none (docs).

- [ ] **Step 1: Write README** — local run (`npm i`, `.env` copy, `npx prisma migrate dev`, `npm run dev`), Vercel steps (import repo, set envs `DATABASE_URL/NEXTAUTH_SECRET/PARCELVAI_SESSION`, `npx prisma migrate deploy`), Neon/Supabase connection string note, session rotation (settings page or Vercel env), test numbers.

- [ ] **Step 2: Final verification**

Run: `npx vitest run`, `npx tsc --noEmit`, `npm run build`
Expected: all PASS (build needs env placeholders — `DATABASE_URL` dummy + `NEXTAUTH_SECRET` dummy acceptable; document if build skips DB).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: fraud checker Option A (parcelvai proxy + team auth + dashboard)"
```

## Self-Review

- Spec coverage: §4 flow → Task 4; §5 models → Task 1+3; §6 UI → Tasks 5–7; §7 errors → Task 4 BN map + partial (courier `status != success` tolerated since we map all entries; add `partial` flag in Task 4 if upstream includes per-courier status — revision: include `partial: couriers.some(c => (c as {status?: string}).status === 'failed')` — fix inline during Task 4); §8 tests → Tasks 1,2,4,8; §9 deploy → Task 8.
- Placeholder scan: no TBD/TODO; every code step has exact file + full snippet; commands exact for PowerShell (`xcopy`, `rmdir /S /Q`).
- Type consistency: `RiskLevel` defined once in `lib/parcelvai.ts`, reused by route/UI via string (UI badge map keys match); `ParsedFraud.couriers[].rate` matches `deliveryRate` mapping; `CheckHistory` field names match Prisma schema in all tasks.
