import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function superadmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as unknown as { role?: string })?.role;
  if (!session?.user?.email || role !== "superadmin") return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function GET() {
  const me = await superadmin();
  if (!me) return NextResponse.json({ error_bn: "শুধু superadmin" }, { status: 403 });
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { checks: true, apiKeys: true } } },
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const me = await superadmin();
  if (!me) return NextResponse.json({ error_bn: "শুধু superadmin" }, { status: 403 });
  const { name, email, password, role } = (await req.json().catch(() => ({}))) as {
    name?: string; email?: string; password?: string; role?: string;
  };
  if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
    return NextResponse.json({ error_bn: "নাম, ইমেইল ও কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন" }, { status: 400 });
  }
  if (role !== "member" && role !== "admin") {
    return NextResponse.json({ error_bn: "role হবে member বা admin" }, { status: 400 });
  }
  const exists = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (exists) return NextResponse.json({ error_bn: "এই ইমেইলে আগেই অ্যাকাউন্ট আছে" }, { status: 409 });
  const created = await prisma.user.create({
    data: { name: name.trim(), email: email.trim(), passwordHash: await hash(password, 10), role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return NextResponse.json(created);
}

export async function DELETE(req: NextRequest) {
  const me = await superadmin();
  if (!me) return NextResponse.json({ error_bn: "শুধু superadmin" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error_bn: "id দিন" }, { status: 400 });
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error_bn: "ইউজার পাওয়া যায়নি" }, { status: 404 });
  if (target.id === me.id) return NextResponse.json({ error_bn: "নিজের অ্যাকাউন্ট ডিলিট করা যাবে না" }, { status: 400 });
  if (target.role === "superadmin") return NextResponse.json({ error_bn: "superadmin ডিলিট করা যাবে না" }, { status: 400 });
  await prisma.apiKey.deleteMany({ where: { userId: id } });
  await prisma.checkHistory.deleteMany({ where: { checkedByUserId: id } });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// (bcrypt compare is used inline via hash() above; verify via login flow)
