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
  const role = (data?.user as unknown as { role?: string } | undefined)?.role;
  if (!data?.user?.email) {
    return (
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-lg font-black text-amber-400">✓</span>
            <span>
              <span className="block font-black leading-tight text-slate-900">ফ্রড চেকার</span>
              <span className="block text-[10px] font-medium uppercase tracking-widest text-slate-400">Courier Risk Intelligence</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <a href="https://www.zoolyum.com/" target="_blank" rel="noopener noreferrer" title="Zoolyum"
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 transition hover:bg-slate-700">
              <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">by</span>
              <img src="/zoolyum-logo.svg" alt="Zoolyum" className="h-5 w-auto" />
            </a>
          <Link href="/login" className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-slate-700">
            লগইন
          </Link>
          </div>
        </div>
      </header>
    );
  }
  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900 text-white shadow-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-lg font-black text-slate-900 shadow">✓</span>
          <span>
            <span className="block font-black leading-tight">ফ্রড চেকার</span>
            <span className="block text-[10px] font-medium uppercase tracking-widest text-slate-400">Courier Risk Intelligence</span>
          </span>
          <span className="ml-1 hidden items-center gap-1.5 border-l border-white/15 pl-3 sm:flex">
            <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500">by</span>
            <a href="https://www.zoolyum.com/" target="_blank" rel="noopener noreferrer" title="Zoolyum — zoolyum.com">
              <img src="/zoolyum-logo.svg" alt="Zoolyum" className="h-6 w-auto opacity-90 transition hover:opacity-100" />
            </a>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${path === l.href ? "bg-white/10 text-amber-300" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
              {l.label}
            </Link>
          ))}
          {role && (
            <span className={`ml-1 hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase sm:inline ${role === "superadmin" ? "bg-amber-400/20 text-amber-300" : "bg-white/10 text-slate-300"}`}>
              {role === "superadmin" ? "Super Admin" : role}
            </span>
          )}
          {data?.user?.email && (
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="ml-1 rounded-lg px-3 py-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white" title={data.user.email}>
              বের হন
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
