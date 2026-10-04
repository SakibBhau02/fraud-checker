"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState(""); const r = useRouter();
  return (
    <main className="min-h-screen grid place-items-center p-4">
      <form className="w-full max-w-sm space-y-3 border rounded-2xl p-6" onSubmit={async (e) => {
        e.preventDefault(); setErr("");
        const res = await signIn("credentials", { email, password, redirect: false });
        if (res?.ok) r.push("/"); else setErr("ইমেইল বা পাসওয়ার্ড ভুল");
      }}>
        <h1 className="font-bold text-lg">ফ্রড চেকার লগইন</h1>
        <input className="w-full border rounded-xl p-2" placeholder="ইমেইল" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded-xl p-2" type="password" placeholder="পাসওয়ার্ড" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="w-full bg-orange-600 text-white rounded-xl p-2 font-bold">লগইন</button>
      </form>
    </main>
  );
}
