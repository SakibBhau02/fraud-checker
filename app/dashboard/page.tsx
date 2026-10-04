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
  const cards = [
    { label: "আজ চেক", value: s?.today, bg: "bg-sky-50", tx: "text-sky-700" },
    { label: "এই মাসে", value: s?.month, bg: "bg-violet-50", tx: "text-violet-700" },
    { label: "High Risk", value: s?.highRiskMonth, bg: "bg-rose-50", tx: "text-rose-600" },
  ];
  return (
    <main className="mx-auto max-w-xl space-y-5 px-4 py-8">
      <h1 className="text-2xl font-black">ড্যাশবোর্ড</h1>
      {err && <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <div className="grid grid-cols-3 gap-3 text-center">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-3xl ${c.bg} p-4 shadow-sm`}>
            <div className="text-[11px] font-medium text-slate-500">{c.label}</div>
            <div className={`text-3xl font-black ${c.tx}`}>{c.value ?? "…"}</div>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border bg-white p-4 text-sm shadow-sm">
        💡 <b>টিপস:</b> High-Risk কাস্টমার থেকে ডেলিভারি চার্জ অগ্রিম নিন — প্রতি রিটার্নে ~৳১২০–১৬০ বাঁচবে।
      </div>
    </main>
  );
}
