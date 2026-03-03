import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  const db = createServiceClient();
  let query = db.from('users').select('id, username, email, coins, role, is_banned, ip_address, country, created_at, last_active, streak, level_idx', { count: 'exact' });

  if (search) {
    query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: users, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return NextResponse.json({ users: users || [], total: count || 0, page, totalPages: Math.ceil((count || 0) / limit) });
}

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { userId, action } = await request.json();
  if (!userId || !['ban', 'unban'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const db = createServiceClient();
  await db.from('users').update({ is_banned: action === 'ban' }).eq('id', userId);

  return NextResponse.json({ success: true, action });
}
