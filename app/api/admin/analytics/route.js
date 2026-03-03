export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');

  const db = createServiceClient();
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

  const { data: analytics } = await db
    .from('analytics_daily')
    .select('*')
    .gte('date', since)
    .order('date', { ascending: true });

  return NextResponse.json(analytics || []);
}
