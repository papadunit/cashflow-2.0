import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { creditCoins } from '@/lib/auth';

// ═══════════════════════════════════════════════════════════
//  OFFERWALL POSTBACK HANDLER
//  All 12 offerwalls POST/GET here with wall_name param
//  URL pattern: /api/postback?wall=adgem&user_id=xxx&amount=yyy&txn_id=zzz
// ═══════════════════════════════════════════════════════════

const WALL_SECRETS = {
  adgate: process.env.ADGATE_SECRET,
  adgem: process.env.ADGEM_SECRET,
  offertoro: process.env.OFFERTORO_SECRET,
  lootably: process.env.LOOTABLY_SECRET,
  ayet: process.env.AYET_SECRET,
  revenueuniverse: process.env.REVENUEUNIVERSE_SECRET,
  cpxresearch: process.env.CPXRESEARCH_SECRET,
  bitlabs: process.env.BITLABS_SECRET,
  theoremreach: process.env.THEOREMREACH_SECRET,
  pollfish: process.env.POLLFISH_SECRET,
  tyrads: process.env.TYRADS_SECRET,
  torox: process.env.TOROX_SECRET,
};

const WALL_NAMES = {
  adgate: 'AdGate Media', adgem: 'AdGem', offertoro: 'OfferToro',
  lootably: 'Lootably', ayet: 'Ayet Studios', revenueuniverse: 'Revenue Universe',
  cpxresearch: 'CPX Research', bitlabs: 'BitLabs', theoremreach: 'TheoremReach',
  pollfish: 'Pollfish', tyrads: 'TyrAds', torox: 'Torox',
};

export async function GET(request) {
  return handlePostback(request);
}

export async function POST(request) {
  return handlePostback(request);
}

async function handlePostback(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wall = searchParams.get('wall')?.toLowerCase();
    const userId = searchParams.get('user_id');
    const transactionId = searchParams.get('txn_id');
    const amount = parseInt(searchParams.get('amount') || '0'); // coins
    const revenueCents = parseInt(searchParams.get('revenue') || '0');
    const offerId = searchParams.get('offer_id') || '';
    const offerName = searchParams.get('offer_name') || '';
    const secret = searchParams.get('secret') || '';

    // Validate
    if (!wall || !WALL_SECRETS[wall]) return new Response('Invalid wall', { status: 400 });
    if (!userId || !transactionId || !amount) return new Response('Missing params', { status: 400 });

    // Verify secret
    if (WALL_SECRETS[wall] && secret !== WALL_SECRETS[wall]) {
      return new Response('Invalid secret', { status: 403 });
    }

    const db = createServiceClient();

    // Dedup check
    const { data: existing } = await db
      .from('postback_log')
      .select('id')
      .eq('transaction_id', transactionId)
      .limit(1);

    if (existing?.length > 0) return new Response('Duplicate', { status: 200 });

    // Calculate profit
    const payoutCents = Math.floor(amount / 10); // 1000 coins = $1 = 100 cents
    const profitCents = revenueCents - payoutCents;

    // Log postback (admin-only table)
    await db.from('postback_log').insert({
      wall_name: WALL_NAMES[wall] || wall,
      transaction_id: transactionId,
      user_id: userId,
      offer_id: offerId,
      offer_name: offerName,
      payout_coins: amount,
      revenue_cents: revenueCents,
      profit_cents: profitCents,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      raw_params: Object.fromEntries(searchParams),
    });

    // Credit user
    await creditCoins(
      db, userId, amount, 'offer_complete',
      `${offerName || 'Offer'} via ${WALL_NAMES[wall] || wall}`,
      { offer_id: offerId, wall_name: WALL_NAMES[wall] || wall }
    );

    return new Response('OK', { status: 200 });
  } catch (err) {
    console.error('Postback error:', err);
    return new Response('Error', { status: 500 });
  }
}
