export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const db = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  // Total users
  const { count: totalUsers } = await db.from('users').select('*', { count: 'exact', head: true });
  const { count: newToday } = await db.from('users').select('*', { count: 'exact', head: true }).gte('created_at', today);
  const { count: activeToday } = await db.from('users').select('*', { count: 'exact', head: true }).eq('last_active', today);

  // Revenue from postback_log
  const { data: revToday } = await db.from('postback_log').select('revenue_cents, profit_cents').gte('created_at', today);
  const { data: revWeek } = await db.from('postback_log').select('revenue_cents, profit_cents').gte('created_at', weekAgo);
  const { data: revMonth } = await db.from('postback_log').select('revenue_cents, profit_cents').gte('created_at', monthAgo);
  const { data: revTotal } = await db.from('postback_log').select('revenue_cents, profit_cents');

  const sum = (arr, key) => (arr || []).reduce((a, r) => a + (r[key] || 0), 0);

  // Pending payouts
  const { count: pendingPayouts } = await db.from('payouts').select('*', { count: 'exact', head: true }).eq('status', 'pending');

  // Offers completed today
  const { count: offersToday } = await db.from('postback_log').select('*', { count: 'exact', head: true }).gte('created_at', today);
  const { count: offersMonth } = await db.from('postback_log').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo);

  return NextResponse.json({
    totalUsers: totalUsers || 0,
    newUsersToday: newToday || 0,
    activeToday: activeToday || 0,
    revenueToday: sum(revToday, 'revenue_cents'),
    revenueWeek: sum(revWeek, 'revenue_cents'),
    revenueMonth: sum(revMonth, 'revenue_cents'),
    revenueTotal: sum(revTotal, 'revenue_cents'),
    profitToday: sum(revToday, 'profit_cents'),
    profitWeek: sum(revWeek, 'profit_cents'),
    profitMonth: sum(revMonth, 'profit_cents'),
    profitTotal: sum(revTotal, 'profit_cents'),
    pendingPayouts: pendingPayouts || 0,
    offersToday: offersToday || 0,
    offersMonth: offersMonth || 0,
  });
}
