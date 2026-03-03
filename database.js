// ═══════════════════════════════════════════════════════════════
//  PocketLined — Database Layer (SQLite)
// ═══════════════════════════════════════════════════════════════
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'pocketlined.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── SCHEMA ───
db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK(role IN ('member','admin')),
    coins INTEGER DEFAULT 500,           -- signup bonus
    lifetime_earned INTEGER DEFAULT 500,
    total_withdrawn INTEGER DEFAULT 0,
    level_name TEXT DEFAULT 'Starter',
    streak_days INTEGER DEFAULT 0,
    streak_last_date TEXT,               -- ISO date of last activity
    referral_code TEXT UNIQUE,
    referred_by INTEGER REFERENCES users(id),
    referral_earnings INTEGER DEFAULT 0,
    ip_address TEXT,
    country TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT DEFAULT (datetime('now')),
    is_banned INTEGER DEFAULT 0,
    ban_reason TEXT
  );

  -- Transactions (every coin movement)
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK(type IN (
      'signup_bonus','offer_complete','survey_complete','video_reward',
      'referral_bonus','referral_commission','streak_bonus','spin_reward',
      'level_bonus','cashout','admin_adjustment','chargeback'
    )),
    coins INTEGER NOT NULL,              -- positive = credit, negative = debit
    description TEXT,
    offer_id TEXT,                        -- external offer ID from offerwall
    offerwall TEXT,                       -- which offerwall
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Offerwall postback log (ADMIN ONLY — raw data from offerwalls)
  CREATE TABLE IF NOT EXISTS postback_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    offerwall TEXT NOT NULL,
    user_id INTEGER,
    offer_id TEXT,
    offer_name TEXT,
    payout_coins INTEGER,                -- what we pay the user
    revenue_cents INTEGER,               -- what the advertiser pays us (ADMIN ONLY)
    profit_cents INTEGER,                -- revenue - payout (ADMIN ONLY)
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'credited' CHECK(status IN ('credited','pending','reversed','fraud')),
    raw_params TEXT,                      -- full postback URL params (ADMIN ONLY)
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Payouts (withdrawal requests)
  CREATE TABLE IF NOT EXISTS payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    method TEXT NOT NULL CHECK(method IN (
      'paypal','venmo','cashapp','btc','eth','usdt',
      'amazon','visa','steam','apple','google','walmart'
    )),
    coins INTEGER NOT NULL,
    usd_amount REAL NOT NULL,
    destination TEXT,                     -- email, wallet address, etc.
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed','cancelled')),
    transaction_ref TEXT,                 -- external payment reference
    processed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Daily spins
  CREATE TABLE IF NOT EXISTS daily_spins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    coins_won INTEGER NOT NULL,
    spin_date TEXT NOT NULL,              -- ISO date
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, spin_date)
  );

  -- Referrals tracking
  CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER NOT NULL REFERENCES users(id),
    referred_id INTEGER NOT NULL REFERENCES users(id),
    bonus_paid INTEGER DEFAULT 0,         -- one-time bonus (e.g. 10000 coins)
    lifetime_commission INTEGER DEFAULT 0, -- 5% of referred user's earnings
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(referred_id)
  );

  -- Admin analytics snapshots (daily rollup — ADMIN ONLY)
  CREATE TABLE IF NOT EXISTS analytics_daily (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL,
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    total_offers_completed INTEGER DEFAULT 0,
    total_coins_earned INTEGER DEFAULT 0,
    total_coins_withdrawn INTEGER DEFAULT 0,
    total_revenue_cents INTEGER DEFAULT 0,  -- what offerwalls paid us
    total_payout_cents INTEGER DEFAULT 0,   -- what we paid users
    profit_cents INTEGER DEFAULT 0,         -- revenue - payout
    avg_earnings_per_user INTEGER DEFAULT 0
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
  CREATE INDEX IF NOT EXISTS idx_postback_offerwall ON postback_log(offerwall);
  CREATE INDEX IF NOT EXISTS idx_postback_date ON postback_log(created_at);
  CREATE INDEX IF NOT EXISTS idx_payouts_user ON payouts(user_id);
  CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
  CREATE INDEX IF NOT EXISTS idx_users_referral ON users(referral_code);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
`);

module.exports = db;
