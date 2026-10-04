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
# SEED_SUPERADMIN_EMAIL="superadmin@example.com"
# SEED_SUPERADMIN_PASSWORD="আরো-শক্ত-পাসওয়ার্ড"
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

## রোল ও API key সীমা

- `member` — সর্বোচ্চ ৩টা API key
- `admin` — সর্বোচ্চ ১৫টা API key
- `superadmin` — unlimited key + `/settings`-এ **সব ইউজারের key দেখা/বাতিল**

## বাইরের ওয়েবসাইট থেকে ব্যবহার (API)

`/settings` পেজে গিয়ে **API Keys** থেকে key বানান (`fk_...`)। তারপর যেকোনো
কাস্টম ওয়েবসাইট থেকে:

```bash
curl -X POST https://<আপনার-ডোমেন>/api/v1/check \
  -H "Content-Type: application/json" \
  -H "x-api-key: fk_আপনার_KEY" \
  -d '{"phone":"01712345678"}'
```

সফল রেসপন্স (200):

```json
{
  "phone": "01712345678",
  "total": 413, "delivered": 228, "cancelled": 185,
  "successRate": 55, "riskLevel": "high_risk",
  "labelBn": "উচ্চ ঝুঁকি (High Risk)",
  "recommendation": "অগ্রিম কুরিয়ার চার্জ গ্রহণ করে অর্ডার কনফার্ম করুন।",
  "couriers": [{ "id": "pathao", "name": "Pathao Courier", "total": 397, "delivered": 221, "cancelled": 176, "rate": 56 }],
  "partial": false, "cached": false, "checkedAt": "..."
}
```

- `riskLevel`: `safe` | `moderate` | `high_risk`
- ভুল key → 401, ভুল নম্বর → 400, ParcelVai সমস্যা → 502 (বাংলা `error_bn` সহ)
- প্রতিটি API চেকও হিস্ট্রিতে সেভ হয় (key-এর মালিকের নামে)
- `Authorization: Bearer fk_...` হেডারও চলবে

PHP উদাহরণ:

```php
$ch = curl_init("https://<ডোমেন>/api/v1/check");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ["Content-Type: application/json", "x-api-key: fk_..."],
  CURLOPT_POSTFIELDS => json_encode(["phone" => $customerPhone]),
]);
$data = json_decode(curl_exec($ch), true);
if (($data["riskLevel"] ?? "") === "high_risk") {
  // অগ্রিম ডেলিভারি চার্জ চান
}
```

JavaScript (fetch) উদাহরণ:

```js
const r = await fetch("https://<ডোমেন>/api/v1/check", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": "fk_..." },
  body: JSON.stringify({ phone: "01712345678" }),
});
const d = await r.json(); // d.riskLevel, d.successRate ...
```

## নোট

- নাম-ঠিকানা দেখানো বা সেভ করা হয় না, শুধু ডেলিভারি রেশিও।
- Session expire হলে API বাংলায় জানাবে: “ParcelVai session expired”।
- Spec: `docs/superpowers/specs/2026-10-04-fraud-checker-design.md`।
  Plan: `docs/superpowers/plans/2026-10-04-fraud-checker.md`।
