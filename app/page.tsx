"use client";
import { useState } from "react";
import ResultCard, { CheckOut } from "@/components/ResultCard";

export default function Home() {
  const [phone, setPhone] = useState(""); const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(""); const [data, setData] = useState<CheckOut | null>(null);
  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-500/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-orange-600/20 blur-2xl" />
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">Courier Risk Intelligence</p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">কাস্টমার কি রিটার্ন করার মতো?</h1>
        <p className="mt-1 text-sm text-slate-300">Steadfast · Pathao · REDX · Paperfly · CarryBee — ডেলিভারি ও রিটার্ন হিস্ট্রি এক জায়গায়।</p>
        <form className="relative mt-5 flex gap-2" onSubmit={async (e) => {
          e.preventDefault(); setErr(""); setData(null); setLoading(true);
          try {
            const r = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
            const j = await r.json();
            if (!r.ok) setErr(j.error_bn || "এরর হয়েছে");
            else setData(j);
          } catch { setErr("নেটওয়ার্ক এরর"); } finally { setLoading(false); }
        }}>
          <div className="flex flex-1 items-center overflow-hidden rounded-2xl bg-white ring-amber-400 focus-within:ring-2">
            <span className="border-r border-slate-200 pl-3 pr-2 font-bold text-slate-500">+88</span>
            <input className="w-full p-3 font-mono text-slate-900 outline-none" placeholder="01XXXXXXXXX"
              value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" />
          </div>
          <button disabled={loading}
            className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 font-black text-slate-900 shadow-lg transition hover:brightness-110 disabled:opacity-50">
            {loading ? "…" : "চেক"}
          </button>
        </form>
      </div>
      {err && <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{err}</p>}
      {data && <ResultCard d={data} />}
    </main>
  );
}
