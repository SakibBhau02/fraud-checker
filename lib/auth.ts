import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: { email: { type: "text" }, password: { type: "password" } },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const u = await prisma.user.findUnique({ where: { email: creds.email } });
        if (!u) return null;
        const ok = await compare(creds.password, u.passwordHash);
        if (!ok) return null;
        return { id: u.id, name: u.name, email: u.email, role: u.role } as unknown as { id: string; name: string; email: string };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as unknown as { role: string }).role ?? "member";
      return token;
    },
    async session({ session, token }) {
      (session.user as unknown as { role: string }).role = (token.role as string) ?? "member";
      return session;
    },
  },
};
