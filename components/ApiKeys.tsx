"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type Key = { id: string; label: string; prefix: string; revoked: boolean; lastUsedAt: string | null; createdAt: string; user?: { email: string; name: string } };

export default function ApiKeys({ hidden = false, hiddenNote = "" }: { hidden?: boolean; hiddenNote?: string }) {
  const { data } = useSession();
  const role = (data?.user as unknown as { role?: string } | undefined)?.role;
  const [keys, setKeys] = useState<Key[]>([]);
  const [allKeys, setAllKeys] = useState<Key[]>([]);
  const [label, setLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    const r = await fetch("/api/keys");
    if (r.ok) setKeys((await r.json()).keys);
    if (role === "superadmin") {
      const a = await fetch("/api/admin/keys");
      if (a.ok) setAllKeys((await a.json()).keys);
    }
  }
  useEffect(() => { load(); }, [role]); // eslint-disable-line react-hooks/exhaustive-deps
  async function revoke(id: string, label: string) {
    if (!confirm(`"${label}" বাতিল করবেন?`)) return;
    await fetch(`/api/keys/${id}/revoke`, { method: "POST" });
    load();
  }
  if (hidden) {
    return (
      <div className="space-y-2 rounded-3xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <h2 className="font-black">API Keys</h2>
        <p className="text-sm text-slate-600">{hiddenNote || "API key শুধু টিম অ্যাকাউন্ট থেকে বানানো যায়।"}</p>
        <p className="text-sm">
          <a href="/api-docs" className="font-bold text-amber-700 underline">API ডকস দেখুন →</a>
          <span className="text-slate-400"> · </span>
          <a href="https://www.zoolyum.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-amber-700 underline">সাহায্য লাগলে Zoolyum →</a>
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-3xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
      <h2 className="font-black">API Keys <span className="text-xs font-medium text-slate-400">বাইরের ওয়েবসাইটের জন্য</span></h2>
      <p className="text-sm text-slate-600">
        Endpoint: <code className="rounded bg-slate-100 px-1 font-mono text-xs">POST /api/v1/check</code> — হেডারে{" "}
        <code className="rounded bg-slate-100 px-1 font-mono text-xs">x-api-key: fk_...</code>{" "}
        <a href="/api-docs" className="font-bold text-amber-700 underline">HTML ডকস দেখুন →</a>
      </p>
      <div className="flex items-center justify-between rounded-2xl bg-slate-900 p-3 text-white">
        <p className="text-xs">নিজের সিস্টেমে API বসাতে সাহায্য লাগবে?</p>
        <a href="https://www.zoolyum.com/" target="_blank" rel="noopener noreferrer"
          className="rounded-full bg-amber-400 px-4 py-1.5 text-xs font-black text-slate-900 transition hover:bg-amber-300">
          Zoolyum-এ যোগাযোগ করুন →
        </a>
      </div>
      <div className="flex gap-2">
        <input className="flex-1 rounded-2xl border p-2.5 text-sm outline-orange-500" placeholder="Key-এর নাম (যেমন: mystore.com)"
          value={label} onChange={(e) => setLabel(e.target.value)} />
        <button disabled={busy || !label.trim()} className="rounded-2xl bg-slate-900 px-4 font-bold text-white disabled:opacity-50" onClick={async () => {
          setMsg(""); setBusy(true);
          const r = await fetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label }) });
          const j = await r.json();
          setBusy(false);
          if (!r.ok) { setMsg(j.error_bn || "এরর"); return; }
          setNewKey(j.key); setLabel(""); load();
        }}>+ নতুন Key</button>
      </div>
      {newKey && (
        <div className="space-y-1 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-bold text-emerald-800">✓ এখনই কপি করুন — আর দেখা যাবে না:</p>
          <p className="break-all font-mono text-sm font-bold">{newKey}</p>
        </div>
      )}
      {msg && <p className="text-sm">{msg}</p>}
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-slate-500"><th className="pb-1">নাম</th><th className="pb-1">শেষাংশ</th><th className="pb-1">শেষ ব্যবহার</th><th className="pb-1"></th></tr></thead>
        <tbody>{keys.map((k) => (
          <tr key={k.id} className={`border-t ${k.revoked ? "opacity-50" : ""}`}>
            <td className="py-1.5 font-medium">{k.label}</td>
            <td className="font-mono">…{k.prefix}</td>
            <td className="text-xs text-slate-500">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString("bn-BD") : "—"}</td>
            <td className="text-right">
              {!k.revoked && <button className="text-xs font-bold text-rose-600 underline" onClick={() => revoke(k.id, k.label)}>বাতিল</button>}
              {k.revoked && <span className="text-xs text-slate-400">বাতিল</span>}
            </td>
          </tr>))}
          {keys.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-sm text-slate-400">এখনো কোনো key নেই</td></tr>}
        </tbody>
      </table>
      {role === "superadmin" && (
        <div className="pt-2">
          <h3 className="text-sm font-black">সব ইউজারের Keys <span className="text-xs font-medium text-amber-600">(Super Admin)</span></h3>
          <table className="mt-1 w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500"><th className="pb-1">নাম</th><th className="pb-1">ইউজার</th><th className="pb-1">শেষাংশ</th><th className="pb-1"></th></tr></thead>
            <tbody>{allKeys.map((k) => (
              <tr key={k.id} className={`border-t ${k.revoked ? "opacity-50" : ""}`}>
                <td className="py-1.5 font-medium">{k.label}</td>
                <td className="text-xs text-slate-500">{k.user?.email}</td>
                <td className="font-mono">…{k.prefix}</td>
                <td className="text-right">
                  {!k.revoked && <button className="text-xs font-bold text-rose-600 underline" onClick={() => revoke(k.id, k.label)}>বাতিল</button>}
                  {k.revoked && <span className="text-xs text-slate-400">বাতিল</span>}
                </td>
              </tr>))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
