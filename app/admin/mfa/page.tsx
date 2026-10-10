'use client';

// Second step for admins who turned on an authenticator app. The admin area and
// the database both stay locked until the code is accepted (migration 0037).

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';

import { createBrowserClient } from '@/lib/supabase/client';

export default function AdminMfaPage() {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.replace('/admin/login'); return; }
      const [{ data: aal }, { data: factors }] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);
      const id = factors?.totp[0]?.id ?? null;
      // Nothing to verify, or already verified: go on to the admin.
      if (!id || aal?.currentLevel === 'aal2') { window.location.replace('/admin'); return; }
      setFactorId(id);
      setReady(true);
    })();
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || busy) return;
    setBusy(true);
    setError('');
    const { error: err } = await createBrowserClient().auth.mfa.challengeAndVerify({ factorId, code: code.replace(/\s/g, '') });
    if (err) {
      setError('That code did not match. Check your authenticator app and try again.');
      setBusy(false);
      return;
    }
    window.location.replace('/admin');
  }

  async function signOut() {
    await createBrowserClient().auth.signOut();
    window.location.replace('/admin/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: '#0A0A0A' }}>
      <form onSubmit={verify} className="w-full max-w-sm space-y-5 rounded-2xl p-8" style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: '#139EA2' }}>
            <FontAwesomeIcon icon={faShieldHalved} className="text-lg text-white" />
          </div>
          <h1 className="text-lg font-semibold text-white">Two-step verification</h1>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Enter the 6 digit code from your authenticator app to open the admin.</p>
        </div>

        {!ready ? (
          <p className="text-center text-xs" style={{ color: '#9CA3AF' }}>Checking your session...</p>
        ) : (
          <>
            <div>
              <label htmlFor="mfa-code" className="mb-1.5 block text-xs font-medium" style={{ color: '#D1D5DB' }}>Authentication code</label>
              <input
                id="mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={7}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full rounded-lg px-4 py-3 text-center text-lg tracking-[0.4em] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#139EA2]"
                style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.12)' }}
              />
            </div>
            {error && <p role="alert" className="rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(239,68,68,0.12)', color: '#FCA5A5' }}>{error}</p>}
            <button
              type="submit"
              disabled={busy || code.replace(/\s/g, '').length < 6}
              className="w-full rounded-lg py-3 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: '#139EA2' }}
            >
              {busy ? 'Checking...' : 'Verify and continue'}
            </button>
          </>
        )}

        <button type="button" onClick={signOut} className="block w-full text-center text-xs underline" style={{ color: '#9CA3AF' }}>Sign out</button>
      </form>
    </div>
  );
}
