import { fetchFraudData, maskPhone } from "./parcelvai";
import { prisma } from "./prisma";
import { parcelvaiSession } from "./settings";
import { isValidPhone, normalizePhone } from "./phone";

export class BadPhoneError extends Error {}
export class QuotaExceededError extends Error {
  remaining = 0;
  isGuest: boolean;
  constructor(isGuest: boolean) {
    super(isGuest ? "demo limit over" : "daily limit over");
    this.isGuest = isGuest;
  }
}

export const GUEST_LIMIT = 3;
export const USER_DAILY_LIMIT = 50;

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Throws QuotaExceededError when over limit. Returns remaining (after this request). */
export async function checkQuota(quotaKey: string, opts: { isGuest: boolean; unlimited: boolean }): Promise<number> {
  if (opts.unlimited) return Infinity;
  if (opts.isGuest) {
    const used = await prisma.checkHistory.count({ where: { quotaKey } });
    if (used >= GUEST_LIMIT) throw new QuotaExceededError(true);
    return GUEST_LIMIT - used - 1;
  }
  const used = await prisma.checkHistory.count({ where: { quotaKey, createdAt: { gte: startOfToday() } } });
  if (used >= USER_DAILY_LIMIT) throw new QuotaExceededError(false);
  return USER_DAILY_LIMIT - used - 1;
}

export interface CheckResult {
  phone: string; operator: string; total: number; delivered: number;
  cancelled: number; successRate: number; riskLevel: string;
  labelBn: string; recommendation: string;
  couriers: { id: string; name: string; total: number; delivered: number; cancelled: number; rate: number }[];
  partial: boolean; cached: boolean; checkedAt: string;
}

export async function runFraudCheck(
  rawPhone: string,
  who: { userId: string | null; quotaKey: string },
  fresh = false
): Promise<CheckResult> {
  const phone = normalizePhone(String(rawPhone ?? ""));
  if (!isValidPhone(phone)) throw new BadPhoneError("bad phone");

  const ttlH = Number(process.env.CACHE_TTL_HOURS ?? 24);
  if (!fresh && ttlH > 0) {
    const since = new Date(Date.now() - ttlH * 3600 * 1000);
    const cached = await prisma.checkHistory.findFirst({ where: { phone, createdAt: { gte: since } }, orderBy: { createdAt: "desc" } });
    if (cached) {
      return {
        phone: cached.phone, operator: "", total: cached.totalOrders, delivered: cached.delivered,
        cancelled: cached.cancelled, successRate: cached.successRate, riskLevel: cached.riskLevel,
        labelBn: "", recommendation: "",
        couriers: (cached.courierBreakdown as CheckResult["couriers"] ?? []),
        partial: false, cached: true, checkedAt: cached.createdAt.toISOString(),
      };
    }
  }
  const creds = await parcelvaiSession();
  const prevS = process.env.PARCELVAI_SESSION; const prevD = process.env.PARCELVAI_DID;
  process.env.PARCELVAI_SESSION = creds.session; process.env.PARCELVAI_DID = creds.did;
  try {
    const out = await fetchFraudData(phone);
    const rawCouriers = ((out.raw as Record<string, unknown> | null)?.couriers as { status?: string }[] | undefined) ?? [];
    const partial = rawCouriers.some((c) => c.status && c.status !== "success");
    await prisma.checkHistory.create({
      data: {
        phone, totalOrders: out.total, delivered: out.delivered, cancelled: out.cancelled,
        successRate: out.successRate, riskLevel: out.riskLevel,
        courierBreakdown: out.couriers as unknown as object, rawJson: (out.raw ?? {}) as object,
        checkedByUserId: who.userId, quotaKey: who.quotaKey,
      },
    });
    return { ...out, partial, cached: false, checkedAt: new Date().toISOString() };
  } catch (e: unknown) {
    console.error("check failed", maskPhone(phone), e instanceof Error ? e.message : e);
    throw e;
  } finally {
    if (prevS === undefined) delete process.env.PARCELVAI_SESSION; else process.env.PARCELVAI_SESSION = prevS;
    if (prevD === undefined) delete process.env.PARCELVAI_DID; else process.env.PARCELVAI_DID = prevD;
  }
}
