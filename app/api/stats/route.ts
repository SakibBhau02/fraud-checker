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
