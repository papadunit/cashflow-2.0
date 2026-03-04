export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

const SLOT_COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE',
  '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#A2845E'
];

const MAX_SLOTS_PER_USER = 3;

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tier_id } = await request.json();
    if (!tier_id) return NextResponse.json({ error: 'tier_id required' }, { status: 400 });

    const db = createServiceClient();

    // Get tier
    const { data: tier } = await db.from('jackpot_tiers').select('*').eq('id', tier_id).single();
    if (!tier || !tier.is_active) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });

    // Check balance
    if (user.coins < tier.entry_cost) {
      return NextResponse.json({
        error: `Not enough balance. You need $${(tier.entry_cost / 1000).toFixed(2)} but have $${(user.coins / 1000).toFixed(2)}.`
      }, { status: 400 });
    }

    // Get or create active round
    let { data: rounds } = await db
      .from('jackpot_rounds')
      .select('*')
      .eq('tier_id', tier_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    let activeRound = rounds?.[0];
    if (!activeRound) {
      const { data: newRound } = await db
        .from('jackpot_rounds')
        .insert({ tier_id: tier_id, status: 'active', total_pool: 0 })
        .select()
        .single();
      activeRound = newRound;
    }

    // Get existing bets for this round
    const { data: existingBets } = await db
      .from('jackpot_bets')
      .select('slot_number, user_id')
      .eq('round_id', activeRound.id)
      .order('slot_number', { ascending: true });

    const filledSlots = existingBets || [];

    // Check if round is full
    if (filledSlots.length >= tier.slots_total) {
      return NextResponse.json({ error: 'Round is full. A new round will start soon.' }, { status: 409 });
    }

    // Check max slots per user
    const userSlotsInRound = filledSlots.filter(b => b.user_id === user.id).length;
    if (userSlotsInRound >= MAX_SLOTS_PER_USER) {
      return NextResponse.json({
        error: `You already have ${MAX_SLOTS_PER_USER} slots in this round (max allowed).`
      }, { status: 400 });
    }

    // Find first available slot number
    const takenSlots = new Set(filledSlots.map(b => b.slot_number));
    let slotNumber = -1;
    for (let i = 0; i < tier.slots_total; i++) {
      if (!takenSlots.has(i)) { slotNumber = i; break; }
    }
    if (slotNumber === -1) {
      return NextResponse.json({ error: 'No slots available' }, { status: 409 });
    }

    // Assign a consistent color for this user in this round
    const userColor = SLOT_COLORS[slotNumber % SLOT_COLORS.length];
    const userAvatar = (user.username || user.email || '?')[0].toUpperCase();

    // Deduct coins from user
    const newBalance = user.coins - tier.entry_cost;
    await db.from('users').update({
      coins: newBalance,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    // Insert bet
    const { error: betError } = await db.from('jackpot_bets').insert({
      round_id: activeRound.id,
      user_id: user.id,
      slot_number: slotNumber,
      bet_amount: tier.entry_cost,
      user_color: userColor,
      user_avatar: userAvatar,
      username: user.username || user.email.split('@')[0],
    });

    if (betError) {
      // Refund on error
      await db.from('users').update({ coins: user.coins }).eq('id', user.id);
      return NextResponse.json({ error: 'Failed to place bet: ' + betError.message }, { status: 500 });
    }

    // Log transaction
    await db.from('transactions').insert({
      user_id: user.id,
      type: 'jackpot_bet',
      coins: -tier.entry_cost,
      description: `Jackpot bet: $${(tier.entry_cost / 1000).toFixed(2)} on ${tier.name}`,
    });

    // Update round total_pool
    const newPool = (activeRound.total_pool || 0) + tier.entry_cost;
    await db.from('jackpot_rounds').update({ total_pool: newPool }).eq('id', activeRound.id);

    // Check if round is now full (all slots filled) → auto-resolve
    const totalFilledNow = filledSlots.length + 1;
    let roundFull = totalFilledNow >= tier.slots_total;

    return NextResponse.json({
      success: true,
      round_id: activeRound.id,
      slot_number: slotNumber,
      bet_amount: tier.entry_cost,
      coins_remaining: newBalance,
      slots_filled: totalFilledNow,
      slots_total: tier.slots_total,
      round_full: roundFull,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
