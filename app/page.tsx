"use client";
import { useState } from "react";
import ResultCard, { CheckOut } from "@/components/ResultCard";

export default function Home() {
  const [phone, setPhone] = useState(""); const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(""); const [data, setData] = useState<CheckOut | null>(null);
  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-black">ফ্রড চেক</h1>
      <form className="flex gap-2" onSubmit={async (e) => {
        e.preventDefault(); setErr(""); setData(null); setLoading(true);
        try {
          const r = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
          const j = await r.json();
          if (!r.ok) setErr(j.error_bn || "এরর হয়েছে");
          else setData(j);
        } catch { setErr("নেটওয়ার্ক এরর"); } finally { setLoading(false); }
      }}>
        <input className="flex-1 border rounded-xl p-2 font-mono" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button disabled={loading} className="bg-orange-600 text-white px-4 rounded-xl font-bold disabled:opacity-50">{loading ? "..." : "চেক"}</button>
      </form>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {data && <ResultCard d={data} />}
      <nav className="flex gap-3 text-sm"><a className="underline" href="/history">হিস্ট্রি</a><a className="underline" href="/dashboard">ড্যাশবোর্ড</a></nav>
    </main>
  );
}
