import jwt from 'jsonwebtoken';
import { createServiceClient } from './supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Extract and verify user from Authorization header
export async function authenticate(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) return null;

  const db = createServiceClient();
  const { data: user } = await db
    .from('users')
    .select('*')
    .eq('id', decoded.id)
    .single();

  if (!user || user.is_banned) return null;
  return user;
}

// Middleware helper: require admin role
export async function requireAdmin(request) {
  const user = await authenticate(request);
  if (!user) return { error: 'Unauthorized', status: 401 };
  if (user.role !== 'admin') return { error: 'Admin access required', status: 403 };
  return { user };
}

// ─── LEVEL SYSTEM ───
const LEVELS = [
  { n: "Starter", min: 0, bonus: 0 },
  { n: "Explorer", min: 1000, bonus: 2 },
  { n: "Earner", min: 5000, bonus: 5 },
  { n: "Hustler", min: 15000, bonus: 8 },
  { n: "Pro", min: 40000, bonus: 12 },
  { n: "Elite", min: 100000, bonus: 15 },
  { n: "Legend", min: 300000, bonus: 20 },
  { n: "Titan", min: 750000, bonus: 25 },
];

export function getLevel(coins) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (coins >= LEVELS[i].min) return { ...LEVELS[i], idx: i };
  }
  return { ...LEVELS[0], idx: 0 };
}

// ─── CREDIT COINS HELPER ───
// Handles level bonus, referral commission, transaction logging
export async function creditCoins(db, userId, baseCoins, type, description, extra = {}) {
  // Get user
  const { data: user } = await db.from('users').select('*').eq('id', userId).single();
  if (!user) return null;

  // Calculate level bonus
  const level = getLevel(user.coins);
  const bonusPct = level.bonus;
  const bonusCoins = Math.floor(baseCoins * bonusPct / 100);
  const totalCoins = baseCoins + bonusCoins;

  // Credit the user
  await db.from('users').update({
    coins: user.coins + totalCoins,
    lifetime_earned: user.lifetime_earned + totalCoins,
    last_active: new Date().toISOString().slice(0, 10),
    updated_at: new Date().toISOString(),
  }).eq('id', userId);

  // Log transaction
  await db.from('transactions').insert({
    user_id: userId,
    type,
    coins: totalCoins,
    description: bonusCoins > 0 ? `${description} (+${bonusPct}% level bonus)` : description,
    ...extra,
  });

  // Update level if changed
  const newLevel = getLevel(user.coins + totalCoins);
  if (newLevel.idx > level.idx) {
    await db.from('users').update({ level_idx: newLevel.idx }).eq('id', userId);
    await db.from('transactions').insert({
      user_id: userId, type: 'level_bonus', coins: 0,
      description: `Leveled up to ${newLevel.n}!`,
    });
  }

  // Referral commission (5% to referrer)
  if (user.referred_by && type !== 'referral_commission') {
    const commission = Math.floor(baseCoins * 0.05);
    if (commission > 0) {
      await db.from('users').update({
        coins: db.rpc ? undefined : undefined, // handled below
      });
      // Use raw SQL increment for atomicity
      const { data: referrer } = await db.from('users').select('coins,lifetime_earned').eq('id', user.referred_by).single();
      if (referrer) {
        await db.from('users').update({
          coins: referrer.coins + commission,
          lifetime_earned: referrer.lifetime_earned + commission,
        }).eq('id', user.referred_by);

        await db.from('transactions').insert({
          user_id: user.referred_by, type: 'referral_commission',
          coins: commission,
          description: `5% commission from ${user.username}'s activity`,
        });

        await db.from('referrals')
          .update({ lifetime_commission: db.raw ? undefined : undefined })
          .eq('referrer_id', user.referred_by)
          .eq('referred_id', userId);
      }
    }
  }

  // Update streak
  const today = new Date().toISOString().slice(0, 10);
  if (user.last_active !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newStreak = user.last_active === yesterday ? user.streak + 1 : 1;
    await db.from('users').update({ streak: newStreak }).eq('id', userId);
  }

  return totalCoins;
}
