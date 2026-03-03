export const dynamic = 'force-dynamic';
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

  // Require minimum offerwall earnings before spinning
  const { data: offerTransactions } = await db
    .from('transactions')
    .select('coins')
    .eq('user_id', user.id)
    .eq('type', 'offer_credit')
    .gte('created_at', today + 'T00:00:00')
    .lte('created_at', today + 'T23:59:59');
  const totalOfferCoins = (offerTransactions || []).reduce((sum, t) => sum + t.coins, 0);
  if (totalOfferCoins < 1000) {
    return NextResponse.json({ error: 'You need to earn at least 1,000 coins from offers today before you can spin' }, { status: 400 });
  }

  // Variable ratio reinforcement — unpredictable rewards
  const roll = Math.random();
  const coins = roll < 0.01 ? 5000 : roll < 0.05 ? 1000 : roll < 0.15 ? 500 : roll < 0.35 ? 250 : roll < 0.60 ? 100 : 50;

  // Record spin
  await db.from('daily_spins').insert({ user_id: user.id, coins_won: coins, spin_date: today });

  // Credit coins
  await creditCoins(db, user.id, coins, 'spin_reward', `Daily spin reward: ${coins.toLocaleString()} coins`);

  return NextResponse.json({ coins, message: `You won ${coins.toLocaleString()} coins!` });
}
