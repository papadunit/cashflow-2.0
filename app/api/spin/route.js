import { NextResponse } from 'next/server';
import { authenticate, creditCoins } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function POST(request) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  // Check if already spun today
  const { data: existing } = await db
    .from('daily_spins')
    .select('id')
    .eq('user_id', user.id)
    .eq('spin_date', today)
    .limit(1);

  if (existing?.length > 0) {
    return NextResponse.json({ error: 'Already spun today' }, { status: 429 });
  }

  // Variable ratio reinforcement — unpredictable rewards
  const roll = Math.random();
  const coins = roll < 0.02 ? 50000 : roll < 0.08 ? 10000 : roll < 0.20 ? 5000 : roll < 0.40 ? 2000 : roll < 0.65 ? 1000 : 500;

  // Record spin
  await db.from('daily_spins').insert({ user_id: user.id, coins_won: coins, spin_date: today });

  // Credit coins
  await creditCoins(db, user.id, coins, 'spin_reward', `Daily spin reward: ${coins.toLocaleString()} coins`);

  return NextResponse.json({ coins, message: `You won ${coins.toLocaleString()} coins!` });
}
