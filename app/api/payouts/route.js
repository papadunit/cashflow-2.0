export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  const { data: payouts } = await db
    .from('payouts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json(payouts || []);
}

export async function POST(request) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { method, coins, destination } = await request.json();
  if (!method || !coins || !destination) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const MINIMUMS = {
    paypal: 5000, venmo: 5000, cashapp: 5000, btc: 5000, eth: 5000, usdt: 5000,
    amazon: 5000, visa: 10000, steam: 5000, apple: 5000, google: 5000, walmart: 5000,
  };

  if (!MINIMUMS[method]) return NextResponse.json({ error: 'Invalid method' }, { status: 400 });
  if (coins < MINIMUMS[method]) return NextResponse.json({ error: `Minimum ${MINIMUMS[method]} coins` }, { status: 400 });
  if (user.coins < coins) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });

  const db = createServiceClient();

  // Require minimum offerwall earnings before ANY cashout
  const { data: offerEarnings } = await db
    .from('transactions')
    .select('coins')
    .eq('user_id', user.id)
    .eq('type', 'offer_credit');
  const totalOfferEarnings = (offerEarnings || []).reduce((sum, t) => sum + t.coins, 0);
  if (totalOfferEarnings < 5000) {
    return NextResponse.json({
      error: 'You need to earn at least 5,000 coins from offers before you can cash out. Keep completing offers!'
    }, { status: 400 });
  }
  const usd_amount = (coins / 1000).toFixed(2);

  // Debit coins
  await db.from('users').update({ coins: user.coins - coins }).eq('id', user.id);

  // Log transaction
  await db.from('transactions').insert({
    user_id: user.id, type: 'cashout', coins: -coins,
    description: `Withdrawal: $${usd_amount} via ${method}`,
  });

  // Create payout record
  const { data: payout } = await db.from('payouts').insert({
    user_id: user.id, method, coins, usd_amount, destination,
  }).select().single();

  return NextResponse.json({ success: true, payout });
}
