// ═══════════════════════════════════════════════════════════════
//  PocketLined — Backend Server
// ═══════════════════════════════════════════════════════════════
//  Express + SQLite + JWT Auth + Offerwall Postbacks + Payouts
//  Admin routes are fully separated from member routes.
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

// ─── MIDDLEWARE ───
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many attempts. Try again in 15 minutes.' } });
const apiLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 60 });
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// ─── HELPERS ───
const LEVELS = [
  { name: 'Starter',  min: 0,      bonus: 0,  next: 1000 },
  { name: 'Explorer', min: 1000,   bonus: 2,  next: 5000 },
  { name: 'Earner',   min: 5000,   bonus: 5,  next: 15000 },
  { name: 'Hustler',  min: 15000,  bonus: 8,  next: 40000 },
  { name: 'Pro',      min: 40000,  bonus: 12, next: 100000 },
  { name: 'Elite',    min: 100000, bonus: 15, next: 300000 },
  { name: 'Legend',   min: 300000, bonus: 20, next: 750000 },
  { name: 'Titan',    min: 750000, bonus: 25, next: null },
];

function getLevel(coins) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (coins >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

function generateReferralCode(username) {
  return username.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + crypto.randomBytes(3).toString('hex');
}

function updateUserLevel(userId) {
  const user = db.prepare('SELECT lifetime_earned FROM users WHERE id = ?').get(userId);
  if (!user) return;
  const level = getLevel(user.lifetime_earned);
  db.prepare('UPDATE users SET level_name = ? WHERE id = ?').run(level.name, userId);
}

function updateStreak(userId) {
  const user = db.prepare('SELECT streak_days, streak_last_date FROM users WHERE id = ?').get(userId);
  if (!user) return;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (user.streak_last_date === today) return; // already counted today

  if (user.streak_last_date === yesterday) {
    db.prepare('UPDATE users SET streak_days = streak_days + 1, streak_last_date = ? WHERE id = ?').run(today, userId);
  } else {
    db.prepare('UPDATE users SET streak_days = 1, streak_last_date = ? WHERE id = ?').run(today, userId);
  }
}

function creditCoins(userId, coins, type, description, offerId = null, offerwall = null, ip = null) {
  const level = getLevel(db.prepare('SELECT lifetime_earned FROM users WHERE id = ?').get(userId)?.lifetime_earned || 0);
  const bonusMultiplier = 1 + (level.bonus / 100);
  const finalCoins = Math.round(coins * bonusMultiplier);

  db.prepare('UPDATE users SET coins = coins + ?, lifetime_earned = lifetime_earned + ? WHERE id = ?')
    .run(finalCoins, finalCoins, userId);

  db.prepare(`INSERT INTO transactions (user_id, type, coins, description, offer_id, offerwall, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(userId, type, finalCoins, description, offerId, offerwall, ip);

  updateUserLevel(userId);
  updateStreak(userId);

  // Referral commission (5% to referrer)
  const user = db.prepare('SELECT referred_by FROM users WHERE id = ?').get(userId);
  if (user?.referred_by) {
    const commission = Math.round(finalCoins * 0.05);
    if (commission > 0) {
      db.prepare('UPDATE users SET coins = coins + ?, lifetime_earned = lifetime_earned + ?, referral_earnings = referral_earnings + ? WHERE id = ?')
        .run(commission, commission, commission, user.referred_by);
      db.prepare(`INSERT INTO transactions (user_id, type, coins, description) VALUES (?, 'referral_commission', ?, ?)`)
        .run(user.referred_by, commission, `5% commission from user #${userId}`);
      db.prepare('UPDATE referrals SET lifetime_commission = lifetime_commission + ? WHERE referred_id = ?')
        .run(commission, userId);
    }
  }

  return finalCoins;
}

