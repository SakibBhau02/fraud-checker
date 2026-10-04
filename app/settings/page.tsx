"use client";
import { useState } from "react";

export default function Settings() {
  const [session, setSession] = useState(""); const [did, setDid] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-black">সেটিংস (admin)</h1>
      <p className="text-sm">ParcelVai-তে লগইন করে cookie থেকে <code>bd_session</code>-এর মান এনে এখানে বসান। Expire হলে এখান থেকেই বদলানো যায়, redeploy লাগে না।</p>
      <input className="w-full border rounded-xl p-2 font-mono text-xs" placeholder="bd_session (user:182:...)" value={session} onChange={(e) => setSession(e.target.value)} />
      <input className="w-full border rounded-xl p-2 font-mono text-xs" placeholder="_bdd_did (ঐচ্ছিক)" value={did} onChange={(e) => setDid(e.target.value)} />
      <div className="flex gap-2">
        <button className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold" onClick={async () => {
          setMsg("");
          const r = await fetch("/api/settings/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session, did }) });
          const j = await r.json();
          setMsg(r.ok ? "সেভ হয়েছে ✓" : (j.error_bn || "এরর"));
        }}>সেভ</button>
        <button className="border px-4 py-2 rounded-xl" onClick={async () => {
          setMsg("টেস্ট চলছে…");
          const r = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: "01712345678", fresh: true }) });
          const j = await r.json();
          setMsg(r.ok ? `টেস্ট OK — মোট ${j.total}, সাকসেস ${j.successRate}%` : (j.error_bn || "এরর"));
        }}>টেস্ট চেক</button>
      </div>
      {msg && <p className="text-sm">{msg}</p>}
      <a className="text-sm underline" href="/">← চেক পেজ</a>
    </main>
  );
}
