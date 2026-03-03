export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const db = createServiceClient();

  // Multi-account detection: IPs with multiple accounts
  const { data: allUsers } = await db
    .from('users')
    .select('ip_address, username, id')
    .not('ip_address', 'is', null);

  const ipMap = {};
  (allUsers || []).forEach(u => {
    if (!u.ip_address) return;
    if (!ipMap[u.ip_address]) ipMap[u.ip_address] = [];
    ipMap[u.ip_address].push(u.username);
  });

  const multiAccount = Object.entries(ipMap)
    .filter(([, users]) => users.length >= 3)
    .map(([ip, users]) => ({ ip, count: users.length, users }))
    .sort((a, b) => b.count - a.count);

  // High earners: users who earned significantly more than average in 24h
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const { data: recentTxns } = await db
    .from('transactions')
    .select('user_id, coins')
    .gte('created_at', yesterday)
    .gt('coins', 0);

  const userEarnings = {};
  (recentTxns || []).forEach(t => {
    userEarnings[t.user_id] = (userEarnings[t.user_id] || 0) + t.coins;
  });

  const earningValues = Object.values(userEarnings);
  const avgEarning = earningValues.length > 0 ? earningValues.reduce((a, b) => a + b, 0) / earningValues.length : 0;

  const highEarners = [];
  for (const [userId, coins24h] of Object.entries(userEarnings)) {
    if (avgEarning > 0 && coins24h > avgEarning * 10) {
      const { data: user } = await db.from('users').select('username').eq('id', userId).single();
      highEarners.push({
        username: user?.username || 'Unknown',
        coins24h,
        avgCoins24h: Math.floor(avgEarning),
        ratio: (coins24h / avgEarning).toFixed(1),
      });
    }
  }

  return NextResponse.json({
    multiAccount,
    highEarners: highEarners.sort((a, b) => b.coins24h - a.coins24h),
  });
}
