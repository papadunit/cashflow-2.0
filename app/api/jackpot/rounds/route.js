export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Color palette for wheel segments
const SLOT_COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE',
  '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#A2845E'
];

// Bot fill config
const BOT_FILL_DELAY_SEC = 8;   // Wait 8s before first bot joins
const BOT_FILL_RATE = 1;        // Add 1 bot per poll cycle (sometimes 0 for natural feel)
const BOT_SKIP_CHANCE = 0.3;    // 30% chance to skip filling on a poll (looks more natural)

/**
 * Auto-fill empty slots with bot players to keep the wheel engaging.
 * Adds bots gradually (1-2 per call) to simulate real players joining.
 */
async function autoFillBots(db, activeRound, tier) {
  try {
    // Check how long the round has been active
    const roundAge = (Date.now() - new Date(activeRound.created_at).getTime()) / 1000;
    if (roundAge < BOT_FILL_DELAY_SEC) return; // Too early, let real players join first

    // Get current bets
    const { data: currentBets } = await db
      .from('jackpot_bets')
      .select('*')
      .eq('round_id', activeRound.id);

    const filledCount = (currentBets || []).length;
    const emptyCount = tier.slots_total - filledCount;
    if (emptyCount <= 0) return; // Round is full

    // Randomly skip some polls for natural feel
    if (Math.random() < BOT_SKIP_CHANCE) return;

    // Add 1 bot per poll (occasionally 2 when almost full to speed up)
    const botsToAdd = Math.min(
      emptyCount <= 2 ? emptyCount : BOT_FILL_RATE,
      emptyCount
    );

    // Get available bot users not already in this round
    const existingUserIds = new Set((currentBets || []).map(b => b.user_id));
    const { data: availableBots } = await db.from('users')
      .select('id, username')
      .like('email', '%@pocketlined.bot');

    const bots = (availableBots || [])
      .filter(b => !existingUserIds.has(b.id))
      .sort(() => Math.random() - 0.5);

    if (bots.length === 0) return;

    // Find available slot numbers
    const takenSlots = new Set((currentBets || []).map(b => b.slot_number));
    const availableSlots = [];
    for (let i = 0; i < tier.slots_total; i++) {
      if (!takenSlots.has(i)) availableSlots.push(i);
    }

    let addedCount = 0;
    for (let i = 0; i < botsToAdd && i < availableSlots.length && i < bots.length; i++) {
      const slotNum = availableSlots[i];
      const bot = bots[i];

      const { error } = await db.from('jackpot_bets').insert({
        round_id: activeRound.id,
        user_id: bot.id,
        slot_number: slotNum,
        bet_amount: tier.entry_cost,
        user_color: SLOT_COLORS[slotNum % SLOT_COLORS.length],
        user_avatar: bot.username[0].toUpperCase(),
        username: bot.username,
      });

      if (!error) addedCount++;
    }

    // Update pool
    if (addedCount > 0) {
      const newPool = (activeRound.total_pool || 0) + (addedCount * tier.entry_cost);
      await db.from('jackpot_rounds').update({ total_pool: newPool }).eq('id', activeRound.id);
    }
  } catch {
    // Silently fail — bots are optional enhancement
  }
}

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
      .order('created_at', { ascending: true })
      .limit(1);

    let activeRound = rounds?.[0] || null;

    // Auto-create new round if none exists
    if (!activeRound) {
      const { data: newRound, error: createErr } = await db
        .from('jackpot_rounds')
        .insert({ tier_id: tierId, status: 'active', total_pool: 0 })
        .select()
        .single();
      if (createErr) {
        const { data: retry } = await db
          .from('jackpot_rounds')
          .select('*')
          .eq('tier_id', tierId)
          .eq('status', 'active')
          .order('created_at', { ascending: true })
          .limit(1);
        activeRound = retry?.[0];
        if (!activeRound) return NextResponse.json({ error: createErr.message }, { status: 500 });
      } else {
        activeRound = newRound;
      }
    }

    // Auto-fill bots (non-blocking, runs in background of this request)
    await autoFillBots(db, activeRound, tier);

    // Get bets for this round (re-fetch after potential bot fill)
    const { data: rawBets } = await db
      .from('jackpot_bets')
      .select('*')
      .eq('round_id', activeRound.id)
      .order('slot_number', { ascending: true });

    // Map to needed fields + add avatar_url for profile images
    const bets = (rawBets || []).map(b => ({
      slot_number: b.slot_number,
      bet_amount: b.bet_amount,
      user_color: b.user_color,
      user_avatar: b.user_avatar,
      user_id: b.user_id,
      username: b.username,
      avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(b.username || 'anon')}&size=64`,
    }));

    const totalPool = bets.reduce((sum, b) => sum + Number(b.bet_amount), 0);
    const slotsFilled = bets.length;

    // Calculate win chances
    const formattedBets = bets.map(b => ({
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
