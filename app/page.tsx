"use client";
import { useState } from "react";
import ResultCard, { CheckOut } from "@/components/ResultCard";

const usps = [
  ["৫ কুরিয়ার, এক স্ক্রিন", "Steadfast, Pathao, REDX, Paperfly, CarryBee — আলাদা পোর্টালে ঢোকার ঝামেলা নেই।"],
  ["১০ সেকেন্ডে রিপোর্ট", "নম্বর দিন, মোট পার্সেল, ডেলিভারি, রিটার্ন ও সাকসেস রেট সাথে সাথে।"],
  ["সম্পূর্ণ গোপন", "কাস্টমারের ফোনে কোনো SMS যায় না। নাম-ঠিকানাও দেখানো হয় না — শুধু অনুপাত।"],
  ["নিজের সাইটে API", "API key দিয়ে আপনার অর্ডার সিস্টেমেই চেক বসান — ডক README-তে।"],
];

const stats: [string, string][] = [
  ["~২০%", "গড় COD রিটার্ন রেট"],
  ["৳১৪০", "প্রতি রিটার্নে গড় ক্ষতি"],
  ["৳৮,৪০০", "মাসিক লস (৩০০ অর্ডারে)"],
  ["৳৫০,৪০০", "বছরে বাঁচবে (অর্ধেক কমালে)"],
];

const steps: [string, string, string][] = [
  ["১", "নম্বর দিন", "কাস্টমারের মোবাইল নম্বর উপরের বক্সে লিখুন।"],
  ["২", "রেকর্ড দেখুন", "Safe / Moderate / High Risk লেবেলসহ পুরো হিস্ট্রি।"],
  ["৩", "সিদ্ধান্ত নিন", "ঝুঁকি থাকলে ডেলিভারি চার্জ অগ্রিম নিয়ে পাঠান।"],
];

const risks: [string, string, string][] = [
  ["নিরাপদ", "bg-emerald-100 text-emerald-800 ring-emerald-200", "সাকসেস ৮০%+ — নির্ভয়ে COD-তে পাঠান।"],
  ["সতর্কতা", "bg-amber-100 text-amber-800 ring-amber-200", "সাকসেস ৫০–৮০% — ফোনে কনফার্ম করে পাঠান।"],
  ["ঝুঁকিপূর্ণ", "bg-rose-100 text-rose-800 ring-rose-200", "সাকসেস ৫০%-এর নিচে — অগ্রিম চার্জ ছাড়া পাঠাবেন না।"],
];

export default function Home() {
  const [phone, setPhone] = useState(""); const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(""); const [data, setData] = useState<CheckOut | null>(null);
  return (
    <main className="bg-white text-slate-900">
      {/* CHECK HERO */}
      <section className="mx-auto max-w-2xl space-y-5 px-4 py-10">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-500/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-orange-600/20 blur-2xl" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">Courier Risk Intelligence</p>
          <h1 className="mt-1 font-serif text-3xl font-black sm:text-4xl">কাস্টমার কি রিটার্ন করার মতো?</h1>
          <p className="mt-1 text-sm text-slate-300">নম্বর দিন — ৫ কুরিয়ারে ডেলিভারি ও রিটার্ন হিস্ট্রি এক জায়গায়।</p>
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
      </section>

      {/* USPs */}
      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">কেন ব্যবহার করবেন</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {usps.map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-black">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-t border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-4 py-12 sm:grid-cols-4">
          {stats.map(([v, l]) => (
            <div key={l}>
              <p className="font-mono text-2xl font-black text-amber-400 sm:text-3xl">{v}</p>
              <p className="mt-1 text-xs text-slate-300">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STEPS + RISK */}
      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">তিন ধাপে যাচাই</p>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map(([n, t, d]) => (
              <div key={n} className="border-t-2 border-slate-900 pt-3">
                <p className="font-mono text-sm font-bold text-amber-600">{n}</p>
                <h3 className="mt-1 font-bold">{t}</h3>
                <p className="mt-1 text-sm text-slate-600">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {risks.map(([t, c, d]) => (
              <div key={t} className="rounded-2xl border border-slate-200 p-4">
                <span className={`rounded-full px-3 py-0.5 text-xs font-bold ring-1 ${c}`}>{t}</span>
                <p className="mt-2 text-sm text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
