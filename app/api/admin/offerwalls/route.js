export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const db = createServiceClient();
  const { data: logs } = await db.from('postback_log').select('wall_name, revenue_cents, payout_coins, profit_cents');

  // Aggregate by wall
  const walls = {};
  (logs || []).forEach(l => {
    if (!walls[l.wall_name]) walls[l.wall_name] = { name: l.wall_name, completions: 0, revenue: 0, payout: 0, profit: 0 };
    walls[l.wall_name].completions++;
    walls[l.wall_name].revenue += l.revenue_cents;
    walls[l.wall_name].payout += Math.floor(l.payout_coins / 10); // coins to cents
    walls[l.wall_name].profit += l.profit_cents;
  });

  const result = Object.values(walls).map(w => ({
    ...w,
    margin: w.revenue > 0 ? ((w.profit / w.revenue) * 100).toFixed(1) : 0,
  })).sort((a, b) => b.revenue - a.revenue);

  return NextResponse.json(result);
}
