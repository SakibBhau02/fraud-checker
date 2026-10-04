import { NextRequest, NextResponse } from "next/server";
import { BadPhoneError, runFraudCheck } from "@/lib/check";
import { UpstreamError } from "@/lib/parcelvai";
import { extractApiKey, hashApiKey } from "@/lib/apikey";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const raw = extractApiKey(req.headers);
  if (!raw) {
    return NextResponse.json({ error: "Missing API key. Send header: x-api-key: fk_... or Authorization: Bearer fk_...", error_bn: "API key দিন (x-api-key হেডারে)" }, { status: 401 });
  }
  const key = await prisma.apiKey.findUnique({ where: { keyHash: hashApiKey(raw) } });
  if (!key || key.revoked) {
    return NextResponse.json({ error: "Invalid or revoked API key", error_bn: "ভুল বা বাতিল API key" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { phone?: string; fresh?: boolean };
  try {
    const out = await runFraudCheck(body.phone ?? "", key.userId, body.fresh);
    await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
    return NextResponse.json(out);
  } catch (e: unknown) {
    if (e instanceof BadPhoneError) {
      return NextResponse.json({ error: "Invalid phone. Use 11-digit 01XXXXXXXXX format", error_bn: "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (01XXXXXXXXX)" }, { status: 400 });
    }
    if (e instanceof UpstreamError) {
      if (e.code === "UPSTREAM_LIMIT") return NextResponse.json({ error: "Upstream rate limited, retry later", error_bn: "ParcelVai লিমিট শেষ — কিছুক্ষণ পর আবার চেষ্টা করুন" }, { status: 502 });
      if (e.code === "UPSTREAM_TIMEOUT") return NextResponse.json({ error: "Upstream timeout, retry later", error_bn: "ParcelVai থেকে উত্তর আসতে দেরি হচ্ছে — আবার চেষ্টা করুন" }, { status: 504 });
      return NextResponse.json({ error: "Upstream check failed", error_bn: "ParcelVai থেকে তথ্য আনা যায়নি" }, { status: 502 });
    }
    return NextResponse.json({ error: "Check failed", error_bn: "চেক করা যায়নি" }, { status: 502 });
  }
}
