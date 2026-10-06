import Link from "next/link";
import CodeBlock from "@/components/CodeBlock";

const SITE = "https://YOUR-DOMAIN";

const curl = `curl -X POST ${SITE}/api/v1/check \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: fk_YOUR_KEY" \\
  -d '{"phone":"01712345678"}'`;

const js = `const res = await fetch("${SITE}/api/v1/check", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "fk_YOUR_KEY", // অথবা Authorization: Bearer fk_YOUR_KEY
  },
  body: JSON.stringify({ phone: "01712345678" }),
});
const data = await res.json();

if (data.riskLevel === "high_risk") {
  // অগ্রিম ডেলিভারি চার্জ চান
} else if (data.riskLevel === "moderate") {
  // ফোনে কনফার্ম করে পাঠান
}
// data.successRate → সাকসেস % (0–100)
// data.total / data.delivered / data.cancelled`;

const php = `<?php
$ch = curl_init("${SITE}/api/v1/check");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Content-Type: application/json",
    "x-api-key: fk_YOUR_KEY",
  ],
  CURLOPT_POSTFIELDS => json_encode(["phone" => $customerPhone]),
]);
$data = json_decode(curl_exec($ch), true);

if (($data["riskLevel"] ?? "") === "high_risk") {
  // অগ্রিম ডেলিভারি চার্জ চান
} elseif (($data["riskLevel"] ?? "") === "moderate") {
  // ফোনে কনফার্ম করে পাঠান
}`;

const python = `import urllib.request, json

req = urllib.request.Request(
    "${SITE}/api/v1/check",
    data=json.dumps({"phone": "01712345678"}).encode(),
    headers={
        "Content-Type": "application/json",
        "x-api-key": "fk_YOUR_KEY",
    },
)
data = json.loads(urllib.request.urlopen(req, timeout=30).read())

if data["riskLevel"] == "high_risk":
    # অগ্রিম ডেলিভারি চার্জ চান
    pass
print(data["successRate"], data["total"])`;

const response = `{
  "phone": "01712345678",
  "total": 413,
  "delivered": 228,
  "cancelled": 185,
  "successRate": 55,
  "riskLevel": "high_risk",       // safe | moderate | high_risk
  "labelBn": "উচ্চ ঝুঁকি (High Risk)",
  "recommendation": "অগ্রিম কুরিয়ার চার্জ...",
  "couriers": [
    { "id": "pathao", "name": "Pathao Courier",
      "total": 397, "delivered": 221, "cancelled": 176, "rate": 56 }
  ],
  "partial": false,               // কোনো কুরিয়ারে ডেটা না এলে true
  "cached": false,                // ২৪ ঘণ্টার ক্যাশ থেকে এলে true
  "checkedAt": "2026-10-06T..."
}`;

function Step({ no, title, children }: { no: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-t-2 border-slate-900 pt-3">
      <p className="font-mono text-sm font-bold text-amber-600">{no}</p>
      <h3 className="mt-1 font-bold">{title}</h3>
      <div className="mt-1 text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
  );
}

export default function ApiDocs() {
  return (
    <main className="bg-white text-slate-900">
      <section className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">Developer Docs</p>
        <h1 className="mt-2 font-serif text-4xl font-black">Fraud Check API</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
          আপনার ওয়েবসাইট বা অর্ডার সিস্টেম থেকে একটা HTTP কলে কাস্টমারের ডেলিভারি
          রিস্ক জেনে নিন — অর্ডার কনফার্ম, পেমেন্ট বা ডেলিভারি ফ্লোতে সরাসরি ব্যবহারযোগ্য।
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <Step no="১" title="Key নিন">
            লগইন করে <Link href="/settings" className="font-bold underline">সেটিংস → API Keys</Link> থেকে
            key বানান (<code className="rounded bg-slate-100 px-1 font-mono text-xs">fk_...</code>)।
          </Step>
          <Step no="২" title="কল করুন">
            নিচের endpoint-এ নম্বর পাঠান — হেডারে key, body-তে phone।
          </Step>
          <Step no="৩" title="সিদ্ধান্ত নিন">
            <code className="rounded bg-slate-100 px-1 font-mono text-xs">riskLevel</code> দেখে অগ্রিম
            চার্জ বা COD ঠিক করুন।
          </Step>
        </div>

        <h2 className="mt-12 font-serif text-2xl font-black">Endpoint</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm">
          <span className="rounded-lg bg-emerald-600 px-2 py-0.5 text-xs font-black text-white">POST</span>
          <span>/api/v1/check</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-4 text-sm">
            <p className="font-bold">Headers</p>
            <p className="mt-1 font-mono text-xs">x-api-key: fk_YOUR_KEY</p>
            <p className="mt-1 text-xs text-slate-500">অথবা Authorization: Bearer fk_YOUR_KEY</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 text-sm">
            <p className="font-bold">Body (JSON)</p>
            <p className="mt-1 font-mono text-xs">{'{ "phone": "01712345678" }'}</p>
            <p className="mt-1 text-xs text-slate-500">fresh: true দিলে ক্যাশ ছাড়াই ফ্রেশ চেক</p>
          </div>
        </div>

        <h2 className="mt-12 font-serif text-2xl font-black">উদাহরণ</h2>
        <div className="mt-4 space-y-4">
          <CodeBlock lang="cURL" code={curl} />
          <CodeBlock lang="JavaScript" code={js} />
          <CodeBlock lang="PHP" code={php} />
          <CodeBlock lang="Python" code={python} />
        </div>

        <h2 className="mt-12 font-serif text-2xl font-black">রেসপন্স</h2>
        <div className="mt-4"><CodeBlock lang="JSON · 200 OK" code={response} /></div>

        <h2 className="mt-12 font-serif text-2xl font-black">এরর কোড</h2>
        <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-900 text-left text-xs uppercase tracking-wide text-slate-300">
              <th className="p-3">কোড</th><th className="p-3">মানে</th><th className="p-3">করণীয়</th>
            </tr></thead>
            <tbody>
              {[
                ["401", "key ভুল / নেই / বাতিল", "সেটিংস থেকে নতুন key নিন"],
                ["400", "নম্বর ভুল ফরম্যাট", "১১ সংখ্যার 01XXXXXXXXX পাঠান"],
                ["502", "ParcelVai থেকে ডেটা আসেনি", "কিছুক্ষণ পর আবার চেষ্টা করুন"],
                ["504", "উত্তর আসতে দেরি", "timeout বাড়িয়ে retry করুন"],
              ].map(([c, m, a], i) => (
                <tr key={c} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="p-3 font-mono font-black">{c}</td><td className="p-3">{m}</td><td className="p-3 text-slate-600">{a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 rounded-3xl bg-slate-900 p-6 text-white">
          <p className="font-bold">প্রতিটি API চেক হিস্ট্রিতে সেভ হয়</p>
          <p className="mt-1 text-sm text-slate-300">কোন key দিয়ে কখন চেক হলো — ড্যাশবোর্ড ও হিস্ট্রিতে দেখা যাবে। key হারালে সেটিংস থেকে বাতিল করে নতুন নিন।</p>
          <Link href="/settings" className="mt-4 inline-block rounded-full bg-amber-400 px-6 py-2.5 text-sm font-black text-slate-900 transition hover:bg-amber-300">
            API Key বানান →
          </Link>
        </div>
      </section>
    </main>
  );
}
