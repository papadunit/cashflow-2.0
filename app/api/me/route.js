export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authenticate, getLevel } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Debug: direct query to compare with authenticate result
  const db = createServiceClient();
  const { data: directUser } = await db.from('users').select('*').eq('id', user.id).single();

  const level = getLevel(directUser?.coins ?? user.coins);
  const coins = directUser?.coins ?? user.coins;
  return NextResponse.json({
    id: user.id, username: user.username, email: user.email,
    coins: coins, lifetime_earned: user.lifetime_earned,
    role: user.role, streak: user.streak, level: level,
    referral_code: user.referral_code, created_at: user.created_at,
    _debug_auth_coins: user.coins,
    _debug_direct_coins: directUser?.coins,
  });
}