// ─── AUTH MIDDLEWARE ───
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.user = db.prepare('SELECT id, email, username, role, coins, lifetime_earned, total_withdrawn, level_name, streak_days, referral_code, referral_earnings, is_banned FROM users WHERE id = ?').get(decoded.id);
    if (!req.user) return res.status(401).json({ error: 'User not found' });
    if (req.user.is_banned) return res.status(403).json({ error: 'Account suspended' });
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

// ═══════════════════════════════════════════════════════════════
//  AUTH ROUTES (Public)
// ═══════════════════════════════════════════════════════════════

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, username, password, referralCode } = req.body;
    if (!email || !username || !password) return res.status(400).json({ error: 'Email, username, and password required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (username.length < 3 || username.length > 20) return res.status(400).json({ error: 'Username must be 3-20 characters' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existing) return res.status(409).json({ error: 'Email or username already taken' });

    const hash = await bcrypt.hash(password, 12);
    const refCode = generateReferralCode(username);
    const ip = req.ip;

    // Check referral
    let referredBy = null;
    if (referralCode) {
      const referrer = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(referralCode);
      if (referrer) referredBy = referrer.id;
    }

    const result = db.prepare(`INSERT INTO users (email, username, password_hash, referral_code, referred_by, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)`).run(email, username, hash, refCode, referredBy, ip);

    const userId = result.lastInsertRowid;

    // Signup bonus transaction
    db.prepare(`INSERT INTO transactions (user_id, type, coins, description, ip_address)
      VALUES (?, 'signup_bonus', 500, 'Welcome bonus — 500 coins', ?)`).run(userId, ip);

    // Referral bonus (10,000 coins = $10 to referrer)
    if (referredBy) {
      db.prepare('UPDATE users SET coins = coins + 10000, lifetime_earned = lifetime_earned + 10000, referral_earnings = referral_earnings + 10000 WHERE id = ?')
        .run(referredBy);
      db.prepare(`INSERT INTO transactions (user_id, type, coins, description) VALUES (?, 'referral_bonus', 10000, ?)`)
        .run(referredBy, `Referral bonus: ${username} signed up`);
      db.prepare('INSERT INTO referrals (referrer_id, referred_id, bonus_paid) VALUES (?, ?, 10000)')
        .run(referredBy, userId);
    }

    const token = jwt.sign({ id: userId, role: 'member' }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: userId, email, username, coins: 500, level: 'Starter', referralCode: refCode } });
  } catch (e) {
    console.error('Signup error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.is_banned) return res.status(403).json({ error: 'Account suspended' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    db.prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?').run(user.id);

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: {
        id: user.id, email: user.email, username: user.username, role: user.role,
        coins: user.coins, lifetime_earned: user.lifetime_earned, total_withdrawn: user.total_withdrawn,
        level: user.level_name, streak: user.streak_days, referralCode: user.referral_code,
        referralEarnings: user.referral_earnings,
      }
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  MEMBER ROUTES (Authenticated)
// ═══════════════════════════════════════════════════════════════

// Get current user profile
app.get('/api/me', authenticate, (req, res) => {
  const level = getLevel(req.user.lifetime_earned);
  res.json({
    ...req.user,
    level: level.name,
    levelBonus: level.bonus,
    nextLevel: LEVELS[LEVELS.indexOf(level) + 1] || null,
    coinsUSD: (req.user.coins / 1000).toFixed(2),
  });
});

// Get transaction history (member's own only)
app.get('/api/transactions', authenticate, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const offset = (page - 1) * limit;

  const transactions = db.prepare(`
    SELECT id, type, coins, description, created_at
    FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(req.user.id, limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE user_id = ?').get(req.user.id).count;

  res.json({ transactions, total, page, pages: Math.ceil(total / limit) });
});

// Get user's payout history (own only)
app.get('/api/payouts', authenticate, (req, res) => {
  const payouts = db.prepare(`
    SELECT id, method, coins, usd_amount, status, created_at, processed_at
    FROM payouts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(req.user.id);
  res.json({ payouts });
});

// Request a payout
app.post('/api/payouts', authenticate, (req, res) => {
  const { method, coins, destination } = req.body;
  const validMethods = ['paypal','venmo','cashapp','btc','eth','usdt','amazon','visa','steam','apple','google','walmart'];
  if (!validMethods.includes(method)) return res.status(400).json({ error: 'Invalid payout method' });

  const minCoins = ['btc','eth','usdt'].includes(method) ? 2000 : method === 'visa' ? 5000 : 1000;
  if (!coins || coins < minCoins) return res.status(400).json({ error: `Minimum ${minCoins} coins ($${(minCoins/1000).toFixed(2)}) for ${method}` });
  if (coins > req.user.coins) return res.status(400).json({ error: 'Insufficient balance' });
  if (!destination) return res.status(400).json({ error: 'Destination required (email, wallet, etc.)' });

  // Check for pending payouts (anti-abuse)
  const pending = db.prepare('SELECT COUNT(*) as count FROM payouts WHERE user_id = ? AND status IN ("pending","processing")').get(req.user.id);
  if (pending.count >= 3) return res.status(400).json({ error: 'You have 3 pending payouts. Wait for them to process.' });

  const feeRate = method === 'visa' ? 0.01 : 0;
  const usdAmount = (coins / 1000) * (1 - feeRate);

  // Debit coins
  db.prepare('UPDATE users SET coins = coins - ?, total_withdrawn = total_withdrawn + ? WHERE id = ?')
    .run(coins, coins, req.user.id);

  db.prepare(`INSERT INTO transactions (user_id, type, coins, description)
    VALUES (?, 'cashout', ?, ?)`).run(req.user.id, -coins, `Withdrawal: $${usdAmount.toFixed(2)} to ${method}`);

  const payout = db.prepare(`INSERT INTO payouts (user_id, method, coins, usd_amount, destination)
    VALUES (?, ?, ?, ?, ?)`).run(req.user.id, method, coins, usdAmount, destination);

  res.status(201).json({
    id: payout.lastInsertRowid, method, coins, usdAmount: usdAmount.toFixed(2), status: 'pending',
    message: 'Payout queued. Most payouts process within 60 seconds.'
  });
});

// Daily spin
app.post('/api/spin', authenticate, (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  // Check if already spun today
  const existing = db.prepare('SELECT id FROM daily_spins WHERE user_id = ? AND spin_date = ?').get(req.user.id, today);
  if (existing) return res.status(400).json({ error: 'Already spun today. Come back tomorrow!' });

  // Check if earned 1000+ coins today (unlock requirement)
  const todayEarnings = db.prepare(`
    SELECT COALESCE(SUM(coins),0) as total FROM transactions
    WHERE user_id = ? AND coins > 0 AND type != 'spin_reward'
    AND date(created_at) = date('now')
  `).get(req.user.id);

  if (todayEarnings.total < 1000) {
    return res.status(400).json({ error: `Earn ${1000 - todayEarnings.total} more coins today to unlock your daily spin.` });
  }

  // Variable ratio reinforcement: unpredictable rewards
  const roll = Math.random();
  const coinsWon = roll < 0.02 ? 50000 : roll < 0.08 ? 10000 : roll < 0.20 ? 5000 :
                   roll < 0.40 ? 2000 : roll < 0.65 ? 1000 : 500;

  db.prepare('INSERT INTO daily_spins (user_id, coins_won, spin_date) VALUES (?, ?, ?)').run(req.user.id, coinsWon, today);
  creditCoins(req.user.id, coinsWon, 'spin_reward', `Daily spin: won ${coinsWon} coins`);

  res.json({ coinsWon, message: coinsWon >= 10000 ? 'JACKPOT!' : 'Nice spin!' });
});

// Get referral stats
app.get('/api/referrals', authenticate, (req, res) => {
  const referrals = db.prepare(`
    SELECT u.username, u.created_at, r.bonus_paid, r.lifetime_commission
    FROM referrals r JOIN users u ON u.id = r.referred_id
    WHERE r.referrer_id = ? ORDER BY r.created_at DESC LIMIT 50
  `).all(req.user.id);

  const stats = db.prepare(`
    SELECT COUNT(*) as total, COALESCE(SUM(bonus_paid + lifetime_commission),0) as earnings
    FROM referrals WHERE referrer_id = ?
  `).get(req.user.id);

  res.json({ referrals, totalReferrals: stats.total, totalEarnings: stats.earnings, referralCode: req.user.referral_code });
});

// Get leaderboard (public data only — no revenue, no admin metrics)
app.get('/api/leaderboard', (req, res) => {
  const period = req.query.period || 'weekly';
  let dateFilter = '';
  if (period === 'daily') dateFilter = "AND date(t.created_at) = date('now')";
  else if (period === 'weekly') dateFilter = "AND t.created_at >= datetime('now','-7 days')";
  else if (period === 'monthly') dateFilter = "AND t.created_at >= datetime('now','-30 days')";

  const leaders = db.prepare(`
    SELECT u.username, u.level_name, u.streak_days,
      COALESCE(SUM(CASE WHEN t.coins > 0 THEN t.coins ELSE 0 END), 0) as period_earnings
    FROM users u
    LEFT JOIN transactions t ON t.user_id = u.id ${dateFilter}
    WHERE u.role = 'member' AND u.is_banned = 0
    GROUP BY u.id
    ORDER BY period_earnings DESC
    LIMIT 100
  `).all();

  res.json({ leaders: leaders.map((l, i) => ({ rank: i + 1, ...l })), period });
});

// ═══════════════════════════════════════════════════════════════
//  OFFERWALL POSTBACK ROUTES
// ═══════════════════════════════════════════════════════════════
//  These are called by offerwall servers when a user completes
//  an offer. Each offerwall has its own URL format and security.
//
//  BUSINESS MODEL:
//  - Advertiser pays offerwall $X for a completed action (CPA)
//  - Offerwall keeps their cut, sends us our share
//  - We keep our margin and credit the user
//  - Revenue and profit data is stored in postback_log (ADMIN ONLY)
// ═══════════════════════════════════════════════════════════════

// Generic postback handler (works for most offerwalls)
function handlePostback(wallName, req, res) {
  try {
    const {
      user_id,           // our user ID (passed as subid when user clicks offer)
      offer_id,
      offer_name,
      payout,            // coins to credit user
      revenue,           // what we earn in cents (CONFIDENTIAL)
      signature,         // security hash from offerwall
    } = req.query;

    // Validate required fields
    if (!user_id || !payout) {
      return res.status(400).send('0'); // offerwalls expect '0' for failure, '1' for success
    }

    const userId = parseInt(user_id);
    const payoutCoins = parseInt(payout);
    const revenueCents = parseInt(revenue) || 0;

    // Verify user exists
    const user = db.prepare('SELECT id, is_banned FROM users WHERE id = ?').get(userId);
    if (!user || user.is_banned) return res.send('0');

    // Check for duplicate (same offer, same user)
    const duplicate = db.prepare('SELECT id FROM postback_log WHERE offerwall = ? AND user_id = ? AND offer_id = ?')
      .get(wallName, userId, offer_id);
    if (duplicate) return res.send('1'); // already credited, tell offerwall success

    // Calculate profit (ADMIN ONLY data)
    const profitCents = revenueCents - Math.round((payoutCoins / 1000) * 100);

    // Log the postback (includes revenue — ADMIN ONLY table)
    db.prepare(`INSERT INTO postback_log (offerwall, user_id, offer_id, offer_name, payout_coins, revenue_cents, profit_cents, raw_params, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(wallName, userId, offer_id, offer_name || 'Unknown Offer', payoutCoins, revenueCents, profitCents, JSON.stringify(req.query), req.ip);

    // Credit user
    creditCoins(userId, payoutCoins, 'offer_complete', offer_name || `${wallName} offer completed`, offer_id, wallName, req.ip);

    res.send('1'); // success
  } catch (e) {
    console.error(`Postback error (${wallName}):`, e);
    res.send('0');
  }
}

// Individual offerwall endpoints
// Format: GET /postback/{wallname}?user_id=X&offer_id=Y&payout=Z&revenue=R
app.get('/postback/adgate',     (req, res) => handlePostback('AdGate Media', req, res));
app.get('/postback/adgem',      (req, res) => handlePostback('AdGem', req, res));
app.get('/postback/offertoro',  (req, res) => handlePostback('OfferToro', req, res));
app.get('/postback/lootably',   (req, res) => handlePostback('Lootably', req, res));
app.get('/postback/ayet',       (req, res) => handlePostback('Ayet Studios', req, res));
app.get('/postback/revu',       (req, res) => handlePostback('Revenue Universe', req, res));
app.get('/postback/cpx',        (req, res) => handlePostback('CPX Research', req, res));
app.get('/postback/bitlabs',    (req, res) => handlePostback('BitLabs', req, res));
app.get('/postback/theoremreach',(req, res) => handlePostback('TheoremReach', req, res));
app.get('/postback/pollfish',   (req, res) => handlePostback('Pollfish', req, res));
app.get('/postback/tyrads',     (req, res) => handlePostback('TyrAds', req, res));
app.get('/postback/torox',      (req, res) => handlePostback('Torox', req, res));

// ═══════════════════════════════════════════════════════════════
//  ADMIN ROUTES — Protected by authenticate + adminOnly
//  Members NEVER see these endpoints or their data.
// ═══════════════════════════════════════════════════════════════

// Admin: Dashboard overview
app.get('/api/admin/dashboard', authenticate, adminOnly, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as n FROM users WHERE role = "member"').get().n;
  const todayUsers = db.prepare('SELECT COUNT(*) as n FROM users WHERE date(created_at) = date("now")').get().n;
  const activeToday = db.prepare('SELECT COUNT(DISTINCT user_id) as n FROM transactions WHERE date(created_at) = date("now")').get().n;

  const totalRevenue = db.prepare('SELECT COALESCE(SUM(revenue_cents),0) as n FROM postback_log WHERE status = "credited"').get().n;
  const todayRevenue = db.prepare('SELECT COALESCE(SUM(revenue_cents),0) as n FROM postback_log WHERE status = "credited" AND date(created_at) = date("now")').get().n;
  const weekRevenue = db.prepare('SELECT COALESCE(SUM(revenue_cents),0) as n FROM postback_log WHERE status = "credited" AND created_at >= datetime("now","-7 days")').get().n;
  const monthRevenue = db.prepare('SELECT COALESCE(SUM(revenue_cents),0) as n FROM postback_log WHERE status = "credited" AND created_at >= datetime("now","-30 days")').get().n;

  const totalProfit = db.prepare('SELECT COALESCE(SUM(profit_cents),0) as n FROM postback_log WHERE status = "credited"').get().n;
  const todayProfit = db.prepare('SELECT COALESCE(SUM(profit_cents),0) as n FROM postback_log WHERE status = "credited" AND date(created_at) = date("now")').get().n;
  const weekProfit = db.prepare('SELECT COALESCE(SUM(profit_cents),0) as n FROM postback_log WHERE status = "credited" AND created_at >= datetime("now","-7 days")').get().n;
  const monthProfit = db.prepare('SELECT COALESCE(SUM(profit_cents),0) as n FROM postback_log WHERE status = "credited" AND created_at >= datetime("now","-30 days")').get().n;

  const totalPaidOut = db.prepare('SELECT COALESCE(SUM(usd_amount),0) as n FROM payouts WHERE status = "completed"').get().n;
  const pendingPayouts = db.prepare('SELECT COUNT(*) as n, COALESCE(SUM(usd_amount),0) as amount FROM payouts WHERE status = "pending"').get();

  const totalOffers = db.prepare('SELECT COUNT(*) as n FROM postback_log WHERE status = "credited"').get().n;
  const todayOffers = db.prepare('SELECT COUNT(*) as n FROM postback_log WHERE status = "credited" AND date(created_at) = date("now")').get().n;

  res.json({
    users: { total: totalUsers, today: todayUsers, activeToday },
    revenue: {
      total: (totalRevenue / 100).toFixed(2),
      today: (todayRevenue / 100).toFixed(2),
      week: (weekRevenue / 100).toFixed(2),
      month: (monthRevenue / 100).toFixed(2),
    },
    profit: {
      total: (totalProfit / 100).toFixed(2),
      today: (todayProfit / 100).toFixed(2),
      week: (weekProfit / 100).toFixed(2),
      month: (monthProfit / 100).toFixed(2),
    },
    payouts: {
      totalPaidOut: totalPaidOut.toFixed(2),
      pendingCount: pendingPayouts.n,
      pendingAmount: pendingPayouts.amount.toFixed(2),
    },
    offers: { total: totalOffers, today: todayOffers },
  });
});

// Admin: Revenue by offerwall
app.get('/api/admin/offerwalls', authenticate, adminOnly, (req, res) => {
  const walls = db.prepare(`
    SELECT offerwall,
      COUNT(*) as completions,
      COALESCE(SUM(revenue_cents),0) as revenue_cents,
      COALESCE(SUM(payout_coins),0) as payout_coins,
      COALESCE(SUM(profit_cents),0) as profit_cents,
      ROUND(AVG(revenue_cents),0) as avg_revenue_cents,
      ROUND(AVG(profit_cents),0) as avg_profit_cents
    FROM postback_log WHERE status = 'credited'
    GROUP BY offerwall ORDER BY revenue_cents DESC
  `).all();

  res.json({
    offerwalls: walls.map(w => ({
      name: w.offerwall,
      completions: w.completions,
      revenue: (w.revenue_cents / 100).toFixed(2),
      payoutToUsers: (w.payout_coins / 1000).toFixed(2),
      profit: (w.profit_cents / 100).toFixed(2),
      margin: w.revenue_cents > 0 ? ((w.profit_cents / w.revenue_cents) * 100).toFixed(1) + '%' : '0%',
      avgRevenue: (w.avg_revenue_cents / 100).toFixed(2),
      avgProfit: (w.avg_profit_cents / 100).toFixed(2),
    }))
  });
});

// Admin: User management
app.get('/api/admin/users', authenticate, adminOnly, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 25, 100);
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  let query = `SELECT id, email, username, role, coins, lifetime_earned, total_withdrawn, level_name,
    streak_days, referral_earnings, is_banned, created_at, last_login, ip_address, country
    FROM users`;
  let countQuery = 'SELECT COUNT(*) as count FROM users';
  const params = [];

  if (search) {
    const where = ' WHERE email LIKE ? OR username LIKE ?';
    query += where;
    countQuery += where;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const total = db.prepare(countQuery).get(...params).count;
  const users = db.prepare(query).all(...params, limit, offset);

  res.json({ users, total, page, pages: Math.ceil(total / limit) });
});

// Admin: Ban/unban user
app.post('/api/admin/users/:id/ban', authenticate, adminOnly, (req, res) => {
  const { reason } = req.body;
  db.prepare('UPDATE users SET is_banned = 1, ban_reason = ? WHERE id = ? AND role != "admin"')
    .run(reason || 'Violation of terms', req.params.id);
  res.json({ success: true });
});

app.post('/api/admin/users/:id/unban', authenticate, adminOnly, (req, res) => {
  db.prepare('UPDATE users SET is_banned = 0, ban_reason = NULL WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Admin: Process pending payouts
app.get('/api/admin/payouts', authenticate, adminOnly, (req, res) => {
  const status = req.query.status || 'pending';
  const payouts = db.prepare(`
    SELECT p.*, u.username, u.email
    FROM payouts p JOIN users u ON u.id = p.user_id
    WHERE p.status = ? ORDER BY p.created_at ASC LIMIT 100
  `).all(status);
  res.json({ payouts });
});

app.post('/api/admin/payouts/:id/approve', authenticate, adminOnly, (req, res) => {
  const { transactionRef } = req.body;
  db.prepare('UPDATE payouts SET status = "completed", transaction_ref = ?, processed_at = datetime("now") WHERE id = ? AND status = "pending"')
    .run(transactionRef || 'manual-' + Date.now(), req.params.id);
  res.json({ success: true });
});

app.post('/api/admin/payouts/:id/reject', authenticate, adminOnly, (req, res) => {
  const payout = db.prepare('SELECT * FROM payouts WHERE id = ? AND status = "pending"').get(req.params.id);
  if (!payout) return res.status(404).json({ error: 'Payout not found' });

  // Refund coins to user
  db.prepare('UPDATE users SET coins = coins + ?, total_withdrawn = total_withdrawn - ? WHERE id = ?')
    .run(payout.coins, payout.coins, payout.user_id);
  db.prepare('UPDATE payouts SET status = "cancelled" WHERE id = ?').run(req.params.id);
  db.prepare(`INSERT INTO transactions (user_id, type, coins, description) VALUES (?, 'admin_adjustment', ?, 'Payout #${payout.id} cancelled — coins refunded')`)
    .run(payout.user_id, payout.coins);

  res.json({ success: true });
});

// Admin: Revenue analytics over time
app.get('/api/admin/analytics', authenticate, adminOnly, (req, res) => {
  const days = parseInt(req.query.days) || 30;

  const daily = db.prepare(`
    SELECT date(created_at) as date,
      COUNT(*) as offers,
      COALESCE(SUM(revenue_cents),0) as revenue,
      COALESCE(SUM(profit_cents),0) as profit,
      COALESCE(SUM(payout_coins),0) as coins_paid
    FROM postback_log WHERE status = 'credited'
    AND created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY date(created_at) ORDER BY date
  `).all(days);

  const signups = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count
    FROM users WHERE created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY date(created_at) ORDER BY date
  `).all(days);

  res.json({ daily, signups, days });
});

// Admin: Fraud detection
app.get('/api/admin/fraud', authenticate, adminOnly, (req, res) => {
  // Users with same IP creating multiple accounts
  const multiAccounts = db.prepare(`
    SELECT ip_address, COUNT(*) as accounts, GROUP_CONCAT(username) as usernames
    FROM users WHERE ip_address IS NOT NULL
    GROUP BY ip_address HAVING accounts > 2
    ORDER BY accounts DESC LIMIT 20
  `).all();

  // Unusually high earnings in short time
  const highEarners = db.prepare(`
    SELECT u.id, u.username, u.email, u.ip_address, u.created_at,
      COALESCE(SUM(t.coins),0) as earned_today
    FROM users u
    JOIN transactions t ON t.user_id = u.id AND t.coins > 0 AND date(t.created_at) = date('now')
    GROUP BY u.id HAVING earned_today > 100000
    ORDER BY earned_today DESC LIMIT 20
  `).all();

  res.json({ multiAccounts, highEarners });
});

// ─── SEED ADMIN USER ───
(async () => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@pocketlined.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'PocketLined2026!';
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existing) {
    const hash = await bcrypt.hash(adminPass, 12);
    db.prepare(`INSERT INTO users (email, username, password_hash, role, coins, referral_code)
      VALUES (?, 'Admin', ?, 'admin', 0, 'admin')`).run(adminEmail, hash);
    console.log(`Admin user created: ${adminEmail}`);
  }
})();

// ─── START SERVER ───
app.listen(PORT, () => {
  console.log(`\n  PocketLined Backend running on port ${PORT}`);
  console.log(`  Member API:  http://localhost:${PORT}/api`);
  console.log(`  Admin API:   http://localhost:${PORT}/api/admin (requires admin JWT)`);
  console.log(`  Postbacks:   http://localhost:${PORT}/postback/{wallname}\n`);
});

module.exports = app;
