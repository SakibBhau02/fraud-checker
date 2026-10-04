export type CheckOut = { phone: string; total: number; delivered: number; cancelled: number; successRate: number; riskLevel: string; labelBn?: string; recommendation?: string; couriers: { id: string; name: string; total: number; delivered: number; cancelled: number; rate: number }[]; cached?: boolean; partial?: boolean };

const badge: Record<string, string> = {
  safe: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  moderate: "bg-amber-100 text-amber-800 ring-amber-200",
  high_risk: "bg-rose-100 text-rose-800 ring-rose-200",
};
const bar: Record<string, string> = {
  safe: "from-emerald-400 to-emerald-600", moderate: "from-amber-400 to-orange-500", high_risk: "from-rose-400 to-rose-600",
};
const statBg: Record<string, string> = {
  safe: "bg-slate-50", moderate: "bg-slate-50", high_risk: "bg-slate-50",
};

export default function ResultCard({ d }: { d: CheckOut }) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-lg bg-slate-900 px-3 py-1.5 font-mono text-base font-black tracking-wide text-white">{d.phone}</span>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${badge[d.riskLevel] ?? badge.moderate}`}>
          {d.labelBn || d.riskLevel}{d.cached ? " · ক্যাশ" : ""}
        </span>
      </div>
      {d.partial && <p className="rounded-xl bg-amber-50 p-2 text-xs font-bold text-amber-700 ring-1 ring-amber-200">⚠ আংশিক ফলাফল — কোনো কুরিয়ারে ডেটা আসেনি</p>}
      <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
        <div className={`rounded-2xl ${statBg[d.riskLevel] ?? statBg.moderate} p-3 ring-1 ring-slate-200`}>
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">মোট পার্সেল</div>
          <div className="text-2xl font-black text-slate-900">{d.total}</div>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
          <div className="text-[11px] font-medium uppercase tracking-wide text-emerald-600">ডেলিভারড</div>
          <div className="text-2xl font-black text-emerald-600">{d.delivered}</div>
        </div>
        <div className="rounded-2xl bg-rose-50 p-3 ring-1 ring-rose-100">
          <div className="text-[11px] font-medium uppercase tracking-wide text-rose-600">রিটার্ন</div>
          <div className="text-2xl font-black text-rose-600">{d.cancelled}</div>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm"><span className="font-medium text-slate-600">সাকসেস রেট</span><b className="font-black">{d.successRate}%</b></div>
        <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
          <div className={`h-full rounded-full bg-gradient-to-r ${bar[d.riskLevel] ?? bar.moderate} transition-all`} style={{ width: `${d.successRate}%` }} />
        </div>
      </div>
      {d.recommendation && (
        <p className="rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-3 text-sm text-slate-700">💡 <b>করণীয়:</b> {d.recommendation}</p>
      )}
      <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-300">
            <th className="p-2.5">কুরিয়ার</th><th className="p-2.5">মোট</th><th className="p-2.5">ডেলিভারি</th><th className="p-2.5">রেট</th>
          </tr></thead>
          <tbody>{d.couriers.map((c, i) => (
            <tr key={c.id} className={i % 2 ? "bg-slate-50" : "bg-white"}>
              <td className="p-2.5 font-medium">{c.name}</td><td className="p-2.5">{c.total}</td><td className="p-2.5">{c.delivered}</td>
              <td className="p-2.5 font-black">{c.rate}%</td>
            </tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}
