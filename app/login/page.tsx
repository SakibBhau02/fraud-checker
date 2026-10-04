"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const r = useRouter();
  return (
    <main className="grid min-h-[80vh] place-items-center bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4">
      <form className="w-full max-w-sm space-y-4 rounded-3xl border bg-white p-8 shadow-xl" onSubmit={async (e) => {
        e.preventDefault(); setErr(""); setLoading(true);
        const res = await signIn("credentials", { email, password, redirect: false });
        setLoading(false);
        if (res?.ok) r.push("/"); else setErr("ইমেইল বা পাসওয়ার্ড ভুল");
      }}>
        <div className="text-center">
          <span className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-xl font-black text-white shadow">✓</span>
          <h1 className="mt-3 text-xl font-black">ফ্রড চেকার</h1>
          <p className="text-sm text-slate-500">টিম অ্যাকাউন্টে লগইন করুন</p>
        </div>
        <input className="w-full rounded-2xl border p-3 outline-orange-500" placeholder="ইমেইল" type="email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded-2xl border p-3 outline-orange-500" type="password" placeholder="পাসওয়ার্ড"
          value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="rounded-xl bg-red-50 p-2 text-center text-sm text-red-600">{err}</p>}
        <button disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-3 font-bold text-white shadow transition hover:opacity-90 disabled:opacity-50">
          {loading ? "ঢুকছি…" : "লগইন"}
        </button>
      </form>
    </main>
  );
}
