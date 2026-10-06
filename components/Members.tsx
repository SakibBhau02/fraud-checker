"use client";
import { useEffect, useState } from "react";

type User = { id: string; name: string; email: string; role: string; createdAt: string; _count: { checks: number; apiKeys: number } };

export default function Members() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); const [role, setRole] = useState("member");
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  async function load() {
    const r = await fetch("/api/admin/users");
    if (r.ok) setUsers((await r.json()).users);
  }
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-3 rounded-3xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
      <h2 className="font-black">টিম মেম্বার <span className="text-xs font-medium text-amber-600">(Super Admin)</span></h2>
      <p className="text-sm text-slate-600">মেম্বাররা নম্বর চেক ও API key বানাতে পারবে — কিন্তু ডেটা সোর্স cookie বসাতে পারবে না।</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="rounded-2xl border p-2.5 text-sm outline-amber-500" placeholder="নাম" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="rounded-2xl border p-2.5 text-sm outline-amber-500" placeholder="ইমেইল" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="rounded-2xl border p-2.5 text-sm outline-amber-500" placeholder="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex gap-2">
          <select className="flex-1 rounded-2xl border p-2.5 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="member">member</option>
            <option value="admin">admin</option>
          </select>
          <button disabled={busy} className="rounded-2xl bg-slate-900 px-4 font-bold text-white disabled:opacity-50" onClick={async () => {
            setMsg(""); setBusy(true);
            const r = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password, role }) });
            const j = await r.json();
            setBusy(false);
            if (!r.ok) { setMsg(j.error_bn || "এরর"); return; }
            setMsg(`✓ ${j.email} তৈরি হয়েছে (${j.role})`);
            setName(""); setEmail(""); setPassword(""); load();
          }}>+ যোগ করুন</button>
        </div>
      </div>
      {msg && <p className="rounded-xl bg-slate-50 p-2 text-sm font-medium">{msg}</p>}
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-slate-500"><th className="pb-1">নাম</th><th className="pb-1">ইমেইল</th><th className="pb-1">রোল</th><th className="pb-1">চেক/keys</th><th className="pb-1"></th></tr></thead>
        <tbody>{users.map((u) => (
          <tr key={u.id} className="border-t">
            <td className="py-1.5 font-medium">{u.name}</td>
            <td className="text-xs">{u.email}</td>
            <td><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${u.role === "superadmin" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{u.role}</span></td>
            <td className="text-xs text-slate-500">{u._count.checks}/{u._count.apiKeys}</td>
            <td className="text-right">
              {u.role !== "superadmin" && <button className="text-xs font-bold text-rose-600 underline" onClick={async () => {
                if (!confirm(`"${u.email}" ডিলিট করবেন? তার keys ও হিস্ট্রি মুছে যাবে।`)) return;
                const r = await fetch(`/api/admin/users?id=${u.id}`, { method: "DELETE" });
                const j = await r.json();
                setMsg(r.ok ? "✓ ডিলিট হয়েছে" : (j.error_bn || "এরর"));
                load();
              }}>ডিলিট</button>}
            </td>
          </tr>))}
        </tbody>
      </table>
    </div>
  );
}
