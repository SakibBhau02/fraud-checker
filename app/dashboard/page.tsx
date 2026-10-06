"use client";
import { useUser } from "@clerk/nextjs";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type Stats = { today: number; month: number; highRiskMonth: number; remaining: number | null };

export default function Dashboard() {
  const { data: na } = useSession();
  const { user: clerk } = useUser();
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState("");

  const naEmail = na?.user?.email ?? null;
  const name = clerk?.fullName || clerk?.firstName || na?.user?.name || naEmail || "ইউজার";
  const avatar = clerk?.imageUrl ?? null;
  const initial = (name || "?").trim().charAt(0).toUpperCase();

  useEffect(() => {
    fetch("/api/stats").then(async (r) => {
      const j = await r.json();
      if (!r.ok) setErr(j.error_bn || "এরর"); else setS(j);
    }).catch(() => setErr("নেটওয়ার্ক এরর"));
  }, []);

  const cards = [
    { label: "আজ চেক", value: s?.today, ring: "ring-sky-200", bg: "bg-sky-50", tx: "text-sky-700" },
    { label: "এই মাসে", value: s?.month, ring: "ring-violet-200", bg: "bg-violet-50", tx: "text-violet-700" },
    { label: "High Risk", value: s?.highRiskMonth, ring: "ring-rose-200", bg: "bg-rose-50", tx: "text-rose-600" },
  ];
  const remaining = s?.remaining ?? null;
  const pct = remaining === null ? 100 : Math.max(0, Math.min(100, (remaining / 50) * 100));

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      {/* PROFILE */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-500/20 blur-2xl" />
        <div className="flex items-center gap-4">
          {avatar ? (
            <img src={avatar} alt={name} className="h-16 w-16 rounded-2xl object-cover ring-2 ring-amber-400" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-2xl font-black text-slate-900">
              {initial}
            </span>
          )}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">আমার ড্যাশবোর্ড</p>
            <h1 className="text-xl font-black">{name}</h1>
            <p className="text-xs text-slate-400">{clerk?.primaryEmailAddress?.emailAddress ?? naEmail ?? ""}</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">আজ আরও চেক বাকি</span>
            <b className="font-mono">{remaining === null ? "∞ আনলিমিটেড" : `${remaining}টি`}</b>
          </div>
          <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {err && <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</p>}

      <div className="grid grid-cols-3 gap-3 text-center">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-3xl ${c.bg} p-4 shadow-md ring-1 ${c.ring}`}>
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{c.label}</div>
            <div className={`text-3xl font-black ${c.tx}`}>{c.value ?? "…"}</div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border-l-4 border-amber-400 bg-white p-4 text-sm shadow-md">
        💡 <b>টিপস:</b> High-Risk কাস্টমার থেকে ডেলিভারি চার্জ অগ্রিম নিন — প্রতি রিটার্নে ~৳১২০–১৬০ বাঁচবে।
      </div>
    </main>
  );
}
