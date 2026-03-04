export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createServiceClient } from '@/lib/supabase';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, name, avatar, provider, provider_id } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Missing email from OAuth' }, { status: 400 });
    }

    const db = createServiceClient();

    // Check if user already exists with this email
    const { data: existing } = await db.from('users').select('*').eq('email', email).single();

    if (existing) {
      // Existing user — update last active + streak and log them in
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newStreak = existing.last_active === yesterday ? existing.streak + 1 : existing.last_active === today ? existing.streak : 1;

      await db.from('users').update({
        last_active: today,
        streak: newStreak,
        updated_at: new Date().toISOString(),
        // Always update avatar from OAuth (keeps profile pic fresh)
        ...(avatar ? { avatar_url: avatar } : {}),
      }).eq('id', existing.id);

      const token = signToken({ id: existing.id, role: existing.role });
      return NextResponse.json({
        token,
        user: {
          id: existing.id, username: existing.username, email: existing.email,
          coins: existing.coins, role: existing.role, streak: newStreak,
          level_idx: existing.level_idx, referral_code: existing.referral_code,
          lifetime_earned: existing.lifetime_earned, created_at: existing.created_at,
          avatar_url: avatar || existing.avatar_url || null,
        },
      });
    }

    // New user — create account with OAuth
    const username = (name || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'user';
    const refCode = username.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
    const userId = uuidv4();
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Check if generated username is taken, append random if so
    const { data: nameTaken } = await db.from('users').select('id').eq('username', username).limit(1);
    const finalUsername = nameTaken?.length > 0 ? username + Math.floor(Math.random() * 9999) : username;

    const { error: insertError } = await db.from('users').insert({
      id: userId,
      username: finalUsername,
      email,
      password_hash: 'oauth_' + provider, // No password for OAuth users
      referral_code: refCode,
      ip_address: ip,
      coins: 250,
      lifetime_earned: 250,
      avatar_url: avatar || null,
      oauth_provider: provider,
      oauth_provider_id: provider_id,
    });

    if (insertError) {
      // If insert fails (e.g. email race condition), try to fetch existing
      const { data: raceUser } = await db.from('users').select('*').eq('email', email).single();
      if (raceUser) {
        const token = signToken({ id: raceUser.id, role: raceUser.role });
        return NextResponse.json({
          token,
          user: {
            id: raceUser.id, username: raceUser.username, email: raceUser.email,
            coins: raceUser.coins, role: raceUser.role,
            referral_code: raceUser.referral_code,
            lifetime_earned: raceUser.lifetime_earned, created_at: raceUser.created_at,
          },
        });
      }
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    // Log signup bonus
    await db.from('transactions').insert({
      user_id: userId, type: 'signup_bonus', coins: 250,
      description: `Welcome bonus — signed up with ${provider}!`,
    });

    const token = signToken({ id: userId, role: 'member' });
    return NextResponse.json({
      token,
      user: {
        id: userId, username: finalUsername, email,
        coins: 250, role: 'member', lifetime_earned: 250,
        created_at: new Date().toISOString(), referral_code: refCode,
      },
    });
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
