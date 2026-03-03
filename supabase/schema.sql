-- ═══════════════════════════════════════════════════════════
--  CASHFLOW 2.0 — Supabase Database Schema
--  Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- ─── USERS TABLE ───
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  coins BIGINT DEFAULT 500,  -- signup bonus (endowed progress)
  lifetime_earned BIGINT DEFAULT 500,
  level_idx INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_active DATE DEFAULT CURRENT_DATE,
  referred_by UUID REFERENCES users(id),
  referral_code TEXT UNIQUE,
  ip_address TEXT,
  country TEXT DEFAULT 'US',
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TRANSACTIONS TABLE ───
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN (
    'signup_bonus', 'offer_complete', 'survey_complete', 'video_reward',
    'referral_bonus', 'referral_commission', 'streak_bonus', 'spin_reward',
    'level_bonus', 'cashout', 'admin_adjustment', 'chargeback'
  )),
  coins BIGINT NOT NULL,
  description TEXT,
  offer_id TEXT,
  wall_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── POSTBACK LOG (ADMIN ONLY — contains revenue data) ───
CREATE TABLE IF NOT EXISTS postback_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wall_name TEXT NOT NULL,
  transaction_id TEXT UNIQUE NOT NULL,  -- dedup key from offerwall
  user_id UUID NOT NULL REFERENCES users(id),
  offer_id TEXT,
  offer_name TEXT,
  payout_coins BIGINT NOT NULL,
  revenue_cents INTEGER NOT NULL,       -- what the offerwall pays us
  profit_cents INTEGER NOT NULL,        -- revenue - (payout_coins / 10)
  ip_address TEXT,
  raw_params JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PAYOUTS TABLE ───
CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  method TEXT NOT NULL CHECK (method IN (
    'paypal', 'venmo', 'cashapp', 'btc', 'eth', 'usdt',
    'amazon', 'visa', 'steam', 'apple', 'google', 'walmart'
  )),
  coins BIGINT NOT NULL,
  usd_amount NUMERIC(10,2) NOT NULL,
  destination TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ─── DAILY SPINS ───
CREATE TABLE IF NOT EXISTS daily_spins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  coins_won BIGINT NOT NULL,
  spin_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, spin_date)
);

-- ─── REFERRALS ───
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES users(id),
  referred_id UUID NOT NULL REFERENCES users(id),
  bonus_paid BIGINT DEFAULT 10000,  -- $10 signup referral bonus
  lifetime_commission BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- ─── ANALYTICS DAILY (ADMIN ONLY) ───
CREATE TABLE IF NOT EXISTS analytics_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  revenue_cents INTEGER DEFAULT 0,
  profit_cents INTEGER DEFAULT 0,
  payout_cents INTEGER DEFAULT 0,
  offers_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ INDEXES ═══
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_postback_wall ON postback_log(wall_name);
CREATE INDEX IF NOT EXISTS idx_postback_txn ON postback_log(transaction_id);
CREATE INDEX IF NOT EXISTS idx_postback_user ON postback_log(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_ip ON users(ip_address);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_daily(date DESC);

-- ═══ ROW LEVEL SECURITY ═══
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE postback_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users read own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Transactions: users see only their own
CREATE POLICY "Users read own transactions" ON transactions FOR SELECT USING (user_id = auth.uid());

-- Postback log: server-side only (service role bypasses RLS)
CREATE POLICY "No direct postback access" ON postback_log FOR SELECT USING (false);

-- Payouts: users see only their own
CREATE POLICY "Users read own payouts" ON payouts FOR SELECT USING (user_id = auth.uid());

-- Daily spins: users see only their own
CREATE POLICY "Users read own spins" ON daily_spins FOR SELECT USING (user_id = auth.uid());

-- Referrals: referrers see their referrals
CREATE POLICY "Referrers read own referrals" ON referrals FOR SELECT USING (referrer_id = auth.uid());

-- Analytics: server-side only
CREATE POLICY "No direct analytics access" ON analytics_daily FOR SELECT USING (false);

-- ═══ HELPFUL VIEWS ═══
-- Leaderboard view (public, no sensitive data)
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  username,
  coins,
  level_idx,
  streak,
  ROW_NUMBER() OVER (ORDER BY coins DESC) as rank
FROM users
WHERE is_banned = FALSE AND role = 'member'
ORDER BY coins DESC
LIMIT 100;
