'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCamera, faSpinner, faCheck, faSave, faUserCircle,
} from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { Button, ListSkeleton, reportError } from '@/components/admin/ui';

const BRAND = 'var(--adm-primary)';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone_number: '', bio: '' });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const themeStyles = {
    cardBg: 'var(--adm-card)',
    textPrimary: 'var(--adm-text)',
    textSecondary: 'var(--adm-text-2)',
    textMuted: 'var(--adm-muted)',
    border: 'var(--adm-border)',
    inputBg: 'var(--adm-track)',
    inputBorder: 'var(--adm-border)',
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
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone_number, bio, avatar_url, avatar_path')
      .eq('id', user.id)
      .single();

    if (!data) { setLoading(false); return; }
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
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be 5 MB or smaller.'); return; }
    setError('');
    setUploading(true);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${profile.id}/${Date.now()}.${ext}`;

    // Delete old avatar from storage if exists
    if (profile.avatar_path) {
      await supabase.storage.from('avatars').remove([profile.avatar_path]);
    }

    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) setError('Could not upload the photo. Please try again.');
    else {
      if (reportError((await supabase.from('profiles').update({ avatar_path: path, avatar_url: null }).eq('id', profile.id)).error)) { setUploading(false); return; }
      const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(path, 3600);
      if (signed) setAvatarPreview(signed.signedUrl);
      setProfile(prev => prev ? { ...prev, avatar_path: path } : prev);
    }
    setUploading(false);
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setError('');
    const { error: saveErr } = await supabase.from('profiles').update({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone_number: form.phone_number.trim() || null,
      bio: form.bio.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id);
    setSaving(false);
    if (saveErr) { setError('Could not save your changes. Please try again.'); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AdminLayout title="My Profile" subtitle="Edit your account details and photo">
      {loading ? (
        <ListSkeleton />
      ) : (
        <div className="max-w-2xl space-y-6">

          {/* Avatar card */}
          <div className="rounded-[var(--adm-radius-card)] p-6 flex flex-col sm:flex-row sm:items-center gap-6"
            style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, boxShadow: 'var(--adm-shadow)' }}>
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: 'var(--adm-elevated)' }}>
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
          <div className="rounded-[var(--adm-radius-card)] p-6 space-y-4"
            style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, boxShadow: 'var(--adm-shadow)' }}>
            <h3 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>Profile Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5" htmlFor="pf-first" style={{ color: themeStyles.textSecondary }}>First name</label>
                <input id="pf-first"
                  style={inputStyle}
                  value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5" htmlFor="pf-last" style={{ color: themeStyles.textSecondary }}>Last name</label>
                <input id="pf-last"
                  style={inputStyle}
                  value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1.5" htmlFor="pf-email" style={{ color: themeStyles.textSecondary }}>Email</label>
              <input id="pf-email" style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} value={profile?.email ?? ''} readOnly />
            </div>

            <div>
              <label className="block text-xs mb-1.5" htmlFor="pf-phone" style={{ color: themeStyles.textSecondary }}>Phone number</label>
              <input id="pf-phone"
                style={inputStyle}
                value={form.phone_number}
                placeholder="+233 xx xxx xxxx"
                onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs mb-1.5" htmlFor="pf-bio" style={{ color: themeStyles.textSecondary }}>Bio</label>
              <textarea id="pf-bio"
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                value={form.bio}
                placeholder="Short bio..."
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              />
            </div>

            {error && <p role="alert" className="text-xs" style={{ color: 'var(--adm-error)' }}>{error}</p>}
            <Button onClick={handleSave} disabled={saving || saved}>
              <FontAwesomeIcon icon={saved ? faCheck : faSave} className="mr-2 h-3 w-3" />
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
            </Button>
          </div>

        </div>
      )}
    </AdminLayout>
  );
}
