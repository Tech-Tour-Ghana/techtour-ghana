// Ported from docs/old-sites/techtour-frontend/app/auth/profile/page.tsx.
// Markup and styling are unchanged. getProfile/updateProfile (lib/api.ts) read
// and write public.profiles directly. display_name and location had no
// backing column anywhere in the old or new schema (display_name is derived
// from first/last name, location was never a real field), so the display
// name input and location field are dropped rather than invented.

'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faSave,
  faTimes,
  faSpinner,
  faCheckCircle,
  faExclamationCircle,
  faCalendarAlt,
  faGlobeAfrica,
  faEnvelope,
  faPhone,
  faStar,
  faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';
import { getProfile, updateProfile, type Profile } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import DashboardLayout from '@/components/DashboardLayout';

const BRAND_COLORS = {
  tropicalTeal: '#139EA2',
  sandyOrange: '#E6A64D',
};

export default function ProfilePage() {
  const { isDimMode } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({ first_name: '', last_name: '', phone_number: '', bio: '' });

  useEffect(() => {
    getProfile()
      .then((data) => {
        if (data) {
          setProfile(data);
          setFormData({
            first_name: data.first_name,
            last_name: data.last_name,
            phone_number: data.phone_number,
            bio: data.bio,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const result = await updateProfile(formData);
    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setProfile((prev) => (prev ? { ...prev, ...formData } : prev));
      setIsEditing(false);
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to update profile' });
    }
    setSaving(false);
  };

  const getFullName = () => {
    if (!profile) return 'User';
    if (profile.first_name && profile.last_name) return `${profile.first_name} ${profile.last_name}`;
    return profile.first_name || profile.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => getFullName().charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDimMode ? '#0A0A0A' : '#F9F9F9' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: BRAND_COLORS.tropicalTeal, borderTopColor: 'transparent' }}></div>
          <p className="mt-4 text-sm" style={{ color: isDimMode ? '#B0B0B0' : '#4A4A4A' }}>Loading profile...</p>
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

  return (
    <DashboardLayout title="My Profile" subtitle="Manage your personal information">
      <div className="max-w-4xl mx-auto">
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
          <div className="h-28 relative" style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.tropicalTeal}, ${BRAND_COLORS.sandyOrange})` }}>
            <div className="absolute -bottom-12 left-6 flex items-end gap-4">
              <div
                className="w-24 h-24 rounded-full border-4 flex items-center justify-center text-3xl font-bold"
                style={{ background: themeStyles.cardBg, borderColor: themeStyles.cardBg, color: BRAND_COLORS.tropicalTeal }}
              >
                {getUserInitials()}
              </div>
            </div>
            <div className="absolute bottom-4 right-6 flex gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(8px)' }}
                >
                  <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(8px)' }}
                  >
                    <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2 disabled:opacity-50"
                    style={{ background: 'white', color: BRAND_COLORS.tropicalTeal }}
                  >
                    {saving ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} className="w-4 h-4" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-16 p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: themeStyles.textSecondary }}>First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition"
                      style={{ background: themeStyles.inputBg, borderColor: themeStyles.inputBorder, color: themeStyles.inputText }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: themeStyles.textSecondary }}>Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition"
                      style={{ background: themeStyles.inputBg, borderColor: themeStyles.inputBorder, color: themeStyles.inputText }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: themeStyles.textSecondary }}>Phone Number</label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition"
                    style={{ background: themeStyles.inputBg, borderColor: themeStyles.inputBorder, color: themeStyles.inputText }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: themeStyles.textSecondary }}>Bio</label>
                  <textarea
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:outline-none transition"
                    style={{ background: themeStyles.inputBg, borderColor: themeStyles.inputBorder, color: themeStyles.inputText }}
                  />
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: themeStyles.textMuted }}>Full Name</p>
                    <p className="text-lg font-semibold mt-1" style={{ color: themeStyles.textPrimary }}>{getFullName()}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: themeStyles.textMuted }}>Email</p>
                    <p className="text-lg font-semibold mt-1" style={{ color: themeStyles.textPrimary }}>
                      <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 mr-2" style={{ color: themeStyles.textMuted }} />
                      {profile?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: themeStyles.textMuted }}>Phone</p>
                    <p className="text-lg font-semibold mt-1" style={{ color: themeStyles.textPrimary }}>
                      <FontAwesomeIcon icon={faPhone} className="w-4 h-4 mr-2" style={{ color: themeStyles.textMuted }} />
                      {formData.phone_number || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: themeStyles.textMuted }}>Member Since</p>
                    <p className="text-lg font-semibold mt-1" style={{ color: themeStyles.textPrimary }}>
                      <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2" style={{ color: themeStyles.textMuted }} />
                      {new Date(profile?.created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {formData.bio && (
                  <div className="pt-4 border-t" style={{ borderColor: themeStyles.border }}>
                    <p className="text-xs uppercase tracking-wider" style={{ color: themeStyles.textMuted }}>Bio</p>
                    <p className="mt-2" style={{ color: themeStyles.textPrimary }}>{formData.bio}</p>
                  </div>
                )}

                <div className="pt-4 border-t flex items-center gap-3 flex-wrap" style={{ borderColor: themeStyles.border }}>
                  <span className="px-4 py-1.5 text-xs font-medium rounded-full flex items-center gap-1.5" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                    <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
                    Active Member
                  </span>
                  <span className="px-4 py-1.5 text-xs font-medium rounded-full flex items-center gap-1.5" style={{ background: 'rgba(251,191,36,0.1)', color: '#F59E0B' }}>
                    <FontAwesomeIcon icon={faStar} className="w-3 h-3" />
                    Verified
                  </span>
                  <span className="px-4 py-1.5 text-xs font-medium rounded-full flex items-center gap-1.5" style={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
                    <FontAwesomeIcon icon={faShieldAlt} className="w-3 h-3" />
                    Trusted
                  </span>
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
