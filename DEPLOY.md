# CashFlow 2.0 — Deployment Guide

## Stack
- **Frontend**: Next.js 14 (React) — deployed on Vercel
- **Backend**: Next.js API Routes (serverless) — deployed on Vercel
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT + bcrypt (custom)

---

## Step 1: Set Up Supabase

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project (or use existing)
3. Go to **SQL Editor** → **New Query**
4. Paste the contents of `supabase/schema.sql` and run it
5. Go to **Settings → API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → this is your `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2: Push to GitHub

```bash
# In the project folder:
git init
git branch -m main
git add -A
git commit -m "Initial commit — CashFlow 2.0"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/cashflow-2.0.git
git push -u origin main
```

---

## Step 3: Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** → select `cashflow-2.0`
3. **Framework Preset**: Next.js (auto-detected)
4. **Environment Variables** — add these:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `JWT_SECRET` | A random 64-char string |
| `ADMIN_EMAIL` | admin@cashflow.com |
| `ADMIN_PASSWORD` | Your admin password |
| `ADGATE_SECRET` | Your AdGate Media secret |
| `ADGEM_SECRET` | Your AdGem secret |
| `OFFERTORO_SECRET` | Your OfferToro secret |
| `LOOTABLY_SECRET` | Your Lootably secret |
| `AYET_SECRET` | Your Ayet Studios secret |
| `REVENUEUNIVERSE_SECRET` | Your Revenue Universe secret |
| `CPXRESEARCH_SECRET` | Your CPX Research secret |
| `BITLABS_SECRET` | Your BitLabs secret |
| `THEOREMREACH_SECRET` | Your TheoremReach secret |
| `POLLFISH_SECRET` | Your Pollfish secret |
| `TYRADS_SECRET` | Your TyrAds secret |
| `TOROX_SECRET` | Your Torox secret |

5. Click **Deploy**
6. Your site will be live at `https://cashflow-2-0.vercel.app` (or custom domain)

---

## Step 4: Set Up Offerwall Postbacks

For each offerwall provider, set the postback URL to:

```
https://YOUR_DOMAIN.vercel.app/api/postback?wall=WALLNAME&user_id={user_id}&txn_id={transaction_id}&amount={payout}&revenue={revenue}&offer_id={offer_id}&offer_name={offer_name}&secret=YOUR_SECRET
```

Replace `WALLNAME` with: `adgate`, `adgem`, `offertoro`, `lootably`, `ayet`, `revenueuniverse`, `cpxresearch`, `bitlabs`, `theoremreach`, `pollfish`, `tyrads`, `torox`

---

## API Routes

### Public
- `POST /api/auth/signup` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/leaderboard` — Top 100 users

### Authenticated (Bearer token)
- `GET /api/me` — User profile
- `GET /api/transactions` — Transaction history
- `GET /api/payouts` — Payout history
- `POST /api/payouts` — Request withdrawal
- `POST /api/spin` — Daily spin
- `GET /api/referrals` — Referral stats

### Admin Only
- `GET /api/admin/dashboard` — Revenue, profit, stats
- `GET /api/admin/offerwalls` — Offerwall performance
- `GET /api/admin/users` — User management
- `PATCH /api/admin/users` — Ban/unban users
- `GET /api/admin/payouts` — Pending payouts
- `PATCH /api/admin/payouts` — Approve/reject payouts
- `GET /api/admin/analytics` — Daily analytics
- `GET /api/admin/fraud` — Fraud detection

### Offerwall
- `GET/POST /api/postback` — Universal postback handler
