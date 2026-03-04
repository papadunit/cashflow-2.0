'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function AuthCallback() {
  const [status, setStatus] = useState('Signing you in...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          setStatus('Configuration error');
          return;
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Exchange the code for a session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          // Try to get session from URL hash
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');

          if (!accessToken) {
            // Try code exchange
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');

            if (code) {
              const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
              if (exchangeError) {
                setStatus('Authentication failed. Redirecting...');
                setTimeout(() => window.location.href = '/', 2000);
                return;
              }
              await processOAuthUser(data.session);
              return;
            }

            setStatus('Authentication failed. Redirecting...');
            setTimeout(() => window.location.href = '/', 2000);
            return;
          }
        }

        if (session) {
          await processOAuthUser(session);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('Something went wrong. Redirecting...');
        setTimeout(() => window.location.href = '/', 2000);
      }
    };

    const processOAuthUser = async (session) => {
      try {
        setStatus('Setting up your account...');

        // Send OAuth user info to our backend to create/find user in our custom table
        const res = await fetch('/api/auth/oauth-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
            avatar: session.user.user_metadata?.avatar_url || '',
            provider: session.user.app_metadata?.provider || 'oauth',
            provider_id: session.user.id,
          }),
        });

        const data = await res.json();

        if (data.token) {
          localStorage.setItem('cf_token', data.token);
          localStorage.setItem('cf_user', JSON.stringify(data.user));
          setStatus('Success! Redirecting...');
          window.location.href = '/';
        } else {
          setStatus(data.error || 'Failed to create account. Redirecting...');
          setTimeout(() => window.location.href = '/', 2000);
        }
      } catch {
        setStatus('Account setup failed. Redirecting...');
        setTimeout(() => window.location.href = '/', 2000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#141523',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 20,
      fontFamily: "'Poppins', sans-serif",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: '#01D676',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      </div>
      <p style={{ color: '#E0E0FF', fontSize: 16, fontWeight: 500 }}>{status}</p>
      <div style={{
        width: 32, height: 32,
        border: '3px solid #252539',
        borderTopColor: '#01D676',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}/>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.05) } }
      `}</style>
    </div>
  );
}
