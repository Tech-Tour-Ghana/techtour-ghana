'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const BRAND = '#139EA2';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

    router.push('/admin');
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl p-8 space-y-6"
        style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Logo mark */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: BRAND }}
          >
            <FontAwesomeIcon icon={faShieldHalved} className="text-white text-lg" />
          </div>
          <h1 className="text-white text-lg font-semibold tracking-tight">Admin Portal</h1>
          <p className="text-xs" style={{ color: '#6B7280' }}>TechTour Ghana, restricted access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none focus:ring-1"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                // @ts-expect-error - CSS custom property for focus ring
                '--tw-ring-color': BRAND,
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9CA3AF' }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm text-white outline-none focus:ring-1"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
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

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: '#EF444422', color: '#EF4444' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-60"
            style={{ background: BRAND }}
          >
            {busy && <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />}
            Sign in to Admin
          </button>
        </form>
      </div>
    </div>
  );
}
