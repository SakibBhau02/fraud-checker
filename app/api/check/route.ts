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
    const rawCouriers = ((out.raw as Record<string, unknown> | null)?.couriers as { status?: string }[] | undefined) ?? [];
    const partial = rawCouriers.some((c) => c.status && c.status !== "success");
    const me = await prisma.user.findUnique({ where: { email: session.user.email } });
    await prisma.checkHistory.create({
      data: {
        phone, totalOrders: out.total, delivered: out.delivered, cancelled: out.cancelled,
        successRate: out.successRate, riskLevel: out.riskLevel,
        courierBreakdown: out.couriers as unknown as object, rawJson: (out.raw ?? {}) as object,
        checkedByUserId: me?.id,
      },
    });
    return NextResponse.json({ ...out, partial, cached: false, checkedAt: new Date().toISOString() });
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
