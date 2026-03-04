export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Color palette for wheel segments
const SLOT_COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE',
  '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#A2845E'
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tierId = searchParams.get('tier_id');
    if (!tierId) return NextResponse.json({ error: 'tier_id required' }, { status: 400 });

    const db = createServiceClient();

    // Get tier info
    const { data: tier } = await db.from('jackpot_tiers').select('*').eq('id', tierId).single();
    if (!tier) return NextResponse.json({ error: 'Tier not found' }, { status: 404 });

    // Find active round for this tier
    let { data: rounds } = await db
      .from('jackpot_rounds')
      .select('*')
      .eq('tier_id', tierId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    let activeRound = rounds?.[0] || null;

    // Auto-create new round if none exists
    if (!activeRound) {
      const { data: newRound, error: createErr } = await db
        .from('jackpot_rounds')
        .insert({ tier_id: tierId, status: 'active', total_pool: 0 })
        .select()
        .single();
      if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });
      activeRound = newRound;
    }

    // Get bets for this round
    const { data: bets } = await db
      .from('jackpot_bets')
      .select('slot_number, bet_amount, user_color, user_avatar, user_id, username')
      .eq('round_id', activeRound.id)
      .order('slot_number', { ascending: true });

    const totalPool = (bets || []).reduce((sum, b) => sum + Number(b.bet_amount), 0);
    const slotsFilled = (bets || []).length;

    // Calculate win chances
    const formattedBets = (bets || []).map(b => ({
      ...b,
      chance_pct: totalPool > 0 ? ((Number(b.bet_amount) / totalPool) * 100).toFixed(1) : '0',
    }));

    // Get recent resolved rounds for this tier (social proof)
    const { data: recentWins } = await db
      .from('jackpot_rounds')
      .select('id, total_pool, winner_id, resolved_at')
      .eq('tier_id', tierId)
      .eq('status', 'resolved')
      .order('resolved_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      active_round: {
        id: activeRound.id,
        tier_id: tierId,
        status: activeRound.status,
        total_pool: totalPool,
        slots_total: tier.slots_total,
        slots_filled: slotsFilled,
        entry_cost: tier.entry_cost,
        house_cut_pct: tier.house_cut_pct,
        bets: formattedBets,
        winner_id: activeRound.winner_id,
        winner_slot: activeRound.winner_slot,
      },
      recent_wins: recentWins || [],
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
