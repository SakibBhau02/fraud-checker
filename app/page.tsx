"use client";
import { useState } from "react";
import ResultCard, { CheckOut } from "@/components/ResultCard";

export default function Home() {
  const [phone, setPhone] = useState(""); const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(""); const [data, setData] = useState<CheckOut | null>(null);
  return (
    <main className="mx-auto max-w-xl space-y-5 px-4 py-8">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-black">কাস্টমার কি রিটার্ন করার মতো?</h1>
        <p className="mt-1 text-sm text-orange-50">নম্বর দিন — ডেলিভারি ও রিটার্ন হিস্ট্রি এক জায়গায় দেখুন।</p>
        <form className="mt-4 flex gap-2" onSubmit={async (e) => {
          e.preventDefault(); setErr(""); setData(null); setLoading(true);
          try {
            const r = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
            const j = await r.json();
            if (!r.ok) setErr(j.error_bn || "এরর হয়েছে");
            else setData(j);
          } catch { setErr("নেটওয়ার্ক এরর"); } finally { setLoading(false); }
        }}>
          <div className="flex flex-1 items-center overflow-hidden rounded-2xl bg-white">
            <span className="pl-3 font-bold text-slate-500">+88</span>
            <input className="w-full p-3 font-mono text-slate-900 outline-none" placeholder="01XXXXXXXXX"
              value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" />
          </div>
          <button disabled={loading}
            className="rounded-2xl bg-slate-900 px-5 font-bold text-white shadow transition hover:bg-slate-700 disabled:opacity-50">
            {loading ? "…" : "চেক"}
          </button>
        </form>
      </div>
      {err && <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      {data && <ResultCard d={data} />}
    </main>
  );
}
