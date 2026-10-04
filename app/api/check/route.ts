import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BadPhoneError, runFraudCheck } from "@/lib/check";
import { UpstreamError } from "@/lib/parcelvai";
import { prisma } from "@/lib/prisma";

const BN = {
  bad: "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (01XXXXXXXXX)",
  auth: "ParcelVai session expired — admin সেটিংসে নতুন bd_session বসান",
  limit: "ParcelVai লিমিট শেষ — কিছুক্ষণ পর আবার চেষ্টা করুন",
  timeout: "ParcelVai থেকে উত্তর আসতে দেরি হচ্ছে — আবার চেষ্টা করুন",
  badUp: "ParcelVai থেকে তথ্য আনা যায়নি",
};

function toHttpError(e: unknown) {
  if (e instanceof BadPhoneError) return NextResponse.json({ error_bn: BN.bad }, { status: 400 });
  if (e instanceof UpstreamError) {
    if (e.code === "UPSTREAM_AUTH") return NextResponse.json({ code: e.code, error_bn: BN.auth }, { status: 502 });
    if (e.code === "UPSTREAM_LIMIT") return NextResponse.json({ code: e.code, error_bn: BN.limit }, { status: 502 });
    if (e.code === "UPSTREAM_TIMEOUT") return NextResponse.json({ code: e.code, error_bn: BN.timeout }, { status: 504 });
  }
  return NextResponse.json({ error_bn: BN.badUp }, { status: 502 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error_bn: "লগইন প্রয়োজন" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { phone?: string; fresh?: boolean };
  try {
    const me = await prisma.user.findUnique({ where: { email: session.user.email } });
    const out = await runFraudCheck(body.phone ?? "", me?.id ?? null, body.fresh);
    return NextResponse.json(out);
  } catch (e: unknown) {
    return toHttpError(e);
  }
}
