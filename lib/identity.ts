import { getServerSession } from "next-auth";
import { auth } from "@clerk/nextjs/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface Identity {
  userId: string | null;
  quotaKey: string;
  isGuest: false;
  unlimited: boolean;
  label: string;
}

/** Resolve logged-in identity (NextAuth team user OR Clerk user). Returns null when logged out. */
export async function requireIdentity(): Promise<Identity | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const me = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!me) return null;
    return {
      userId: me.id,
      quotaKey: `user:${me.id}`,
      isGuest: false,
      unlimited: me.role === "superadmin",
      label: me.email,
    };
  }
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  return { userId: null, quotaKey: `clerk:${clerkId}`, isGuest: false, unlimited: false, label: "clerk" };
}

/** History/stats filter: own rows only (both UI checks and own API-key checks). */
export function ownFilter(id: Identity): Record<string, unknown> {
  if (id.userId) {
    return { OR: [{ checkedByUserId: id.userId }, { quotaKey: id.quotaKey }] };
  }
  return { quotaKey: id.quotaKey };
}
