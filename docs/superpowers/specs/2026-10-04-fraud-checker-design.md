# Fraud Checker — Design Spec (Option A)

Date: 2026-10-04
Status: Approved by user (all sections)
Scope: Code-only (no deploy now, Vercel-ready later)

## 1. Goal
নিজস্ব Next.js অ্যাপ থেকে টিম মেম্বার ফোন নম্বর দিয়ে কাস্টমারের কুরিয়ার ডেলিভারি/রিটার্ন হিস্ট্রি চেক করবে। ডেটা সোর্স: ParcelVai (`GET /api/fraud-check?phone=` + `bd_session` cookie)। প্রতিটি চেক Postgres-এ সেভ হবে, ড্যাশবোর্ডে সার্চ/ফিল্টার/এক্সপোর্ট + দৈনিক-মাসিক সামারি থাকবে।

## 2. Verified upstream contract (probed 2026-10-04)
- Endpoint: `https://parcelvai.com/api/fraud-check?phone=01712345678`
- Auth: cookies `bd_session=user:182:...`, `_bdd_did`, `_bdd_registered`
- Headers: `User-Agent: Mozilla/5.0`, `Referer: https://parcelvai.com/`, `Accept: application/json`
- Sample response (truncated): `{ success, phone, operator, summary: { totalOrders, deliveredOrders, cancelledOrders, deliveryRate }, risk: { level, label, labelBn, score, recommendation }, couriers: [{ id: pathao|carrybee|paperfly|redx, total, delivered, cancelled, deliveryRate, trustScore, riskLevel }], fromCache, dailyUsed/Limit, monthlyUsed/Limit }`
- Public site allows ~3 free checks, then login wall; authenticated session raises limits (dailyLimit 250 observed).
- Risk: session expires → 401/403; handle explicitly.

## 3. Architecture
- Next.js 14 App Router (TypeScript), `app/(app)/` UI + Route Handlers.
- `app/api/check/route.ts`: POST `{ phone }` → normalize → optional recent-cache lookup → upstream ParcelVai call (server-only secrets) → persist → return slim DTO.
- `app/api/history/route.ts`: GET list (search, risk, date filters, pagination) + CSV export; `app/api/stats/route.ts`: daily/monthly counts + high-risk %.
- DB: Postgres (Neon/Supabase) via Prisma. Settings table holds ParcelVai session fallback so admin can rotate without redeploy.
- Auth: NextAuth (credentials), `User` with role `admin|member`. Middleware protects `/` + `/api/*` (except `/api/auth/*`).
- Secrets server-only: `PARCELVAI_SESSION`, `PARCELVAI_DID`, `DATABASE_URL`, `NEXTAUTH_SECRET`. Never exposed to client.
- YAGNI: no `/fraud-check/stream` SSE now; abstraction `lib/parcelvai.ts` keeps future direct-courier keys possible.

## 4. Data flow
1. UI input `01XXXXXXXXX` → client trims, strips `+88/88` → server re-validates `/^01[3-9]\d{8}$/`.
2. `POST /api/check` checks `CheckHistory` for same phone within TTL (default 24h, toggleable) → hit returns cached + `cached: true`.
3. Miss → `GET parcelvai.com/api/fraud-check?phone=` with cookie header from env/settings, timeout 25s.
4. Parse `summary` + `risk` + `couriers[]`; compute `success_rate`, `risk_level` enum `safe|moderate|high_risk`.
5. Insert `CheckHistory` row with `raw_json` (full upstream, for audit) + slim fields for queries.
6. Return `{ phone, operator, total, delivered, returned, success_rate, risk_level, label_bn, recommendation, couriers: [{id, name, total, delivered, cancelled, rate}], checked_at, cached }`.
7. Dashboard reads `/api/history` + `/api/stats`.

## 5. Data model (Prisma/Postgres)
- `User(id uuid pk, name, email unique, password_hash, role, created_at)`
- `CheckHistory(id uuid pk, phone varchar(11) index, total_orders int, delivered int, cancelled int, success_rate numeric, risk_level varchar(16) index, courier_breakdown jsonb, raw_json jsonb, checked_by_user_id fk→User, created_at timestamptz default now())`, composite index `(phone, created_at desc)`.
- `AppSetting(key pk, value, updated_at)` — keys: `parcelvai_session`, `parcelvai_did`, `cache_ttl_hours`.
- Seed: one admin (credentials via env at first migrate).

## 6. UI (Bengali, mobile-first, no heavy landing page)
- `/login` — email + password.
- `/` (Check) — single input + button, result card (মোট/ডেলিভারড/রিটার্ন, সাকসেস %, risk badge Safe=emerald/Moderate=amber/High=rose, করণীয় text), courier table, "আবার চেক" + history link.
- `/history` — search box, risk filter, date range, table (phone, total, success%, risk, checked_by, time), CSV export button, pagination.
- `/dashboard` — cards (আজ/এই মাসে চেক, high-risk %), mini bar (last 14 days).
- `/settings` (admin) — ParcelVai session textarea + test button, cache TTL, user list.
- No customer name/address shown anywhere (privacy-first, matches ParcelVai).

## 7. Error handling
- Invalid phone → 400 `{ error_bn: "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (01XXXXXXXXX)" }`.
- Upstream 401/403 → 502 `{ code: "UPSTREAM_AUTH", error_bn: "ParcelVai session expired — admin সেটিংসে নতুন bd_session বসান" }`.
- Upstream 429 → 1 retry with backoff, then 502 `UPSTREAM_LIMIT`.
- Upstream timeout (>25s) → 504 `UPSTREAM_TIMEOUT`.
- Partial courier fail (upstream returns `status != success` per courier) → still 200 with `partial: true` + badge "আংশিক ফলাফল".
- All errors logged server-side with phone masked (e.g. `017****5678`).

## 8. Testing
- Unit: phone normalize/validate cases (`+88017..`, `88017..`, spaces, invalid).
- API: `POST /api/check` with mocked `lib/parcelvai.ts` (success / auth-expired / partial) asserts DB insert + DTO shape.
- Manual: `.env.example` + README local steps (`npm i`, `npx prisma migrate dev`, `npm run dev`), test numbers `01712345678`, invalid `0123`.

## 9. Deploy readiness (code-only now)
- `E:\opencode02\fraud` scaffold: `next-app`, `prisma/schema.prisma`, `.env.example` (`DATABASE_URL`, `NEXTAUTH_SECRET`, `PARCELVAI_SESSION`, `PARCELVAI_DID`, `SEED_ADMIN_EMAIL/PASSWORD`), `README.md` with Vercel + Neon/Supabase connect steps.
- No real secrets committed. Vercel env vars documented for later.

## 10. Non-goals
- No direct Steadfast/Pathao/REDX keys now; no SSE streaming; no public signup (admin creates members); no customer PII storage.

## Self-review
- Placeholders: none — endpoint, cookie names, DTO fields verified by live probe.
- Consistency: cache TTL in settings matches flow §4; risk enum matches Prisma §5 and UI §6.
- Scope: single plan-able build (scaffold + auth + check + history + dashboard + settings + tests + README).
- Ambiguity: cache default fixed at 24h toggleable; session rotation via settings table (not redeploy) — explicit.
