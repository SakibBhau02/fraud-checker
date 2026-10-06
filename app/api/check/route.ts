import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { auth } from "@clerk/nextjs/server";
import { authOptions } from "@/lib/auth";
import { BadPhoneError, QuotaExceededError, checkQuota, runFraudCheck } from "@/lib/check";
import { UpstreamError } from "@/lib/parcelvai";
import { prisma } from "@/lib/prisma";

const BN = {
  bad: "সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (01XXXXXXXXX)",
  auth: "সার্ভার session-এর মেয়াদ শেষ — সেটিংসে নতুন session বসান",
  limit: "সার্ভার লিমিট শেষ — কিছুক্ষণ পর আবার চেষ্টা করুন",
  timeout: "উত্তর আসতে দেরি হচ্ছে — আবার চেষ্টা করুন",
  badUp: "তথ্য আনা যায়নি — কিছুক্ষণ পর আবার চেষ্টা করুন",
  guestOver: "৩টি ফ্রি ডেমো শেষ — আরও চেক করতে লগইন করুন",
  dailyOver: "আজকের ৫০টি চেক শেষ — আগামীকাল আবার চেষ্টা করুন",
};

function toHttpError(e: unknown) {
  if (e instanceof BadPhoneError) return NextResponse.json({ error_bn: BN.bad }, { status: 400 });
  if (e instanceof QuotaExceededError) {
    return NextResponse.json(
      { error_bn: e.isGuest ? BN.guestOver : BN.dailyOver, loginRequired: e.isGuest },
      { status: 429 }
    );
  }
  if (e instanceof UpstreamError) {
    if (e.code === "UPSTREAM_AUTH") return NextResponse.json({ code: e.code, error_bn: BN.auth }, { status: 502 });
    if (e.code === "UPSTREAM_LIMIT") return NextResponse.json({ code: e.code, error_bn: BN.limit }, { status: 502 });
    if (e.code === "UPSTREAM_TIMEOUT") return NextResponse.json({ code: e.code, error_bn: BN.timeout }, { status: 504 });
  }
  return NextResponse.json({ error_bn: BN.badUp }, { status: 502 });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { phone?: string; fresh?: boolean };

  // 1. NextAuth session (superadmin/admin/member)
  const session = await getServerSession(authOptions);
  let userId: string | null = null;
  let quotaKey: string;
  let isGuest = false;
  let unlimited = false;
  let guestCookie: string | null = null;

  if (session?.user?.email) {
    const me = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!me) return NextResponse.json({ error_bn: "লগইন প্রয়োজন" }, { status: 401 });
    userId = me.id;
    quotaKey = `user:${me.id}`;
    unlimited = me.role === "superadmin";
  } else {
    // 2. Clerk session
    const { userId: clerkId } = await auth();
    if (clerkId) {
      quotaKey = `clerk:${clerkId}`;
    } else {
      // 3. Guest — fc_guest cookie
      isGuest = true;
      guestCookie = req.cookies.get("fc_guest")?.value ?? randomUUID();
      quotaKey = `guest:${guestCookie}`;
    }
  }

  try {
    const remaining = await checkQuota(quotaKey, { isGuest, unlimited });
    const out = await runFraudCheck(body.phone ?? "", { userId, quotaKey }, body.fresh);
    const res = NextResponse.json({ ...out, quota: { remaining, isGuest } });
    if (isGuest && guestCookie) {
      res.cookies.set("fc_guest", guestCookie, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 365 * 24 * 3600 });
    }
    return res;
  } catch (e: unknown) {
    return toHttpError(e);
  }
}
