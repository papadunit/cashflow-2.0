export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { authenticate, getLevel } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const debugUpdate = searchParams.get('debug_update');

  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createServiceClient();

  // Debug: test if /api/me can write
  let writeTest = null;
  if (debugUpdate === '1') {
    const { data: before } = await db.from('users').select('id, coins').eq('id', user.id).single();
    const { data: upd, error: updErr } = await db.from('users').update({ coins: 77777 }).eq('id', user.id).select('id, coins').single();
    const { data: after } = await db.from('users').select('id, coins').eq('id', user.id).single();
    writeTest = { before: before?.coins, update_returned: upd?.coins, update_err: updErr?.message, after: after?.coins };
    // Reset to original
    await db.from('users').update({ coins: before?.coins ?? user.coins }).eq('id', user.id);
  }

  const { data: directUser } = await db.from('users').select('*').eq('id', user.id).single();

  const level = getLevel(directUser?.coins ?? user.coins);
  const coins = directUser?.coins ?? user.coins;
  return NextResponse.json({
    id: user.id, username: user.username, email: user.email,
    coins: coins, lifetime_earned: user.lifetime_earned,
    role: user.role, streak: user.streak, level: level,
    referral_code: user.referral_code, created_at: user.created_at,
    _debug_auth_coins: user.coins,
    _debug_direct_coins: directUser?.coins,
    _debug_write_test: writeTest,
    _debug_service_key_role: (() => { try { const p = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').split('.')[1]; return JSON.parse(Buffer.from(p, 'base64').toString()).role; } catch(e) { return 'error: ' + e.message; } })(),
    _debug_anon_key_role: (() => { try { const p = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').split('.')[1]; return JSON.parse(Buffer.from(p, 'base64').toString()).role; } catch(e) { return 'error: ' + e.message; } })(),
  });
}
