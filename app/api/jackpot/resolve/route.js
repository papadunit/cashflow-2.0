export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authenticate, creditCoins } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { round_id } = await request.json();
    if (!round_id) return NextResponse.json({ error: 'round_id required' }, { status: 400 });

    const db = createServiceClient();

    // Get round
    const { data: round } = await db.from('jackpot_rounds').select('*').eq('id', round_id).single();
    if (!round) return NextResponse.json({ error: 'Round not found' }, { status: 404 });

    // Already resolved
    if (round.status === 'resolved') {
      return NextResponse.json({
        already_resolved: true,
        winner_id: round.winner_id,
        winner_slot: round.winner_slot,
      });
    }

    // Get tier info
    const { data: tier } = await db.from('jackpot_tiers').select('*').eq('id', round.tier_id).single();

    // Get all bets
    const { data: bets } = await db
      .from('jackpot_bets')
      .select('*')
      .eq('round_id', round_id)
      .order('slot_number', { ascending: true });

    if (!bets || bets.length < tier.slots_total) {
      return NextResponse.json({ error: 'Round is not full yet' }, { status: 400 });
    }

    // Calculate total pool
    const totalPool = bets.reduce((sum, b) => sum + Number(b.bet_amount), 0);
    const houseCut = Math.floor(totalPool * tier.house_cut_pct / 100);
    const prizeAmount = totalPool - houseCut;

    // Weighted random selection (more slots = higher chance)
    const randomSeed = Math.random();
    let randomVal = randomSeed * totalPool;
    let cumulative = 0;
    let winnerBet = bets[0]; // fallback

    for (const bet of bets) {
      cumulative += Number(bet.bet_amount);
      if (randomVal <= cumulative) {
        winnerBet = bet;
        break;
      }
    }

    // Update round as resolved
    await db.from('jackpot_rounds').update({
      status: 'resolved',
      winner_id: winnerBet.user_id,
      winner_slot: winnerBet.slot_number,
      total_pool: totalPool,
      random_seed: randomSeed.toString(),
      resolved_at: new Date().toISOString(),
    }).eq('id', round_id);

    // Credit winner (using creditCoins for level bonus + referral commission)
    await creditCoins(
      db,
      winnerBet.user_id,
      prizeAmount,
      'jackpot_win',
      `Jackpot winner! $${(prizeAmount / 1000).toFixed(2)} from ${tier.name}`
    );

    // Create new active round for this tier
    await db.from('jackpot_rounds').insert({
      tier_id: round.tier_id,
      status: 'active',
      total_pool: 0,
    });

    return NextResponse.json({
      success: true,
      round_id,
      winner_id: winnerBet.user_id,
      winner_slot: winnerBet.slot_number,
      winner_username: winnerBet.username,
      winner_color: winnerBet.user_color,
      prize_amount: prizeAmount,
      house_cut: houseCut,
      total_pool: totalPool,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
