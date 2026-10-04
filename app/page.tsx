import Link from "next/link";
import RoiCalculator from "@/components/RoiCalculator";

function SectionLabel({ no, text }: { no: string; text: string }) {
  return (
    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">
      <span className="mr-2 font-mono text-amber-600">{no}</span>{text}
    </p>
  );
}

const faqs = [
  { q: "ডেটা কোথা থেকে আসে?", a: "Steadfast, Pathao, REDX, Paperfly ও CarryBee-এর মার্চেন্ট API থেকে ওই নম্বরের ডেলিভারি ও রিটার্ন হিস্ট্রি এক জায়গায় আনা হয়। নাম, ঠিকানা বা কী কিনেছেন — এসব দেখানো বা সংরক্ষণ করা হয় না, শুধু ডেলিভারি অনুপাত।" },
  { q: "কাস্টমার কি জানতে পারবে আমি চেক করেছি?", a: "না। চেক সম্পূর্ণ গোপন — কাস্টমারের ফোনে কোনো SMS/নোটিফিকেশন যায় না।" },
  { q: "High Risk মানে কি অর্ডার বাতিল করব?", a: "না। High Risk মানে অগ্রিম ডেলিভারি চার্জ নিয়ে অর্ডার কনফার্ম করুন। টাকা আগাম পেলে রিটার্ন হলেও আপনার ক্ষতি হয় না।" },
  { q: "আমার ওয়েবসাইটে কি এটা বসানো যাবে?", a: "হ্যাঁ। প্রতিটি টিম মেম্বার সেটিংস থেকে API key বানিয়ে নিজের ওয়েবসাইট/অর্ডার সিস্টেমে যুক্ত করতে পারবেন — ডকুমেন্টেশন README-তে আছে।" },
];

