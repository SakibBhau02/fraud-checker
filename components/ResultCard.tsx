export type CheckOut = { phone: string; total: number; delivered: number; cancelled: number; successRate: number; riskLevel: string; labelBn?: string; recommendation?: string; couriers: { id: string; name: string; total: number; delivered: number; cancelled: number; rate: number }[]; cached?: boolean; partial?: boolean };

const badge: Record<string, string> = {
  safe: "bg-emerald-100 text-emerald-800 border-emerald-200",
  moderate: "bg-amber-100 text-amber-800 border-amber-200",
  high_risk: "bg-rose-100 text-rose-800 border-rose-200",
};
const bar: Record<string, string> = {
  safe: "bg-emerald-500", moderate: "bg-amber-500", high_risk: "bg-rose-500",
};

export default function ResultCard({ d }: { d: CheckOut }) {
  return (
    <div className="space-y-4 rounded-3xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-mono text-lg font-black tracking-wide">{d.phone}</span>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badge[d.riskLevel] ?? badge.moderate}`}>
          {d.labelBn || d.riskLevel}{d.cached ? " · ক্যাশ" : ""}
        </span>
      </div>
      {d.partial && <p className="rounded-xl bg-amber-50 p-2 text-xs font-bold text-amber-700">⚠ আংশিক ফলাফল — কোনো কুরিয়ারে ডেটা আসেনি</p>}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-slate-50 p-3"><div className="text-[11px] text-slate-500">মোট পার্সেল</div><div className="text-xl font-black">{d.total}</div></div>
        <div className="rounded-2xl bg-emerald-50 p-3"><div className="text-[11px] text-emerald-600">ডেলিভারড</div><div className="text-xl font-black text-emerald-600">{d.delivered}</div></div>
        <div className="rounded-2xl bg-rose-50 p-3"><div className="text-[11px] text-rose-600">রিটার্ন</div><div className="text-xl font-black text-rose-600">{d.cancelled}</div></div>
      </div>
      <div>
        <div className="flex justify-between text-sm"><span>সাকসেস রেট</span><b>{d.successRate}%</b></div>
        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${bar[d.riskLevel] ?? bar.moderate}`} style={{ width: `${d.successRate}%` }} />
        </div>
      </div>
      {d.recommendation && <p className="rounded-2xl bg-slate-50 p-3 text-sm">💡 <b>করণীয়:</b> {d.recommendation}</p>}
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-slate-500"><th className="pb-1">কুরিয়ার</th><th className="pb-1">মোট</th><th className="pb-1">ডেলিভারি</th><th className="pb-1">রেট</th></tr></thead>
        <tbody>{d.couriers.map((c) => (
          <tr key={c.id} className="border-t">
            <td className="py-1.5 font-medium">{c.name}</td><td>{c.total}</td><td>{c.delivered}</td>
            <td><span className="font-bold">{c.rate}%</span></td>
          </tr>))}</tbody>
      </table>
    </div>
  );
}
