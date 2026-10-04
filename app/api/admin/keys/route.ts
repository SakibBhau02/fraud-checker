import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as unknown as { role?: string })?.role;
  if (!session?.user?.email || role !== "superadmin") {
    return NextResponse.json({ error_bn: "শুধু superadmin" }, { status: 403 });
  }
  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" }, take: 200,
    select: { id: true, label: true, prefix: true, revoked: true, lastUsedAt: true, createdAt: true, user: { select: { email: true, name: true } } },
  });
  return NextResponse.json({ keys });
}
