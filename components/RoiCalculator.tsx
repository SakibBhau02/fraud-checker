"use client";
import { useState } from "react";

const fmt = (n: number) => "৳" + Math.round(n).toLocaleString("en-US");

export default function Calculator() {
  const [orders, setOrders] = useState(300);
  const [rate, setRate] = useState(20);
  const [cost, setCost] = useState(140);
  const monthlyLoss = (orders * rate) / 100;
  const monthlyTk = monthlyLoss * cost;
  const yearlyTk = monthlyTk * 12;
  const saved = yearlyTk / 2;
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="space-y-7">
        <div>
          <div className="flex justify-between text-sm"><span className="text-slate-600">মাসে মোট অর্ডার</span><b className="font-mono">{orders}টি</b></div>
          <input type="range" min={20} max={3000} step={10} value={orders} onChange={(e) => setOrders(+e.target.value)} className="mt-2 w-full accent-slate-900" />
        </div>
        <div>
          <div className="flex justify-between text-sm"><span className="text-slate-600">গড় রিটার্ন রেট</span><b className="font-mono">{rate}%</b></div>
          <input type="range" min={5} max={50} value={rate} onChange={(e) => setRate(+e.target.value)} className="mt-2 w-full accent-slate-900" />
        </div>
        <div>
          <div className="flex justify-between text-sm"><span className="text-slate-600">প্রতি রিটার্নে ক্ষতি (কুরিয়ার + প্যাকেজিং)</span><b className="font-mono">{fmt(cost)}</b></div>
          <input type="range" min={80} max={300} step={10} value={cost} onChange={(e) => setCost(+e.target.value)} className="mt-2 w-full accent-slate-900" />
        </div>
      </div>
      <div className="space-y-3 rounded-3xl bg-slate-900 p-6 text-white sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">আপনার হিসাব</p>
        <div className="flex justify-between border-b border-white/10 pb-3 text-sm"><span className="text-slate-300">মাসে রিটার্ন</span><b className="font-mono">{Math.round(monthlyLoss)}টি</b></div>
        <div className="flex justify-between border-b border-white/10 pb-3 text-sm"><span className="text-slate-300">মাসিক ক্ষতি</span><b className="font-mono">{fmt(monthlyTk)}</b></div>
        <div className="flex justify-between border-b border-white/10 pb-3 text-sm"><span className="text-slate-300">বছরে ক্ষতি</span><b className="font-mono text-rose-300">{fmt(yearlyTk)}</b></div>
        <div className="pt-1">
          <p className="text-sm text-slate-300">রিটার্ন অর্ধেক কমাতে পারলে বছরে বাঁচবে</p>
          <p className="font-mono text-4xl font-black text-amber-400">{fmt(saved)}</p>
        </div>
      </div>
    </div>
  );
}
