import { NextResponse } from "next/server";
import { USER_DAILY_LIMIT, startOfToday } from "@/lib/check";
import { ownFilter, requireIdentity } from "@/lib/identity";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const id = await requireIdentity();
  if (!id) return NextResponse.json({ error_bn: "লগইন প্রয়োজন" }, { status: 401 });
  const own = ownFilter(id);
  const today = startOfToday();
  const month = new Date(today.getFullYear(), today.getMonth(), 1);
  const and = (extra: Record<string, unknown>): Record<string, unknown> =>
    ({ AND: [own, extra] }) as unknown as Record<string, unknown>;
  const [todayN, monthN, highN] = await Promise.all([
    prisma.checkHistory.count({ where: and({ createdAt: { gte: today } }) }),
    prisma.checkHistory.count({ where: and({ createdAt: { gte: month } }) }),
    prisma.checkHistory.count({ where: and({ riskLevel: "high_risk", createdAt: { gte: month } }) }),
  ]);
  return NextResponse.json({
    today: todayN,
    month: monthN,
    highRiskMonth: highN,
    remaining: id.unlimited ? null : Math.max(0, USER_DAILY_LIMIT - todayN),
  });
}
