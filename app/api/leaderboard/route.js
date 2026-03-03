export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET() {
  const db = createServiceClient();
  const { data: leaders } = await db
    .from('users')
    .select('username, coins, level_idx, streak')
    .eq('is_banned', false)
    .eq('role', 'member')
    .order('coins', { ascending: false })
    .limit(100);

  return NextResponse.json(leaders || []);
}
