"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "চেক" },
  { href: "/history", label: "হিস্ট্রি" },
  { href: "/dashboard", label: "ড্যাশবোর্ড" },
  { href: "/settings", label: "সেটিংস" },
];

export default function Header() {
  const { data } = useSession();
  const path = usePathname();
  if (path === "/login") return null;
  return (
    <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-black">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white">✓</span>
          ফ্রড চেকার
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={`rounded-lg px-3 py-1.5 font-medium ${path === l.href ? "bg-orange-100 text-orange-800" : "text-slate-600 hover:bg-slate-100"}`}>
              {l.label}
            </Link>
          ))}
          {data?.user?.email && (
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="ml-1 rounded-lg px-3 py-1.5 text-slate-500 hover:bg-slate-100" title={data.user.email}>
              বের হন
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
