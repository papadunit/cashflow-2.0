export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authenticate, getLevel } from '@/lib/auth';

export async function GET(request) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const level = getLevel(user.coins);
  return NextResponse.json({
    id: user.id, username: user.username, email: user.email,
    coins: user.coins, lifetime_earned: user.lifetime_earned,
    role: user.role, streak: user.streak, level: level,
    referral_code: user.referral_code, created_at: user.created_at,
  });
}
