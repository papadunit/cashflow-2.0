export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET() {
  try {
    const db = createServiceClient();
    const { data: tiers, error } = await db
      .from('jackpot_tiers')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(tiers || []);
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
