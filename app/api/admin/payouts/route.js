export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const db = createServiceClient();
  const { data: payouts } = await db
    .from('payouts')
    .select('*, user:user_id(username, email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  return NextResponse.json(payouts || []);
}

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { payoutId, action, note } = await request.json();
  if (!payoutId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const db = createServiceClient();
  const { data: payout } = await db.from('payouts').select('*').eq('id', payoutId).single();
  if (!payout) return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
  if (payout.status !== 'pending') return NextResponse.json({ error: 'Already processed' }, { status: 400 });

  if (action === 'approve') {
    await db.from('payouts').update({
      status: 'completed', admin_note: note || null, processed_at: new Date().toISOString(),
    }).eq('id', payoutId);
  } else {
    // Reject: refund coins to user
    const { data: user } = await db.from('users').select('coins').eq('id', payout.user_id).single();
    if (user) {
      await db.from('users').update({ coins: user.coins + payout.coins }).eq('id', payout.user_id);
    }
    await db.from('transactions').insert({
      user_id: payout.user_id, type: 'admin_adjustment', coins: payout.coins,
      description: `Payout rejected — coins refunded. ${note || ''}`,
    });
    await db.from('payouts').update({
      status: 'rejected', admin_note: note || null, processed_at: new Date().toISOString(),
    }).eq('id', payoutId);
  }

  return NextResponse.json({ success: true, action });
}
