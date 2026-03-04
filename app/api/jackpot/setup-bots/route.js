export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

// Bot usernames — realistic mix
const BOT_NAMES = [
  'Jake_92', 'SarahK', 'LuckyMike', 'xNova', 'Ella_Mae', 'CryptoKing',
  'MaxWins', 'Luna_x', 'BettyB', 'RyanG', 'ZoeyStacks', 'DJSpin',
  'MrClutch', 'AlexP', 'Natasha7', 'BigTuna', 'IcyVeins', 'Mia_Rose',
  'TylerD', 'KiraQ', 'Ghost99', 'Sammy_J', 'LilPepper', 'QueenBee',
  'Chad_W', 'OliviaG', 'Niko_X', 'SpinToWin', 'RubyRed', 'EthanK',
  'PennySlot', 'Ace_High', 'DannyB', 'SkylerM', 'JackPott', 'RoseGold',
  'Maverick', 'HaileyS', 'BlazeFire', 'LenaV', 'RocketMan', 'AmberW',
  'PixelDust', 'LoganX', 'StarGirl', 'CooperJ', 'VelvetAce', 'Brooke88',
  'ThunderJ', 'ClaraM',
];

/**
 * POST /api/jackpot/setup-bots
 * Admin-only: Creates bot user records in the users table.
 * Run once to seed bot users, then the /api/jackpot/bots endpoint can use them.
 */
export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServiceClient();
    const { data: u } = await db.from('users').select('role').eq('id', user.id).single();
    if (u?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const created = [];
    const skipped = [];
    const errors = [];

    for (const name of BOT_NAMES) {
      const botEmail = `bot_${name.toLowerCase()}@pocketlined.bot`;

      // Check if already exists
      const { data: existing } = await db.from('users')
        .select('id')
        .eq('email', botEmail)
        .single();

      if (existing) {
        skipped.push(name);
        continue;
      }

      // Create bot user
      const { data: newUser, error: insertErr } = await db.from('users').insert({
        username: name,
        email: botEmail,
        password_hash: 'BOT_ACCOUNT_NO_LOGIN',
        role: 'member',
        coins: 0,
        lifetime_earned: 0,
        streak: 0,
      }).select('id, username, email').single();

      if (insertErr) {
        errors.push({ name, error: insertErr.message });
      } else if (newUser) {
        created.push({ id: newUser.id, username: newUser.username });
      }
    }

    return NextResponse.json({
      success: true,
      total_bot_names: BOT_NAMES.length,
      created_count: created.length,
      skipped_count: skipped.length,
      error_count: errors.length,
      created,
      skipped,
      errors: errors.slice(0, 5),  // First 5 errors for debug
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}

/**
 * GET /api/jackpot/setup-bots
 * Returns list of existing bot users.
 */
export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = createServiceClient();
    const { data: bots } = await db.from('users')
      .select('id, username, email')
      .like('email', '%@pocketlined.bot')
      .order('username', { ascending: true });

    return NextResponse.json({
      bot_count: bots?.length || 0,
      bots: bots || [],
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
