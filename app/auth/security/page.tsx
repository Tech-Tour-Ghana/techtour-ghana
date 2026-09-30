// Ported from docs/old-sites/techtour-frontend/app/auth/security/page.tsx.
// Markup and styling are unchanged where the feature exists. Change password
// re-checks the current password then updates it through Supabase Auth. Two
// factor authentication is a real authenticator app (TOTP) enrolment, the old
// toggle only flipped local state. Supabase does not expose a list of other
// sessions to the browser, so the two invented session rows are replaced by
// this browser plus a button that signs out every other device.


'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import DashboardLayout from '@/components/DashboardLayout';
import {
  changePasswordWithCurrent,
  disableTotp,
  enrollTotp,
  getTotpFactorId,
  signOutOtherSessions,
  verifyTotp,
} from '@/lib/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldAlt,
  faGlobeAfrica,
  faLock,
  faKey,
  faQrcode,
  faCheckCircle,
  faExclamationCircle,
  faSpinner,
  faEye,
  faEyeSlash,
  faMobileAlt,
  faEnvelope,
  faClock,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';

const BRAND_COLORS = {
  tropicalTeal: '#139EA2',
  sandyOrange: '#E6A64D',
};

export default function SecurityPage() {
  const { isDimMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [twoFactorFactorId, setTwoFactorFactorId] = useState<string | null>(null);
  const twoFactorEnabled = twoFactorFactorId !== null;
  const [enrolment, setEnrolment] = useState<{ id: string; qrCode: string; secret: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [browser, setBrowser] = useState('This browser');

  useEffect(() => {
    getTotpFactorId()
      .then(setTwoFactorFactorId)
      .finally(() => setLoading(false));
    const ua = navigator.userAgent;
    const name = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
    const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
    setBrowser(os ? `${name} on ${os}` : name);
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwordData.new_password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const result = await changePasswordWithCurrent(passwordData.current_password, passwordData.new_password);
    if (result.success) {
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to change password' });
    }
    setSaving(false);
  };

  const toggleTwoFactor = async () => {
    setMessage(null);
    if (twoFactorFactorId) {
      const result = await disableTotp(twoFactorFactorId);
      if (result.success) {
        setTwoFactorFactorId(null);
        setMessage({ type: 'success', text: 'Two-factor authentication disabled.' });
      } else {
        setMessage({ type: 'error', text: result.message || 'Could not disable two-factor authentication' });
      }
      return;
    }
    const started = await enrollTotp();
    if ('error' in started) {
      setMessage({ type: 'error', text: started.error });
      return;
    }
    setEnrolment(started);
  };

  const confirmTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrolment) return;
    const result = await verifyTotp(enrolment.id, totpCode.trim());
    if (result.success) {
      setTwoFactorFactorId(enrolment.id);
      setEnrolment(null);
      setTotpCode('');
      setMessage({ type: 'success', text: 'Two-factor authentication enabled.' });
    } else {
      setMessage({ type: 'error', text: result.message || 'That code did not match, try again.' });
    }
  };

  const handleSignOutOthers = async () => {
    const ok = await signOutOtherSessions();
    setMessage(ok
      ? { type: 'success', text: 'Signed out of all other devices.' }
      : { type: 'error', text: 'Could not sign out other devices.' });
  };

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#000000',
    textSecondary: isDimMode ? '#B0B0B0' : '#4A4A4A',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    inputBg: isDimMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    inputBorder: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
    inputText: isDimMode ? '#FFFFFF' : '#000000',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDimMode ? '#0A0A0A' : '#F9F9F9' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: BRAND_COLORS.tropicalTeal, borderTopColor: 'transparent' }}></div>
          <p className="mt-4 text-sm" style={{ color: themeStyles.textSecondary }}>Loading security settings...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Security" subtitle="Manage your account security">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
          }`}>
            <FontAwesomeIcon icon={message.type === 'success' ? faCheckCircle : faExclamationCircle} />
            <span>{message.text}</span>
          </div>
        )}

        {/* Change Password */}
        <div className="rounded-2xl p-6" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: themeStyles.textPrimary }}>
            <FontAwesomeIcon icon={faLock} className="w-5 h-5 mr-2" style={{ color: BRAND_COLORS.tropicalTeal }} />
            Change Password
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeStyles.textSecondary }}>
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPassword.current ? 'text' : 'password'}
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  className="w-full px-4 py-2 pr-10 rounded-xl border focus:ring-2 focus:outline-none transition"
                  style={{
                    background: themeStyles.inputBg,
                    borderColor: themeStyles.inputBorder,
                    color: themeStyles.inputText,
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: themeStyles.textMuted }}
                >
                  <FontAwesomeIcon icon={showPassword.current ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeStyles.textSecondary }}>
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword.new ? 'text' : 'password'}
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  className="w-full px-4 py-2 pr-10 rounded-xl border focus:ring-2 focus:outline-none transition"
                  style={{
                    background: themeStyles.inputBg,
                    borderColor: themeStyles.inputBorder,
                    color: themeStyles.inputText,
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: themeStyles.textMuted }}
                >
                  <FontAwesomeIcon icon={showPassword.new ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: themeStyles.textSecondary }}>
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  className="w-full px-4 py-2 pr-10 rounded-xl border focus:ring-2 focus:outline-none transition"
                  style={{
                    background: themeStyles.inputBg,
                    borderColor: themeStyles.inputBorder,
                    color: themeStyles.inputText,
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: themeStyles.textMuted }}
                >
                  <FontAwesomeIcon icon={showPassword.confirm ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50"
              style={{ background: BRAND_COLORS.tropicalTeal, color: 'white' }}
            >
              {saving ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>

        {/* Two-Factor Authentication */}
        <div className="rounded-2xl p-6" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: themeStyles.textPrimary }}>
            <FontAwesomeIcon icon={faShieldAlt} className="w-5 h-5 mr-2" style={{ color: BRAND_COLORS.tropicalTeal }} />
            Two-Factor Authentication
          </h3>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{
            background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
            border: `1px solid ${themeStyles.border}`,
          }}>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium" style={{ color: themeStyles.textPrimary }}>
                  {twoFactorEnabled ? '✅ 2FA Enabled' : '❌ 2FA Disabled'}
                </p>
                {twoFactorEnabled && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                    Secure
                  </span>
                )}
              </div>
              <p className="text-sm" style={{ color: themeStyles.textSecondary }}>
                {twoFactorEnabled
                  ? 'Your account is protected with two-factor authentication'
                  : 'Add an extra layer of security to your account'
                }
              </p>
            </div>
            <button
              onClick={toggleTwoFactor}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 ${
                twoFactorEnabled ? '' : ''
              }`}
              style={{
                background: twoFactorEnabled ? '#EF4444' : BRAND_COLORS.tropicalTeal,
                color: 'white',
              }}
            >
              <FontAwesomeIcon icon={twoFactorEnabled ? faTimes : faQrcode} className="w-4 h-4 mr-2" />
              {twoFactorEnabled ? 'Disable' : 'Set Up'}
            </button>
          </div>
          {enrolment && (
            <form onSubmit={confirmTwoFactor} className="mt-4 p-4 rounded-xl space-y-3" style={{ border: `1px solid ${themeStyles.border}` }}>
              <p className="text-sm" style={{ color: themeStyles.textSecondary }}>
                Scan this QR code with an authenticator app, then enter the 6 digit code it shows.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={enrolment.qrCode} alt="Authenticator QR code" className="w-40 h-40 bg-white p-2 rounded-lg" />
              <p className="text-xs break-all" style={{ color: themeStyles.textMuted }}>Or enter this key manually: {enrolment.secret}</p>
              <div className="flex gap-2">
                <input
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  className="px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: themeStyles.inputBg, border: `1px solid ${themeStyles.inputBorder}`, color: themeStyles.inputText }}
                />
                <button type="submit" className="px-4 py-2 text-sm font-medium rounded-xl" style={{ background: BRAND_COLORS.tropicalTeal, color: 'white' }}>
                  Verify
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Session Management */}
        <div className="rounded-2xl p-6" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: themeStyles.textPrimary }}>
            <FontAwesomeIcon icon={faClock} className="w-5 h-5 mr-2" style={{ color: BRAND_COLORS.tropicalTeal }} />
            Active Sessions
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{
              background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9',
              border: `1px solid ${themeStyles.border}`,
            }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                  <FontAwesomeIcon icon={faMobileAlt} style={{ color: '#3B82F6' }} />
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: themeStyles.textPrimary }}>Current Session</p>
                  <p className="text-xs" style={{ color: themeStyles.textMuted }}>{browser} • Active now</p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                Active
              </span>
            </div>
            <button
              onClick={handleSignOutOthers}
              className="text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105"
              style={{ color: '#EF4444', border: '1px solid #EF444440' }}
            >
              Sign out of all other devices
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs" style={{ color: themeStyles.textMuted }}>
          <FontAwesomeIcon icon={faGlobeAfrica} className="mr-1" />
          TechTour Ghana — Redefining African Tourism Through Innovation
        </p>
      </div>
    </DashboardLayout>
  );
}