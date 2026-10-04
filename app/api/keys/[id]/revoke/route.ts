import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error_bn: "লগইন প্রয়োজন" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error_bn: "লগইন প্রয়োজন" }, { status: 401 });
  const isSuper = user.role === "superadmin";
  const updated = await prisma.apiKey.updateMany({
    where: isSuper ? { id: params.id } : { id: params.id, userId: user.id },
    data: { revoked: true },
  });
  if (!updated.count) return NextResponse.json({ error_bn: "key পাওয়া যায়নি" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
