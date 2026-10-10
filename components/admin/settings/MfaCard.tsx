'use client';

// Turn the admin's authenticator app (TOTP) on or off. Once it is on, opening the
// admin asks for the code (app/admin/mfa) and the database treats a session
// without the code as not an admin (migration 0037).

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';

import { Button, StatusPill, confirmAction, fieldStyle } from '@/components/admin/ui';
import { notify } from '@/components/admin/toast';
import { disableTotp, enrollTotp, getTotpFactorId, verifyTotp } from '@/lib/api';
import { Card, Field, textClass } from './parts';

export default function MfaCard() {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [setup, setSetup] = useState<{ id: string; qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getTotpFactorId().then((id) => { setFactorId(id); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  async function start() {
    setBusy(true);
    setError('');
    const res = await enrollTotp();
    setBusy(false);
    if ('error' in res) return setError(res.error);
    setSetup(res);
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!setup || busy) return;
    setBusy(true);
    setError('');
    const res = await verifyTotp(setup.id, code.replace(/\s/g, ''));
    setBusy(false);
    if (!res.success) return setError('That code did not match. Wait for a new code in your app and try again.');
    setFactorId(setup.id);
    setSetup(null);
    setCode('');
    notify('Two-step verification is on. You will be asked for a code each time you open the admin.', 'success');
  }

  async function turnOff() {
    if (!factorId) return;
    if (!(await confirmAction({ message: 'Turn off two-step verification? Your admin account will only need your password.', danger: true, confirmLabel: 'Turn off' }))) return;
    setBusy(true);
    const res = await disableTotp(factorId);
    setBusy(false);
    if (!res.success) return notify(res.message || 'Could not turn it off. Sign out and back in with your code, then try again.');
    setFactorId(null);
    notify('Two-step verification is off.', 'success');
  }

  return (
    <Card title="Two-step verification" description="Ask for a code from an authenticator app (Google Authenticator, Authy, 1Password) every time you open the admin.">
      {!loaded ? (
        <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>Loading...</p>
      ) : setup ? (
        <form onSubmit={confirm} className="space-y-4">
          <p className="text-xs" style={{ color: 'var(--adm-text-2)' }}>1. Scan this code with your authenticator app, or type the key in by hand.</p>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qrCode} alt="QR code for your authenticator app" className="h-36 w-36 rounded-lg bg-white p-2" />
            <code className="break-all rounded-md px-2 py-1 text-xs" style={{ background: 'var(--adm-track)', color: 'var(--adm-text)' }}>{setup.secret}</code>
          </div>
          <Field id="mfa-setup-code" label="2. Enter the 6 digit code it shows">
            <input id="mfa-setup-code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} className={textClass} style={fieldStyle} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
          </Field>
          {error && <p role="alert" className="text-xs" style={{ color: 'var(--adm-error)' }}>{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || code.replace(/\s/g, '').length < 6}>{busy ? 'Checking...' : 'Turn on'}</Button>
            <Button variant="secondary" onClick={() => { setSetup(null); setCode(''); setError(''); }}>Cancel</Button>
          </div>
        </form>
      ) : factorId ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusPill tone="success" icon={faShieldHalved}>On</StatusPill>
          <Button variant="danger" onClick={turnOff} disabled={busy}>Turn off</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <StatusPill tone="warning" icon={faShieldHalved}>Off</StatusPill>
          {error && <p role="alert" className="text-xs" style={{ color: 'var(--adm-error)' }}>{error}</p>}
          <div><Button onClick={start} disabled={busy}>{busy ? "Starting..." : "Set up an authenticator app"}</Button></div>
        </div>
      )}
    </Card>
  );
}
