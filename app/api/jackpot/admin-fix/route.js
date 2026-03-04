export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServiceClient();

    // 1. Check user role (admin only)
    const { data: u } = await db.from('users').select('role').eq('id', user.id).single();
    if (u?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    // 2. Delete all bets (they're orphaned anyway)
    const { data: deletedBets } = await db.from('jackpot_bets').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('id');

    // 3. Delete all rounds
    const { data: deletedRounds } = await db.from('jackpot_rounds').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('id');

    // 4. Give admin user 50000 coins ($50) for testing
    const { data: updatedUser, error: updateErr } = await db.from('users').update({ coins: 50000 }).eq('id', user.id).select('id, coins').single();

    // Verify
    const { data: verify } = await db.from('users').select('id, coins').eq('id', user.id).single();

    // 5. Create exactly one active round per tier
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
