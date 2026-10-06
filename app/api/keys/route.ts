import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateApiKey, hashApiKey, keyLimitFor } from "@/lib/apikey";
import { prisma } from "@/lib/prisma";

async function me() {
  // Team accounts only (NextAuth credentials). Clerk-only users get 401 —
  // API keys are never issued to them.
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function GET() {
  const user = await me();
  if (!user) return NextResponse.json({ error_bn: "লগইন প্রয়োজন" }, { status: 401 });
  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id }, orderBy: { createdAt: "desc" },
    select: { id: true, label: true, prefix: true, revoked: true, lastUsedAt: true, createdAt: true },
  });
  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const user = await me();
  if (!user) return NextResponse.json({ error_bn: "লগইন প্রয়োজন" }, { status: 401 });
  const { label } = (await req.json().catch(() => ({}))) as { label?: string };
  if (!label?.trim()) return NextResponse.json({ error_bn: "key-এর নাম দিন" }, { status: 400 });
  const active = await prisma.apiKey.count({ where: { userId: user.id, revoked: false } });
  const limit = keyLimitFor(user.role);
  if (active >= limit) {
    return NextResponse.json({ error_bn: `সর্বোচ্চ ${limit}টা key বানানো যাবে (বর্তমান: ${active}) — পুরনো key বাতিল করুন` }, { status: 403 });
  }
  const { key, prefix } = generateApiKey();
  const created = await prisma.apiKey.create({
    data: { label: label.trim(), keyHash: hashApiKey(key), prefix, userId: user.id },
    select: { id: true, label: true, prefix: true, createdAt: true },
  });
  return NextResponse.json({ ...created, key, note: "এই key একবারই দেখা যাবে — এখনই কপি করে রাখুন" });
}
