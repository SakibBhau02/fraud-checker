import { NextRequest, NextResponse } from "next/server";
import { ownFilter, requireIdentity } from "@/lib/identity";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const id = await requireIdentity();
  if (!id) return NextResponse.json({ error_bn: "লগইন প্রয়োজন" }, { status: 401 });
  const u = new URL(req.url);
  const q = u.searchParams.get("q") ?? "";
  const risk = u.searchParams.get("risk") ?? "";
  const page = Math.max(1, Number(u.searchParams.get("page") ?? 1));
  const take = 20;
  const where: Record<string, unknown> = { AND: [ownFilter(id)] } as unknown as Record<string, unknown>;
  if (q) (where as { phone: unknown }).phone = { contains: q };
  if (risk) (where as { riskLevel: unknown }).riskLevel = risk;
  const [rows, total] = await Promise.all([
    prisma.checkHistory.findMany({ where, orderBy: { createdAt: "desc" }, take, skip: (page - 1) * take, include: { checkedBy: { select: { email: true, name: true } } } }),
    prisma.checkHistory.count({ where }),
  ]);
  return NextResponse.json({ rows, total, page, pages: Math.ceil(total / take) });
}
