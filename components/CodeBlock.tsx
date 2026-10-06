"use client";
import { useState } from "react";

export default function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl bg-slate-900 text-slate-100 shadow-md">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{lang}</span>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold transition hover:bg-white/20"
        >
          {copied ? "✓ কপি হয়েছে" : "কপি"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed"><code>{code}</code></pre>
    </div>
  );
}
