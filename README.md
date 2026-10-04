# ফ্রড চেকার (Fraud Checker)

টিমের জন্য কাস্টমার ডেলিভারি/রিটার্ন হিস্ট্রি চেকার। ডেটা সোর্স: ParcelVai
(`GET /api/fraud-check?phone=` + আপনার `bd_session`)। প্রতিটি চেক Postgres-এ
সেভ হয়, হিস্ট্রি + ড্যাশবোর্ড + CSV এক্সপোর্ট সহ।

## পেজ

- `/` — নম্বর দিয়ে চেক + রেজাল্ট কার্ড (মোট/ডেলিভারড/রিটার্ন, সাকসেস %, রিস্ক ব্যাজ, কুরিয়ার টেবিল)
- `/history` — সার্চ, রিস্ক ফিল্টার, পেজিনেশন, CSV ডাউনলোড
- `/dashboard` — আজ / এই মাসে / High-Risk সামারি
- `/settings` (admin) — ParcelVai `bd_session` বদলানো + টেস্ট চেক
- `/login` — টিম লগইন

## লোকাল চালানো

```bash
npm i
# .env.local ফাইলে নিচের ভেরিয়েবলগুলো বসান (সিক্রেট কোথাও কমিট করবেন না):
# DATABASE_URL="postgresql://user:pass@host:5432/fraud?sslmode=require"
# NEXTAUTH_SECRET="32-অক্ষরের-র‍্যান্ডম-স্ট্রিং"
# NEXTAUTH_URL="http://localhost:3000"
# PARCELVAI_SESSION="user:182:..."   (ParcelVai cookie: bd_session)
# PARCELVAI_DID="..."                 (ParcelVai cookie: _bdd_did)
# SEED_ADMIN_EMAIL="admin@example.com"
# SEED_ADMIN_PASSWORD="শক্ত-পাসওয়ার্ড"
# CACHE_TTL_HOURS="24"
npx prisma migrate dev
npm run dev
```

`bd_session` পেতে: ParcelVai-তে লগইন → ব্রাউজার DevTools → Application →
Cookies → `bd_session`-এর মান কপি করুন।

টেস্ট: `npm test` (বর্তমানে ৬টা)। টেস্ট নম্বর: `01712345678`।

## Vercel-এ ডেপ্লয় (পরে)

1. Neon (neon.tech) বা Supabase-এ Postgres বানিয়ে connection string নিন।
2. Vercel → Import repo → Environment Variables-এ উপরের সব (`DATABASE_URL`,
   `NEXTAUTH_SECRET`, `NEXTAUTH_URL=https://<আপনার-ডোমেন>`,
   `PARCELVAI_SESSION`, `PARCELVAI_DID`, `SEED_ADMIN_*`) বসান।
3. Build Command: `npx prisma migrate deploy && next build`।
4. ডেপ্লয়ের পর একবার `npx prisma db seed` (বা Vercel console থেকে) চালিয়ে
   admin বানান। Session expire হলে `/settings` থেকে বদলে নিন — redeploy লাগে না।

## নোট

- নাম-ঠিকানা দেখানো বা সেভ করা হয় না, শুধু ডেলিভারি রেশিও।
- Session expire হলে API বাংলায় জানাবে: “ParcelVai session expired”।
- Spec: `docs/superpowers/specs/2026-10-04-fraud-checker-design.md`।
  Plan: `docs/superpowers/plans/2026-10-04-fraud-checker.md`।
