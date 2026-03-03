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
    paypal: 1000, venmo: 1000, cashapp: 1000, btc: 2000, eth: 2000, usdt: 2000,
    amazon: 1000, visa: 5000, steam: 1000, apple: 1000, google: 1000, walmart: 1000,
  };

  if (!MINIMUMS[method]) return NextResponse.json({ error: 'Invalid method' }, { status: 400 });
  if (coins < MINIMUMS[method]) return NextResponse.json({ error: `Minimum ${MINIMUMS[method]} coins` }, { status: 400 });
  if (user.coins < coins) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });

  const db = createServiceClient();
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
