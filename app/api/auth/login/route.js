export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createServiceClient } from '@/lib/supabase';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const db = createServiceClient();
    const { data: user } = await db.from('users').select('*').eq('email', email).single();
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    if (user.is_banned) return NextResponse.json({ error: 'Account suspended' }, { status: 403 });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    // Update last active + streak
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newStreak = user.last_active === yesterday ? user.streak + 1 : user.last_active === today ? user.streak : 1;

    await db.from('users').update({
      last_active: today, streak: newStreak, updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    const token = signToken({ id: user.id, role: user.role });
    return NextResponse.json({
      token,
      user: {
        id: user.id, username: user.username, email: user.email,
        coins: user.coins, role: user.role, streak: newStreak,
        level_idx: user.level_idx, referral_code: user.referral_code,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
