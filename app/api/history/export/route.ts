import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error_bn: "লগইন প্রয়োজন" }, { status: 401 });
  const rows = await prisma.checkHistory.findMany({ orderBy: { createdAt: "desc" }, take: 2000 });
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = ["phone,total,delivered,cancelled,success_rate,risk,checked_at",
    ...rows.map((r: { phone: string; totalOrders: number; delivered: number; cancelled: number; successRate: number; riskLevel: string; createdAt: Date }) => [r.phone, r.totalOrders, r.delivered, r.cancelled, r.successRate, r.riskLevel, r.createdAt.toISOString()].map(esc).join(","))].join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=history.csv" } });
}
