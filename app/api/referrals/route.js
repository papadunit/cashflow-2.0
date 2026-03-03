export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();
  const { data: referrals } = await db
    .from('referrals')
    .select('*, referred:referred_id(username, created_at)')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false });

  const totalCommission = (referrals || []).reduce((a, r) => a + (r.lifetime_commission || 0), 0);

  return NextResponse.json({
    referrals: referrals || [],
    total: referrals?.length || 0,
    totalCommission,
    referralCode: user.referral_code,
  });
}
