import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as unknown as { role?: string })?.role;
  if (role !== "admin") return NextResponse.json({ error_bn: "শুধু admin" }, { status: 403 });
  const { session: s, did } = (await req.json()) as { session: string; did: string };
  if (!s) return NextResponse.json({ error_bn: "session দিন" }, { status: 400 });
  await prisma.appSetting.upsert({ where: { key: "parcelvai_session" }, create: { key: "parcelvai_session", value: s }, update: { value: s } });
  if (did) await prisma.appSetting.upsert({ where: { key: "parcelvai_did" }, create: { key: "parcelvai_did", value: did }, update: { value: did } });
  return NextResponse.json({ ok: true });
}
