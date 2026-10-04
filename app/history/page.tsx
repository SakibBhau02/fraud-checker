"use client";
import { useEffect, useState } from "react";

type Row = { id: string; phone: string; totalOrders: number; successRate: number; riskLevel: string; createdAt: string; checkedBy: { email: string; name: string } | null };

const riskStyle: Record<string, string> = {
  safe: "bg-emerald-100 text-emerald-800",
  moderate: "bg-amber-100 text-amber-800",
  high_risk: "bg-rose-100 text-rose-800",
};

export default function History() {
  const [q, setQ] = useState(""); const [risk, setRisk] = useState("");
  const [rows, setRows] = useState<Row[]>([]); const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1); const [err, setErr] = useState("");
  const [total, setTotal] = useState(0);
  async function load(p = 1) {
    setErr("");
    const r = await fetch(`/api/history?q=${encodeURIComponent(q)}&risk=${risk}&page=${p}`);
    const j = await r.json();
    if (!r.ok) { setErr(j.error_bn || "এরর"); return; }
    setRows(j.rows); setPage(j.page); setPages(j.pages); setTotal(j.total);
  }
  useEffect(() => { load(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">চেক হিস্ট্রি</h1>
          <p className="text-xs text-slate-500">মোট {total}টি রেকর্ড</p>
        </div>
        <a className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow hover:bg-slate-700" href="/api/history/export">⬇ CSV</a>
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); load(1); }}>
        <input className="flex-1 rounded-2xl border bg-white p-2.5 font-mono shadow-sm outline-orange-500" placeholder="নম্বর সার্চ…"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="rounded-2xl border bg-white p-2.5 shadow-sm" value={risk} onChange={(e) => setRisk(e.target.value)}>
          <option value="">সব রিস্ক</option>
          <option value="safe">Safe</option>
          <option value="moderate">Moderate</option>
          <option value="high_risk">High Risk</option>
        </select>
        <button className="rounded-2xl bg-slate-900 px-4 font-bold text-white">খুঁজুন</button>
      </form>
      {err && <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-300">
            <th className="p-3">নম্বর</th><th className="p-3">মোট</th><th className="p-3">সাকসেস</th><th className="p-3">রিস্ক</th><th className="p-3">সময়</th>
          </tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={r.id} className={i % 2 ? "bg-slate-50 hover:bg-amber-50" : "hover:bg-amber-50"}>
              <td className="p-3 font-mono font-bold">{r.phone}</td><td className="p-3">{r.totalOrders}</td>
              <td className="p-3 font-bold">{r.successRate}%</td>
              <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${riskStyle[r.riskLevel] ?? riskStyle.moderate}`}>{r.riskLevel}</span></td>
              <td className="p-3 text-xs text-slate-500">{new Date(r.createdAt).toLocaleString("bn-BD")}</td>
            </tr>))}
            {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">এখনো কোনো চেক নেই — প্রথমে নম্বর চেক করুন</td></tr>}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} className="rounded-lg border bg-white px-3 py-1 disabled:opacity-40" onClick={() => load(page - 1)}>← আগে</button>
          <span className="font-bold">{page} / {pages}</span>
          <button disabled={page >= pages} className="rounded-lg border bg-white px-3 py-1 disabled:opacity-40" onClick={() => load(page + 1)}>পরে →</button>
        </div>
      )}
    </main>
  );
}
