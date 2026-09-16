'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCamera, faSpinner, faCheck, faSave, faUserCircle,
} from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import AdminLayout from '@/components/AdminLayout';

const BRAND = '#139EA2';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  bio: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
}

export default function AdminProfilePage() {
  const supabase = createBrowserClient();
  const { isDimMode } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone_number: '', bio: '' });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#111827',
    textSecondary: isDimMode ? '#B0B0B0' : '#4B5563',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
    inputBg: isDimMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
    inputBorder: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${themeStyles.inputBorder}`,
    background: themeStyles.inputBg,
    color: themeStyles.textPrimary,
    fontSize: 13,
    outline: 'none',
  };

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone_number, bio, avatar_url, avatar_path')
      .eq('id', user.id)
      .single();

    if (!data) return;
    const p = data as Profile;
    setProfile(p);
    setForm({
      first_name: p.first_name ?? '',
      last_name: p.last_name ?? '',
      phone_number: p.phone_number ?? '',
      bio: p.bio ?? '',
    });

    if (p.avatar_path) {
      const { data: signed } = await supabase.storage
        .from('avatars')
        .createSignedUrl(p.avatar_path, 3600);
      if (signed) setAvatarPreview(signed.signedUrl);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  async function handleAvatarUpload(file: File) {
    if (!profile) return;
    setUploading(true);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${profile.id}/${Date.now()}.${ext}`;

    // Delete old avatar from storage if exists
    if (profile.avatar_path) {
      await supabase.storage.from('avatars').remove([profile.avatar_path]);
    }

    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!error) {
      await supabase.from('profiles').update({ avatar_path: path, avatar_url: null }).eq('id', profile.id);
      const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(path, 3600);
      if (signed) setAvatarPreview(signed.signedUrl);
      setProfile(prev => prev ? { ...prev, avatar_path: path } : prev);
    }
    setUploading(false);
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone_number: form.phone_number.trim() || null,
      bio: form.bio.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AdminLayout title="My Profile" subtitle="Edit your account details and photo">
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 animate-spin" style={{ color: BRAND }} />
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">

          {/* Avatar card */}
          <div className="rounded-2xl p-6 flex items-center gap-6"
            style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: isDimMode ? '#2A2A2A' : '#F3F4F6' }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <FontAwesomeIcon icon={faUserCircle} className="w-12 h-12" style={{ color: themeStyles.textMuted }} />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg disabled:opacity-60"
                style={{ background: BRAND }}
                title="Upload photo"
              >
                {uploading
                  ? <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 text-white animate-spin" />
                  : <FontAwesomeIcon icon={faCamera} className="w-3 h-3 text-white" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
              />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: themeStyles.textPrimary }}>
                {form.first_name} {form.last_name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: themeStyles.textMuted }}>{profile?.email}</p>
              <p className="text-xs mt-2" style={{ color: themeStyles.textSecondary }}>
                JPEG, PNG, WebP or GIF. Max 5 MB.
              </p>
            </div>
          </div>

          {/* Profile fields */}
          <div className="rounded-2xl p-6 space-y-4"
            style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
            <h3 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>Profile Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: themeStyles.textSecondary }}>First name</label>
                <input
                  style={inputStyle}
                  value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: themeStyles.textSecondary }}>Last name</label>
                <input
                  style={inputStyle}
                  value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: themeStyles.textSecondary }}>Email</label>
              <input style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} value={profile?.email ?? ''} readOnly />
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: themeStyles.textSecondary }}>Phone number</label>
              <input
                style={inputStyle}
                value={form.phone_number}
                placeholder="+233 xx xxx xxxx"
                onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: themeStyles.textSecondary }}>Bio</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                value={form.bio}
                placeholder="Short bio..."
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-70"
              style={{ background: saved ? '#22C55E' : BRAND }}
            >
              {saving
                ? <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />
                : saved
                  ? <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
                  : <FontAwesomeIcon icon={faSave} className="w-3.5 h-3.5" />}
              {saved ? 'Saved' : 'Save changes'}
            </button>
          </div>

        </div>
      )}
    </AdminLayout>
  );
}
