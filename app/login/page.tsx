"use client";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function Form() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const r = useRouter();
  const next = useSearchParams().get("callbackUrl") || "/";
  return (
    <form className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-8 shadow-2xl" onSubmit={async (e) => {
      e.preventDefault(); setErr(""); setLoading(true);
      const res = await signIn("credentials", { email, password, redirect: false });
      setLoading(false);
      if (res?.ok) r.push(next); else setErr("ইমেইল বা পাসওয়ার্ড ভুল");
    }}>
      <div className="text-center">
        <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-slate-900 text-2xl font-black text-amber-400 shadow-lg">✓</span>
        <h1 className="mt-3 text-2xl font-black text-slate-900">ফ্রড চেকার</h1>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Courier Risk Intelligence</p>
      </div>
      <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-amber-500" placeholder="ইমেইল" type="email" autoComplete="off"
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 outline-amber-500" type="password" placeholder="পাসওয়ার্ড" autoComplete="new-password"
        value={password} onChange={(e) => setPassword(e.target.value)} />
      {err && <p className="rounded-xl bg-red-50 p-2 text-center text-sm font-medium text-red-600 ring-1 ring-red-200">{err}</p>}
      <button disabled={loading} className="w-full rounded-2xl bg-slate-900 p-3 font-black text-white shadow transition hover:bg-slate-700 disabled:opacity-50">
        {loading ? "ঢুকছি…" : "লগইন"}
      </button>
    </form>
  );
}

export default function Login() {
  return (
    <main className="grid min-h-[70vh] place-items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Suspense><Form /></Suspense>
    </main>
  );
}
