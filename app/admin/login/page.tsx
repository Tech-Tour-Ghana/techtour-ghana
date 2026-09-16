'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const BRAND = '#139EA2';

const ERROR_MESSAGES: Record<string, string> = {
  not_admin: 'This Google account does not have admin access.',
  auth_failed: 'Authentication failed. Please try again.',
  no_code: 'Sign-in was cancelled.',
};

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) setError(ERROR_MESSAGES[err] ?? 'Something went wrong.');
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createBrowserClient();
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });

    if (authErr) {
      setError('Invalid credentials.');
      setBusy(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Login failed.'); setBusy(false); return; }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      await supabase.auth.signOut();
      setError('This account does not have admin access.');
      setBusy(false);
      return;
    }

    window.location.href = '/admin';
  }

  async function handleGoogle() {
    setGoogleBusy(true);
    setError(null);
    const supabase = createBrowserClient();
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/admin/callback` },
    });
    if (oauthErr) {
      setError('Google sign-in failed. Try email and password instead.');
      setGoogleBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl p-8 space-y-6"
        style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: BRAND }}>
            <FontAwesomeIcon icon={faShieldHalved} className="text-white text-lg" />
          </div>
          <h1 className="text-white text-lg font-semibold tracking-tight">Admin Portal</h1>
          <p className="text-xs" style={{ color: '#6B7280' }}>TechTour Ghana, restricted access</p>
        </div>

        {error && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: '#EF444422', color: '#EF4444' }}>
            {error}
          </p>
        )}

        {/* Google sign-in */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleBusy || busy}
          className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-3 transition hover:opacity-90 disabled:opacity-60"
          style={{ background: '#FFFFFF', color: '#111827' }}
        >
          {googleBusy ? (
            <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin text-gray-600" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <span className="text-xs" style={{ color: '#4B5563' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>Email</label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#6B7280' }}
                tabIndex={-1}
              >
                <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy || googleBusy}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-60"
            style={{ background: BRAND }}
          >
            {busy && <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />}
            Sign in with Email
          </button>
        </form>
      </div>
    </div>
  );
}