export default function Landing() {
  return (
    <main className="bg-white text-slate-900">
      {/* HERO */}
      <section className="mx-auto max-w-4xl px-4 pb-16 pt-16 sm:pt-24">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">Courier Risk Intelligence — Bangladesh</p>
        <h1 className="mt-4 font-serif text-4xl font-black leading-tight sm:text-6xl">
          পার্সেল পাঠানোর আগে,<br />জেনে নিন কে <span className="underline decoration-amber-400 decoration-4 underline-offset-8">ফেরত পাঠাবে।</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          বাংলাদেশে ক্যাশ অন ডেলিভারির প্রতি ৫টি অর্ডারের প্রায় ১টি ফেরত আসে — আর প্রতিটি
          ফেরত মানে কুরিয়ার চার্জ ও প্যাকেজিং মিলিয়ে <b>৳১২০–১৬০ সরাসরি লস</b>। ফোন নম্বর
          দিলেই ৫টি কুরিয়ারে ওই কাস্টমারের ডেলিভারি রেকর্ড দেখুন, ঝুঁকি থাকলে অগ্রিম চার্জ
          নিয়ে পাঠান।
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login" className="rounded-full bg-slate-900 px-7 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-700">
            ফ্রিতে চেক শুরু করুন →
          </Link>
          <a href="#calculator" className="rounded-full border border-slate-300 px-7 py-3 text-sm font-bold transition hover:border-slate-900">
            আমার ক্ষতি হিসাব করুন
          </a>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-4 border-t border-slate-200 pt-8">
          {[["~২০%", "গড় COD রিটার্ন রেট"], ["৳১৪০", "প্রতি রিটার্নে গড় ক্ষতি"], ["১০ সে.", "এক চেকে সময়"]].map(([v, l]) => (
            <div key={l}>
              <p className="font-serif text-3xl font-black sm:text-4xl">{v}</p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 01 PROBLEM */}
      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <SectionLabel no="০১" text="সমস্যাটা কোথায়" />
          <h2 className="font-serif text-3xl font-black leading-snug sm:text-4xl">
            ভুয়া অর্ডার নয় — আসল ক্ষতি<br />রিটার্ন চার্জে।
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">
            ফেসবুকে অর্ডার আসে, আপনি পার্সেল পাঠান, কাস্টমার ফোন ধরে না — পার্সেল ফেরত।
            প্রোডাক্ট বিক্রি হয়নি, উল্টো কুরিয়ারকে দুই দিকের ভাড়া আর প্যাকেজিং খরচ আপনিই
            দিলেন। মাসে ৩০০ অর্ডারের দোকানে ২০% রিটার্ন মানে <b>মাসে ৳৮,৪০০, বছরে ৳১,০০,৮০০</b> —
            কোনো সেল ছাড়াই।
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["৬০টি", "প্রতি মাসে ফেরত (৩০০ অর্ডারে)", ""],
              ["৳৮,৪০০", "মাসিক সরাসরি লস", "text-rose-600"],
              ["৳১,০০,৮০০", "বছরে — বিজ্ঞাপন বাজেটের সমান", "text-rose-600"],
            ].map(([v, l, c]) => (
              <div key={l} className="rounded-2xl border border-slate-200 p-5">
                <p className={`font-mono text-3xl font-black ${c}`}>{v}</p>
                <p className="mt-1 text-sm text-slate-500">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 02 CALCULATOR */}
      <section id="calculator" className="border-t border-slate-200 bg-slate-50/60">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <SectionLabel no="০২" text="নিজের হিসাব নিজে করুন" />
          <h2 className="font-serif text-3xl font-black leading-snug sm:text-4xl">রিটার্নে আপনার কত যাচ্ছে?</h2>
          <p className="mt-3 max-w-2xl text-slate-600">স্লাইডার নাড়িয়ে দেখুন — সংখ্যাটা নিজেই কথা বলবে।</p>
          <div className="mt-8"><RoiCalculator /></div>
        </div>
      </section>

      {/* 03 HOW */}
      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <SectionLabel no="০৩" text="কীভাবে কাজ করে" />
          <h2 className="font-serif text-3xl font-black leading-snug sm:text-4xl">তিন ধাপ। দশ সেকেন্ড।</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              ["১", "নম্বর দিন", "অর্ডারকারী কাস্টমারের মোবাইল নম্বর সার্চ বক্সে লিখুন।"],
              ["২", "রেকর্ড দেখুন", "৫টি কুরিয়ারে মোট পার্সেল, ডেলিভারি, রিটার্ন ও সাকসেস রেট — সাথে Safe / Moderate / High Risk লেবেল।"],
              ["৩", "সিদ্ধান্ত নিন", "নিরাপদ হলে COD-তে পাঠান। ঝুঁকি থাকলে ডেলিভারি চার্জ অগ্রিম নিয়ে কনফার্ম করুন।"],
            ].map(([n, t, d]) => (
              <div key={n} className="border-t-2 border-slate-900 pt-4">
                <p className="font-mono text-sm font-bold text-amber-600">{n}</p>
                <h3 className="mt-1 font-bold">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 04 FAQ */}
      <section className="border-t border-slate-200 bg-slate-50/60">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <SectionLabel no="০৪" text="সাধারণ প্রশ্ন" />
          <h2 className="font-serif text-3xl font-black sm:text-4xl">যা জানতে চান</h2>
          <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
            {faqs.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="cursor-pointer list-none font-bold transition group-open:text-amber-700">{f.q}</summary>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="font-serif text-3xl font-black sm:text-4xl">পরের রিটার্নটা ঠেকান<br />আজই।</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">লগইন করে প্রথম চেক করুন — ১০ সেকেন্ডে বুঝে যাবেন এই টুল কেন দরকার ছিল।</p>
          <Link href="/login" className="mt-7 inline-block rounded-full bg-amber-400 px-8 py-3 text-sm font-black text-slate-900 shadow-lg transition hover:bg-amber-300">
            ফ্রি অ্যাকাউন্টে ঢুকুন →
          </Link>
        </div>
      </section>
    </main>
  );
}
