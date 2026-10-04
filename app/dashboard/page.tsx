"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [s, setS] = useState<{ today: number; month: number; highRiskMonth: number } | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/stats").then(async (r) => {
      const j = await r.json();
      if (!r.ok) setErr(j.error_bn || "এরর"); else setS(j);
    }).catch(() => setErr("নেটওয়ার্ক এরর"));
  }, []);
  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-black">ড্যাশবোর্ড</h1>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="border rounded-xl p-3"><div className="text-[11px]">আজ চেক</div><div className="font-black text-xl">{s?.today ?? "…"}</div></div>
        <div className="border rounded-xl p-3"><div className="text-[11px]">এই মাসে</div><div className="font-black text-xl">{s?.month ?? "…"}</div></div>
        <div className="border rounded-xl p-3"><div className="text-[11px]">High Risk</div><div className="font-black text-xl text-rose-600">{s?.highRiskMonth ?? "…"}</div></div>
      </div>
      <nav className="flex gap-3 text-sm"><a className="underline" href="/">চেক</a><a className="underline" href="/history">হিস্ট্রি</a></nav>
    </main>
  );
}
