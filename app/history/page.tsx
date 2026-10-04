"use client";
import { useEffect, useState } from "react";

type Row = { id: string; phone: string; totalOrders: number; successRate: number; riskLevel: string; createdAt: string; checkedBy: { email: string; name: string } | null };

export default function History() {
  const [q, setQ] = useState(""); const [risk, setRisk] = useState("");
  const [rows, setRows] = useState<Row[]>([]); const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1); const [err, setErr] = useState("");
  async function load(p = 1) {
    setErr("");
    const r = await fetch(`/api/history?q=${encodeURIComponent(q)}&risk=${risk}&page=${p}`);
    const j = await r.json();
    if (!r.ok) { setErr(j.error_bn || "এরর"); return; }
    setRows(j.rows); setPage(j.page); setPages(j.pages);
  }
  useEffect(() => { load(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-black">চেক হিস্ট্রি</h1>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); load(1); }}>
        <input className="flex-1 border rounded-xl p-2 font-mono" placeholder="নম্বর সার্চ" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="border rounded-xl p-2" value={risk} onChange={(e) => setRisk(e.target.value)}>
          <option value="">সব রিস্ক</option>
          <option value="safe">Safe</option>
          <option value="moderate">Moderate</option>
          <option value="high_risk">High Risk</option>
        </select>
        <button className="bg-orange-600 text-white px-4 rounded-xl font-bold">খুঁজুন</button>
      </form>
      <a className="text-sm underline" href="/api/history/export">CSV ডাউনলোড</a>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs"><th>নম্বর</th><th>মোট</th><th>সাকসেস%</th><th>রিস্ক</th><th>সময়</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id} className="border-t">
            <td className="font-mono">{r.phone}</td><td>{r.totalOrders}</td>
            <td>{r.successRate}%</td><td>{r.riskLevel}</td>
            <td>{new Date(r.createdAt).toLocaleString("bn-BD")}</td>
          </tr>))}</tbody>
      </table>
      <div className="flex gap-2 text-sm">
        <button disabled={page <= 1} className="underline disabled:opacity-40" onClick={() => load(page - 1)}>আগে</button>
        <span>{page} / {pages}</span>
        <button disabled={page >= pages} className="underline disabled:opacity-40" onClick={() => load(page + 1)}>পরে</button>
      </div>
      <a className="text-sm underline" href="/">← চেক পেজ</a>
    </main>
  );
}
