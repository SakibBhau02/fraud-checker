"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import ApiKeys from "@/components/ApiKeys";
import Members from "@/components/Members";

export default function Settings() {
  const { data } = useSession();
  const role = (data?.user as unknown as { role?: string } | undefined)?.role;
  const isTeam = Boolean(data?.user?.email);
  const [session, setSession] = useState(""); const [did, setDid] = useState("");
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <div>
        <h1 className="text-2xl font-black">সেটিংস</h1>
        <p className="text-xs text-slate-500">টেস্ট, API key ও টিম ব্যবস্থাপনা</p>
      </div>
      {role === "superadmin" && (
        <div className="space-y-3 rounded-3xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
          <h2 className="font-black">ডেটা সোর্স Session <span className="text-xs font-medium text-amber-600">(শুধু Super Admin)</span></h2>
          <p className="text-sm text-slate-600">লগইন করে cookie থেকে <code className="rounded bg-slate-100 px-1 font-mono">bd_session</code>-এর মান এনে এখানে বসান। Expire হলে এখান থেকেই বদলানো যায় — redeploy লাগে না।</p>
          <input className="w-full rounded-2xl border p-3 font-mono text-xs outline-orange-500" placeholder="bd_session (user:182:...)"
            value={session} onChange={(e) => setSession(e.target.value)} />
          <input className="w-full rounded-2xl border p-3 font-mono text-xs outline-orange-500" placeholder="_bdd_did (ঐচ্ছিক)"
            value={did} onChange={(e) => setDid(e.target.value)} />
          <div className="flex gap-2">
            <button disabled={busy} className="rounded-2xl bg-slate-900 px-5 py-2.5 font-bold text-white disabled:opacity-50" onClick={async () => {
              setMsg(""); setBusy(true);
              const r = await fetch("/api/settings/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session, did }) });
              const j = await r.json();
              setBusy(false);
              setMsg(r.ok ? "✓ সেভ হয়েছে" : (j.error_bn || "এরর"));
            }}>সেভ</button>
            <button disabled={busy} className="rounded-2xl border px-5 py-2.5 font-bold hover:bg-slate-50 disabled:opacity-50" onClick={async () => {
              setMsg("টেস্ট চলছে…"); setBusy(true);
              const r = await fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: "01712345678", fresh: true }) });
              const j = await r.json();
              setBusy(false);
              setMsg(r.ok ? `✓ টেস্ট OK — মোট ${j.total}, সাকসেস ${j.successRate}%` : (j.error_bn || "এরর"));
            }}>টেস্ট চেক</button>
          </div>
          {msg && <p className="rounded-xl bg-slate-50 p-2 text-sm font-medium">{msg}</p>}
        </div>
      )}
      <ApiKeys hidden={!isTeam} hiddenNote="API key শুধু টিম অ্যাকাউন্ট (ইমেইল+পাসওয়ার্ড লগইন) থেকে বানানো যায়।" />
      {role === "superadmin" && <Members />}
    </main>
  );
}
