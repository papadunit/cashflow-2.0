export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createServiceClient } from '@/lib/supabase';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, email, password, referralCode } = await request.json();
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const db = createServiceClient();

    // Check existing
    const { data: existing } = await db.from('users').select('id').or(`email.eq.${email},username.eq.${username}`).limit(1);
    if (existing?.length > 0) {
      return NextResponse.json({ error: 'Email or username already taken' }, { status: 409 });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);
    const refCode = username.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Handle referral
    let referred_by = null;
    if (referralCode) {
      const { data: referrer } = await db.from('users').select('id').eq('referral_code', referralCode).single();
      if (referrer) referred_by = referrer.id;
    }

    // Create user with 250 signup bonus
    const userId = uuidv4();
    const { error: insertError } = await db.from('users').insert({
      id: userId, username, email, password_hash,
      referral_code: refCode, ip_address: ip,
      referred_by, coins: 250, lifetime_earned: 250,
    });

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    // Log signup bonus transaction
    await db.from('transactions').insert({
      user_id: userId, type: 'signup_bonus', coins: 250,
      description: 'Welcome bonus — start earning!',
    });

    // Handle referral bonus
    if (referred_by) {
      const { data: referrer } = await db.from('users').select('coins,lifetime_earned').eq('id', referred_by).single();
      if (referrer) {
        await db.from('users').update({
          coins: referrer.coins + 500,
          lifetime_earned: referrer.lifetime_earned + 500,
        }).eq('id', referred_by);
        await db.from('transactions').insert({
          user_id: referred_by, type: 'referral_bonus', coins: 500,
          description: `Referral bonus: ${username} signed up!`,
        });
        await db.from('referrals').insert({
          referrer_id: referred_by, referred_id: userId, bonus_paid: 500,
        });
      }
    }

    const token = signToken({ id: userId, role: 'member' });
    return NextResponse.json({ token, user: { id: userId, username, email, coins: 250, role: 'member', lifetime_earned: 250, created_at: new Date().toISOString(), referral_code: refCode } });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
