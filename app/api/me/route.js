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
    // Try direct REST API call instead of JS client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Read via REST
    const readRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${user.id}&select=id,coins`, {
      headers: { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey }
    });
    const readData = await readRes.json();

    // Update via REST
    const updateRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceKey,
        'Authorization': 'Bearer ' + serviceKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ coins: 77777 })
    });
    const updateData = await updateRes.json();
    const updateStatus = updateRes.status;

    // Read again via REST
    const readRes2 = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${user.id}&select=id,coins`, {
      headers: { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey }
    });
    const readData2 = await readRes2.json();

    // Also read with select=* via REST
    const readRes3 = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${user.id}&select=*`, {
      headers: { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey }
    });
    const readData3 = await readRes3.json();

    // Reset
    await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ coins: readData3?.[0]?.coins || 500 })
    });

    writeTest = {
      rest_before: readData?.[0]?.coins,
      rest_update_status: updateStatus,
      rest_update_returned: updateData?.[0]?.coins,
      rest_after_cols: readData2?.[0]?.coins,
      rest_after_star: readData3?.[0]?.coins,
    };
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
