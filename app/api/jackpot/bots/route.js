export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const SLOT_COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE',
  '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#A2845E'
];

/**
 * POST /api/jackpot/bots
 * Fill empty slots in the active round with bot players.
 * Called automatically from the rounds polling endpoint when slots are empty.
 * Body: { tier_id: string, count?: number }
 * count = how many bots to add (default: fill ALL remaining slots)
 */
export async function POST(request) {
  try {
    const { tier_id, count } = await request.json();
    if (!tier_id) return NextResponse.json({ error: 'tier_id required' }, { status: 400 });

    const db = createServiceClient();

    // Get tier
    const { data: tier } = await db.from('jackpot_tiers').select('*').eq('id', tier_id).single();
    if (!tier || !tier.is_active) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });

    // Get active round
    let { data: rounds } = await db
      .from('jackpot_rounds')
      .select('*')
      .eq('tier_id', tier_id)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1);

    const activeRound = rounds?.[0];
    if (!activeRound) return NextResponse.json({ error: 'No active round' }, { status: 400 });

    // Get existing bets
    const { data: existingBets } = await db
      .from('jackpot_bets')
      .select('*')
      .eq('round_id', activeRound.id)
      .order('slot_number', { ascending: true });

    const filledSlots = existingBets || [];
    const emptySlotCount = tier.slots_total - filledSlots.length;

    if (emptySlotCount <= 0) {
      return NextResponse.json({ message: 'Round already full', bots_added: 0 });
    }

    // Determine how many bots to add
    const botsToAdd = count ? Math.min(count, emptySlotCount) : emptySlotCount;

    // Find available slot numbers
    const takenSlots = new Set(filledSlots.map(b => b.slot_number));
    const availableSlots = [];
    for (let i = 0; i < tier.slots_total; i++) {
      if (!takenSlots.has(i)) availableSlots.push(i);
    }

    // Get bot users from DB (role='bot'), excluding any already in this round
    const existingUserIds = new Set(filledSlots.map(b => b.user_id));
    const { data: allBots } = await db.from('users')
      .select('id, username')
      .eq('role', 'bot')
      .order('username', { ascending: true });

    const availableBots = (allBots || []).filter(b => !existingUserIds.has(b.id));

    // Shuffle bots randomly
    const shuffledBots = availableBots.sort(() => Math.random() - 0.5);

    if (shuffledBots.length === 0) {
      return NextResponse.json({ error: 'No bot users available. Run /api/jackpot/setup-bots first.' }, { status: 400 });
    }

    const botsInserted = [];

    for (let i = 0; i < botsToAdd && i < availableSlots.length && i < shuffledBots.length; i++) {
      const slotNum = availableSlots[i];
      const bot = shuffledBots[i];
      const botColor = SLOT_COLORS[slotNum % SLOT_COLORS.length];
      const botAvatar = bot.username[0].toUpperCase();

      const { error: insertErr } = await db.from('jackpot_bets').insert({
        round_id: activeRound.id,
        user_id: bot.id,
        slot_number: slotNum,
        bet_amount: tier.entry_cost,
        user_color: botColor,
        user_avatar: botAvatar,
        username: bot.username,
      });

      if (!insertErr) {
        botsInserted.push({ slot_number: slotNum, username: bot.username, user_id: bot.id });
      }
    }

    // Update round total_pool
    const newPool = (activeRound.total_pool || 0) + (botsInserted.length * tier.entry_cost);
    await db.from('jackpot_rounds').update({ total_pool: newPool }).eq('id', activeRound.id);

    return NextResponse.json({
      success: true,
      bots_added: botsInserted.length,
      bots: botsInserted,
      slots_filled: filledSlots.length + botsInserted.length,
      slots_total: tier.slots_total,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
