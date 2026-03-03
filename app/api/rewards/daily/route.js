export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authenticate, creditCoins } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

// ─── DAILY CHEST + STREAK BONUS ───
// POST /api/rewards/daily?type=chest|streak
// Server-side gating ensures no double-claims

export async function POST(request) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'chest' or 'streak'

  if (!type || !['chest', 'streak'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  const db = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  if (type === 'chest') {
    // Check if already claimed today — use daily_spins table with a special marker
    const { data: existing } = await db
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'streak_bonus')
      .gte('created_at', today + 'T00:00:00')
      .lte('created_at', today + 'T23:59:59')
      .like('description', '%Daily chest%')
      .limit(1);

    if (existing?.length > 0) {
      return NextResponse.json({ error: 'Already claimed today' }, { status: 429 });
    }

    // Calculate reward — streak multiplier
    const streak = user.streak || 0;
    const base = 100 + Math.min(streak, 30) * 10; // 100-400 base
    const roll = Math.random();
    const mult = roll < 0.05 ? 5 : roll < 0.15 ? 3 : roll < 0.35 ? 2 : 1;
    const coins = base * mult;

    await creditCoins(db, user.id, coins, 'streak_bonus', `Daily chest: ${coins.toLocaleString()} coins (${streak} day streak)`);

    return NextResponse.json({ coins, message: `Chest opened! ${coins.toLocaleString()} coins` });
  }

  if (type === 'streak') {
    // Streak bonus: once per 7-day cycle
    const streak = user.streak || 0;
    const cycle = Math.floor(streak / 7);

    // Check if this cycle's bonus was already claimed
    const { data: existing } = await db
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'streak_bonus')
      .like('description', `%streak cycle ${cycle}%`)
      .limit(1);

    if (existing?.length > 0) {
      return NextResponse.json({ error: 'Streak bonus already claimed for this cycle' }, { status: 429 });
    }

    if (streak < 7) {
      return NextResponse.json({ error: 'Need 7+ day streak' }, { status: 400 });
    }

    const roll = Math.random();
    const mult = roll < 0.05 ? 5 : roll < 0.15 ? 3 : roll < 0.35 ? 2 : roll < 0.65 ? 1.5 : 1;
    const coins = Math.round(150 * mult);

    await creditCoins(db, user.id, coins, 'streak_bonus', `Streak bonus: ${coins.toLocaleString()} coins (streak cycle ${cycle})`);

    return NextResponse.json({ coins, message: `Streak bonus! ${coins.toLocaleString()} coins` });
  }
}
