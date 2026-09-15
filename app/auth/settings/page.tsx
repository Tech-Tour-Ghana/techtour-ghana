// Ported from docs/old-sites/techtour-frontend/app/auth/settings/page.tsx.
// Markup and styling are unchanged for the parts that were real. Two-Factor
// Authentication, Active Sessions, and the Language "Change" button were
// hardcoded mock UI on the old site (local state only, no fetch, no save
// handler) with no backing table or column anywhere, so they are dropped
// rather than ported as if they worked. Change Password now calls
// supabase.auth.updateUser; the notification toggles now persist to their
// real profiles columns (email_notifications/sms_notifications/marketing_emails) -
// order_updates had no backing column on the old or new schema and is dropped.

'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLock,
  faMoon,
  faSun,
  faBell,
  faGlobeAfrica,
  faSpinner,
  faCheckCircle,
  faExclamationCircle,
  faPalette,
  faEye,
  faEyeSlash,
} from '@fortawesome/free-solid-svg-icons';
import { getProfile, changePassword, updateNotificationPreferences, type Profile } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import DashboardLayout from '@/components/DashboardLayout';

const BRAND_COLORS = {
  tropicalTeal: '#139EA2',
  sandyOrange: '#E6A64D',
};

export default function SettingsPage() {
  const { isDimMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'security' | 'preferences' | 'notifications'>('security');

  const [passwordData, setPasswordData] = useState({ new_password: '', confirm_password: '' });
  const [showPassword, setShowPassword] = useState({ new: false, confirm: false });

  const [notifications, setNotifications] = useState({ email_notifications: true, sms_notifications: false, marketing_emails: true });

  useEffect(() => {
    getProfile()
      .then((profile: Profile | null) => {
        if (profile) {
          setNotifications({
            email_notifications: profile.email_notifications,
            sms_notifications: profile.sms_notifications,
            marketing_emails: profile.marketing_emails,
          });
        }
      })
      .finally(() => setLoading(false));
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

    const result = await changePassword(passwordData.new_password);
    if (result.success) {
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ new_password: '', confirm_password: '' });
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to change password' });
    }
    setSaving(false);
  };

  const toggleNotification = async (key: keyof typeof notifications) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    const result = await updateNotificationPreferences({ [key]: next[key] });
    if (!result.success) {
      setNotifications(notifications);
      setMessage({ type: 'error', text: result.message || 'Failed to update preference' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDimMode ? '#0A0A0A' : '#F9F9F9' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: BRAND_COLORS.tropicalTeal, borderTopColor: 'transparent' }}></div>
          <p className="mt-4 text-sm" style={{ color: isDimMode ? '#B0B0B0' : '#4A4A4A' }}>Loading settings...</p>
        </div>
      </div>
    );
  }

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

  const notificationLabels: Record<keyof typeof notifications, { title: string; description: string }> = {
    email_notifications: { title: 'Email Notifications', description: 'Receive updates via email' },
    sms_notifications: { title: 'SMS Notifications', description: 'Receive updates via SMS' },
    marketing_emails: { title: 'Marketing Updates', description: 'Receive marketing and promotional emails' },
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account settings">
      <div className="max-w-3xl mx-auto">
        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
          }`}>
            <FontAwesomeIcon icon={message.type === 'success' ? faCheckCircle : faExclamationCircle} />
            <span>{message.text}</span>
          </div>
        )}

        <div className="rounded-2xl shadow-lg overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          <div className="flex border-b" style={{ borderColor: themeStyles.border }}>
            <button
              onClick={() => setActiveTab('security')}
              className="px-6 py-3 text-sm font-medium transition-all duration-200"
              style={{
                borderBottom: activeTab === 'security' ? `2px solid ${BRAND_COLORS.tropicalTeal}` : '2px solid transparent',
                color: activeTab === 'security' ? BRAND_COLORS.tropicalTeal : themeStyles.textSecondary,
              }}
            >
              <FontAwesomeIcon icon={faLock} className="w-4 h-4 mr-2" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className="px-6 py-3 text-sm font-medium transition-all duration-200"
              style={{
                borderBottom: activeTab === 'preferences' ? `2px solid ${BRAND_COLORS.tropicalTeal}` : '2px solid transparent',
                color: activeTab === 'preferences' ? BRAND_COLORS.tropicalTeal : themeStyles.textSecondary,
              }}
            >
              <FontAwesomeIcon icon={faPalette} className="w-4 h-4 mr-2" />
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className="px-6 py-3 text-sm font-medium transition-all duration-200"
              style={{
                borderBottom: activeTab === 'notifications' ? `2px solid ${BRAND_COLORS.tropicalTeal}` : '2px solid transparent',
                color: activeTab === 'notifications' ? BRAND_COLORS.tropicalTeal : themeStyles.textSecondary,
              }}
            >
              <FontAwesomeIcon icon={faBell} className="w-4 h-4 mr-2" />
              Notifications
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'security' && (
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: themeStyles.textPrimary }}>
                  <FontAwesomeIcon icon={faLock} className="w-5 h-5 mr-2" style={{ color: BRAND_COLORS.tropicalTeal }} />
                  Change Password
                </h3>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: themeStyles.textSecondary }}>New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword.new ? 'text' : 'password'}
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                        className="w-full px-4 py-2 pr-10 rounded-xl border focus:ring-2 focus:outline-none transition"
                        style={{ background: themeStyles.inputBg, borderColor: themeStyles.inputBorder, color: themeStyles.inputText }}
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
                    <label className="block text-sm font-medium mb-1" style={{ color: themeStyles.textSecondary }}>Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? 'text' : 'password'}
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                        className="w-full px-4 py-2 pr-10 rounded-xl border focus:ring-2 focus:outline-none transition"
                        style={{ background: themeStyles.inputBg, borderColor: themeStyles.inputBorder, color: themeStyles.inputText }}
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
            )}

            {activeTab === 'preferences' && (
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: themeStyles.textPrimary }}>
                  <FontAwesomeIcon icon={isDimMode ? faMoon : faSun} className="w-5 h-5 mr-2" style={{ color: BRAND_COLORS.tropicalTeal }} />
                  Theme
                </h3>
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9', border: `1px solid ${themeStyles.border}` }}>
                  <div>
                    <p className="font-medium" style={{ color: themeStyles.textPrimary }}>{isDimMode ? 'Dark Mode' : 'Light Mode'}</p>
                    <p className="text-sm" style={{ color: themeStyles.textSecondary }}>{isDimMode ? 'Currently using dark theme' : 'Currently using light theme'}</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2"
                    style={{ background: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB', color: themeStyles.textPrimary }}
                  >
                    <FontAwesomeIcon icon={isDimMode ? faSun : faMoon} className="w-4 h-4" />
                    Switch to {isDimMode ? 'Light' : 'Dark'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4" style={{ color: themeStyles.textPrimary }}>
                  <FontAwesomeIcon icon={faBell} className="w-5 h-5 mr-2" style={{ color: BRAND_COLORS.tropicalTeal }} />
                  Notification Preferences
                </h3>
                <div className="space-y-3">
                  {(Object.keys(notifications) as (keyof typeof notifications)[]).map((key) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9F9F9', border: `1px solid ${themeStyles.border}` }}>
                      <div>
                        <p className="font-medium" style={{ color: themeStyles.textPrimary }}>{notificationLabels[key].title}</p>
                        <p className="text-sm" style={{ color: themeStyles.textSecondary }}>{notificationLabels[key].description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifications[key]}
                          onChange={() => toggleNotification(key)}
                        />
                        <div
                          className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                          style={{
                            background: notifications[key] ? BRAND_COLORS.tropicalTeal : '#CBD5E1',
                            borderColor: notifications[key] ? BRAND_COLORS.tropicalTeal : '#CBD5E1',
                          }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs" style={{ color: themeStyles.textMuted }}>
            <FontAwesomeIcon icon={faGlobeAfrica} className="mr-1" />
            TechTour Ghana — Redefining African Tourism Through Innovation
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
