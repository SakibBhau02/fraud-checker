import { NextRequest, NextResponse } from "next/server";
import { BadPhoneError, QuotaExceededError, checkQuota, runFraudCheck } from "@/lib/check";
import { UpstreamError } from "@/lib/parcelvai";
import { extractApiKey, hashApiKey } from "@/lib/apikey";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const raw = extractApiKey(req.headers);
  if (!raw) {
    return NextResponse.json({ error: "Missing API key. Send header: x-api-key: fk_... or Authorization: Bearer fk_...", error_bn: "API key দিন (x-api-key হেডারে)" }, { status: 401 });
  }
  const key = await prisma.apiKey.findUnique({ where: { keyHash: hashApiKey(raw) }, include: { user: { select: { id: true, role: true } } } });
  if (!key || key.revoked) {
    return NextResponse.json({ error: "Invalid or revoked API key", error_bn: "ভুল বা বাতিল API key" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { phone?: string; fresh?: boolean };
  try {
    await checkQuota(`user:${key.userId}`, { isGuest: false, unlimited: key.user.role === "superadmin" });
    const out = await runFraudCheck(body.phone ?? "", { userId: key.userId, quotaKey: `user:${key.userId}` }, body.fresh);
    await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
    return NextResponse.json(out);
  } catch (e: unknown) {
    if (e instanceof QuotaExceededError) {
      return NextResponse.json({ error: "Daily limit of 50 checks exceeded", error_bn: "আজকের ৫০টি চেক শেষ — আগামীকাল আবার চেষ্টা করুন" }, { status: 429 });
    }
    if (e instanceof BadPhoneError) {
      return NextResponse.json({ error: "Invalid phone. Use 11-digit 01XXXXXXXXX format", error_bn: "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (01XXXXXXXXX)" }, { status: 400 });
    }
    if (e instanceof UpstreamError) {
      if (e.code === "UPSTREAM_LIMIT") return NextResponse.json({ error: "Rate limited, retry later", error_bn: "সার্ভার লিমিট শেষ — কিছুক্ষণ পর আবার চেষ্টা করুন" }, { status: 502 });
      if (e.code === "UPSTREAM_TIMEOUT") return NextResponse.json({ error: "Timeout, retry later", error_bn: "উত্তর আসতে দেরি হচ্ছে — আবার চেষ্টা করুন" }, { status: 504 });
      return NextResponse.json({ error: "Check failed, retry later", error_bn: "তথ্য আনা যায়নি — কিছুক্ষণ পর আবার চেষ্টা করুন" }, { status: 502 });
    }
    return NextResponse.json({ error: "Check failed", error_bn: "চেক করা যায়নি" }, { status: 502 });
  }
}
