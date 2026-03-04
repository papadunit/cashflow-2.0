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

    // Delete all bets (use select('*') to work around RLS column-filtering)
    const { data: allBets } = await db.from('jackpot_bets').select('*');
    let deletedBetCount = 0;
    for (const bet of (allBets || [])) {
      await db.from('jackpot_bets').delete().eq('id', bet.id);
      deletedBetCount++;
    }

    // Delete all rounds
    const { data: allRounds } = await db.from('jackpot_rounds').select('*');
    let deletedRoundCount = 0;
    for (const round of (allRounds || [])) {
      await db.from('jackpot_rounds').delete().eq('id', round.id);
      deletedRoundCount++;
    }

    // Give admin user 50000 coins
    const { data: updatedUser, error: updateErr } = await db.from('users').update({ coins: 50000 }).eq('id', user.id).select('id, coins').single();

    // Verify with a SEPARATE service client to check cross-connection persistence
    const db2 = createServiceClient();
    const { data: verify } = await db2.from('users').select('id, coins').eq('id', user.id).single();

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
      deleted_bets: deletedBetCount,
      deleted_rounds: deletedRoundCount,
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
