export type CheckOut = { phone: string; total: number; delivered: number; cancelled: number; successRate: number; riskLevel: string; labelBn?: string; recommendation?: string; couriers: { id: string; name: string; total: number; delivered: number; cancelled: number; rate: number }[]; cached?: boolean; partial?: boolean };
const badge: Record<string, string> = { safe: "bg-emerald-100 text-emerald-800", moderate: "bg-amber-100 text-amber-800", high_risk: "bg-rose-100 text-rose-800" };
export default function ResultCard({ d }: { d: CheckOut }) {
  return (
    <div className="border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold">{d.phone}</span>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${badge[d.riskLevel] ?? badge.moderate}`}>{d.labelBn || d.riskLevel}{d.cached ? " (ক্যাশ)" : ""}</span>
      </div>
      {d.partial && <p className="text-xs font-bold text-amber-700">আংশিক ফলাফল — কোনো কুরিয়ারে ডেটা আসেনি</p>}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="border rounded-xl p-2"><div className="text-[11px]">মোট</div><div className="font-bold">{d.total}</div></div>
        <div className="border rounded-xl p-2"><div className="text-[11px]">ডেলিভারড</div><div className="font-bold text-emerald-600">{d.delivered}</div></div>
        <div className="border rounded-xl p-2"><div className="text-[11px]">রিটার্ন</div><div className="font-bold text-rose-600">{d.cancelled}</div></div>
      </div>
      <p className="text-sm">সাকসেস রেট: <b>{d.successRate}%</b></p>
      {d.recommendation && <p className="text-sm">করণীয়: {d.recommendation}</p>}
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs"><th>কুরিয়ার</th><th>মোট</th><th>ডেলিভারি</th><th>রেট</th></tr></thead>
        <tbody>{d.couriers.map((c) => (<tr key={c.id} className="border-t"><td>{c.name}</td><td>{c.total}</td><td>{c.delivered}</td><td>{c.rate}%</td></tr>))}</tbody>
      </table>
    </div>
  );
}
