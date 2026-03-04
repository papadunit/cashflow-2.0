export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

// GET: Debug endpoint to check bets and rounds state
export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServiceClient();

    // Check all active rounds
    const { data: activeRounds, error: roundsErr } = await db
      .from('jackpot_rounds')
      .select('*')
      .eq('status', 'active');

    // Check all bets
    const { data: allBets, error: betsErr } = await db
      .from('jackpot_bets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    // Check user coins
    const { data: userCheck } = await db.from('users').select('id, coins').eq('id', user.id).single();

    // Check RLS status
    const { data: rlsCheck, error: rlsErr } = await db.rpc('check_rls_status', {}).catch(() => ({ data: null, error: 'no rpc' }));

    return NextResponse.json({
      user_coins: userCheck?.coins,
      active_rounds: activeRounds,
      rounds_error: roundsErr?.message,
      all_bets: allBets,
      bets_error: betsErr?.message,
      bets_count: allBets?.length || 0,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServiceClient();

    const { data: u } = await db.from('users').select('role').eq('id', user.id).single();
    if (u?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    // Delete all bets
    const { data: deletedBets } = await db.from('jackpot_bets').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('id');

    // Delete all rounds
    const { data: deletedRounds } = await db.from('jackpot_rounds').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('id');

    // Give admin user 50000 coins
    const { data: updatedUser, error: updateErr } = await db.from('users').update({ coins: 50000 }).eq('id', user.id).select('id, coins').single();

    // Verify
    const { data: verify } = await db.from('users').select('id, coins').eq('id', user.id).single();

    // Create one active round per tier
    const { data: tiers } = await db.from('jackpot_tiers').select('id, name').eq('is_active', true);
    const newRounds = [];
    for (const tier of (tiers || [])) {
      const { data: nr } = await db.from('jackpot_rounds')
        .insert({ tier_id: tier.id, status: 'active', total_pool: 0 })
        .select()
        .single();
      newRounds.push({ tier: tier.name, round_id: nr?.id });
    }

    return NextResponse.json({
      success: true,
      deleted_bets: deletedBets?.length || 0,
      deleted_rounds: deletedRounds?.length || 0,
      coins_set: 50000,
      update_result: updatedUser,
      update_error: updateErr?.message || null,
      verify_coins: verify?.coins,
      user_id: user.id,
      new_rounds: newRounds,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
