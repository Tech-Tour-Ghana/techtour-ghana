// Security: password (re-checks the current one), authenticator app two-factor,
// and sign out of other devices. Supabase does not list other sessions to the
// browser, so only this browser is shown.

'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import AccountShell, { Section, StatusMessage, inputClass, useAccountTheme, type Status } from '@/components/account/AccountShell';
import PasswordInput from '@/components/account/PasswordInput';
import {
  changePasswordWithCurrent,
  disableTotp,
  enrollTotp,
  getTotpFactorId,
  signOutOtherSessions,
  verifyTotp,
} from '@/lib/api';

export default function SecurityPage() {
  const t = useAccountTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<Status>(null);
  const [twoFactorStatus, setTwoFactorStatus] = useState<Status>(null);
  const [sessionStatus, setSessionStatus] = useState<Status>(null);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrolment, setEnrolment] = useState<{ id: string; qrCode: string; secret: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [browser, setBrowser] = useState('This browser');

  useEffect(() => {
    getTotpFactorId().then(setFactorId).finally(() => setLoading(false));
    const ua = navigator.userAgent;
    const name = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
    const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
    setBrowser(os ? `${name} on ${os}` : name);
  }, []);

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setPasswordStatus({ type: 'error', text: 'The new passwords do not match.' });
      return;
    }
    if (passwords.next.length < 8) {
      setPasswordStatus({ type: 'error', text: 'The new password must be at least 8 characters.' });
      return;
    }
    setSaving(true);
    setPasswordStatus(null);
    const result = await changePasswordWithCurrent(passwords.current, passwords.next);
    if (result.success) {
      setPasswordStatus({ type: 'success', text: 'Password updated.' });
      setPasswords({ current: '', next: '', confirm: '' });
    } else {
      setPasswordStatus({ type: 'error', text: result.message || 'Could not update your password.' });
    }
    setSaving(false);
  };

  const toggleTwoFactor = async () => {
    setTwoFactorStatus(null);
    if (factorId) {
      const result = await disableTotp(factorId);
      if (result.success) {
        setFactorId(null);
        setTwoFactorStatus({ type: 'success', text: 'Two-factor authentication turned off.' });
      } else {
        setTwoFactorStatus({ type: 'error', text: result.message || 'Could not turn off two-factor authentication.' });
      }
      return;
    }
    const started = await enrollTotp();
    if ('error' in started) setTwoFactorStatus({ type: 'error', text: started.error });
    else setEnrolment(started);
  };

  const confirmTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrolment) return;
    const result = await verifyTotp(enrolment.id, totpCode.trim());
    if (result.success) {
      setFactorId(enrolment.id);
      setEnrolment(null);
      setTotpCode('');
      setTwoFactorStatus({ type: 'success', text: 'Two-factor authentication turned on.' });
    } else {
      setTwoFactorStatus({ type: 'error', text: result.message || 'That code did not match, try again.' });
    }
  };

  const handleSignOutOthers = async () => {
    const ok = await signOutOtherSessions();
    setSessionStatus(ok
      ? { type: 'success', text: 'Signed out of all other devices.' }
      : { type: 'error', text: 'Could not sign out other devices.' });
  };

  return (
    <AccountShell title="Security" subtitle="Password, two-factor authentication and devices">
      {loading ? (
        <p role="status" className="text-sm" style={{ color: t.textSecondary }}>Loading security settings...</p>
      ) : (
        <>
          <Section id="password" title="Password" description="Enter your current password, then choose a new one of at least 8 characters.">
            <form onSubmit={handlePassword} className="space-y-4 max-w-md">
              <StatusMessage status={passwordStatus} />
              <PasswordInput id="sec-current" label="Current password" autoComplete="current-password" value={passwords.current} onChange={(v) => setPasswords({ ...passwords, current: v })} />
              <PasswordInput id="sec-new" label="New password" autoComplete="new-password" value={passwords.next} onChange={(v) => setPasswords({ ...passwords, next: v })} />
              <PasswordInput id="sec-confirm" label="Confirm new password" autoComplete="new-password" value={passwords.confirm} onChange={(v) => setPasswords({ ...passwords, confirm: v })} />
              <Button type="submit" variant="accent" arrow={false} loading={saving}>{saving ? 'Updating...' : 'Update password'}</Button>
            </form>
          </Section>

          <Section id="two-factor" title="Two-factor authentication" description="Require a code from an authenticator app each time you sign in.">
            <div className="space-y-4">
              <StatusMessage status={twoFactorStatus} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium" style={{ color: t.text }}>
                  Status: {factorId ? 'On' : 'Off'}
                </p>
                {!enrolment && (
                  <Button variant={factorId ? 'danger' : 'accent'} size="sm" arrow={false} onClick={toggleTwoFactor}>
                    {factorId ? 'Turn off' : 'Set up'}
                  </Button>
                )}
              </div>
              {enrolment && (
                <form onSubmit={confirmTwoFactor} className="space-y-3 pt-4 border-t" style={{ borderColor: t.border }}>
                  <p className="text-sm" style={{ color: t.textSecondary }}>
                    Scan this QR code with an authenticator app, then enter the 6 digit code it shows.
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={enrolment.qrCode} alt="QR code for your authenticator app" className="w-40 h-40 bg-white p-2 rounded-lg" />
                  <p className="text-xs break-all" style={{ color: t.textMuted }}>Or enter this key manually: {enrolment.secret}</p>
                  <div>
                    <label htmlFor="sec-totp" className="block text-sm font-medium mb-1.5" style={{ color: t.textSecondary }}>6 digit code</label>
                    <div className="flex flex-wrap gap-2">
                      <input
                        id="sec-totp"
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value)}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        required
                        className={`${inputClass} w-40`}
                        style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
                      />
                      <Button type="submit" variant="accent" size="sm" arrow={false}>Verify</Button>
                      <Button variant="secondary" size="sm" arrow={false} onClick={() => { setEnrolment(null); setTotpCode(''); }} style={{ color: t.text }}>Cancel</Button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </Section>

          <Section id="devices" title="Devices" description="Where you are signed in.">
            <div className="space-y-4">
              <StatusMessage status={sessionStatus} />
              <p className="text-sm" style={{ color: t.text }}>
                <span className="font-medium">{browser}</span>
                <span style={{ color: t.textMuted }}> (this device, active now)</span>
              </p>
              <p className="text-xs" style={{ color: t.textMuted }}>Other devices cannot be listed, but you can sign them all out.</p>
              <Button variant="danger" size="sm" arrow={false} onClick={handleSignOutOthers}>Sign out of all other devices</Button>
            </div>
          </Section>
        </>
      )}
    </AccountShell>
  );
}
