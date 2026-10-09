// Profile: avatar, name, phone and bio. profiles has no country column, so
// there is no country field. Email is shown read-only (Supabase Auth owns it).
// The avatar upload mirrors the admin profile page (avatars bucket, signed URL).

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getProfile, updateProfile, type Profile } from '@/lib/api';
import { createBrowserClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import AccountShell, { Section, StatusMessage, inputClass, useAccountTheme, type Status } from '@/components/account/AccountShell';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export default function ProfilePage() {
  const t = useAccountTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone_number: '', bio: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    (async () => {
      const data = await getProfile();
      if (data) {
        setProfile(data);
        setAvatarSrc(data.avatar_url);
        setForm({ first_name: data.first_name, last_name: data.last_name, phone_number: data.phone_number, bio: data.bio });
        const { data: auth } = await supabase.auth.getUser();
        if (auth.user) {
          setUserId(auth.user.id);
          const { data: row } = await supabase.from('profiles').select('avatar_path').eq('id', auth.user.id).maybeSingle();
          if (row?.avatar_path) {
            setAvatarPath(row.avatar_path);
            const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(row.avatar_path, 3600);
            if (signed) setAvatarSrc(signed.signedUrl);
          }
        }
      }
      setLoading(false);
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    const fields = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone_number: form.phone_number.trim(),
      bio: form.bio.trim(),
    };
    const result = await updateProfile(fields);
    if (result.success) {
      setForm(fields);
      setStatus({ type: 'success', text: 'Profile saved.' });
    } else {
      setStatus({ type: 'error', text: result.message || 'Could not save your profile.' });
    }
    setSaving(false);
  };

  const handleAvatar = async (file: File) => {
    if (!userId) return;
    if (!file.type.startsWith('image/')) { setStatus({ type: 'error', text: 'Choose an image file.' }); return; }
    if (file.size > MAX_AVATAR_BYTES) { setStatus({ type: 'error', text: 'Photo must be 5 MB or smaller.' }); return; }
    setStatus(null);
    setUploading(true);
    const supabase = createBrowserClient();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/${Date.now()}.${ext}`;
    if (avatarPath) await supabase.storage.from('avatars').remove([avatarPath]);
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) {
      setStatus({ type: 'error', text: 'Could not upload the photo. Please try again.' });
    } else {
      const { error: saveErr } = await supabase.from('profiles').update({ avatar_path: path, avatar_url: null }).eq('id', userId);
      if (saveErr) {
        setStatus({ type: 'error', text: 'The photo uploaded but could not be saved to your profile.' });
      } else {
        const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(path, 3600);
        setAvatarPath(path);
        setAvatarSrc(signed?.signedUrl ?? null);
        setStatus({ type: 'success', text: 'Photo updated.' });
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const displayName = [form.first_name, form.last_name].filter(Boolean).join(' ') || profile?.email.split('@')[0] || 'Your account';
  const labelCls = 'block text-sm font-medium mb-1.5';
  const fieldStyle = { background: t.inputBg, borderColor: t.inputBorder, color: t.text };

  return (
    <AccountShell title="Profile" subtitle="Your name, photo and contact details">
      <StatusMessage status={status} />
      {loading ? (
        <p role="status" className="text-sm" style={{ color: t.textSecondary }}>Loading profile...</p>
      ) : !profile ? (
        <p role="alert" className="text-sm" style={{ color: t.textSecondary }}>We could not load your profile. Refresh the page to try again.</p>
      ) : (
        <>
          <Section title="Photo">
            <div className="flex items-center gap-4">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt={`${displayName} profile photo`} className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div aria-hidden className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold flex-shrink-0" style={{ background: 'rgba(19,158,162,0.15)', color: '#0E7C80' }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <input
                  ref={fileRef}
                  id="profile-avatar"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleAvatar(f); }}
                />
                <Button variant="secondary" size="sm" arrow={false} loading={uploading} onClick={() => fileRef.current?.click()} style={{ color: t.text }}>
                  {uploading ? 'Uploading...' : avatarSrc ? 'Change photo' : 'Upload photo'}
                </Button>
                <p className="text-xs mt-2" style={{ color: t.textMuted }}>JPG, PNG or WebP, up to 5 MB.</p>
              </div>
            </div>
          </Section>

          <Section title="Personal details">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile-first_name" className={labelCls} style={{ color: t.textSecondary }}>First name</label>
                  <input id="profile-first_name" name="first_name" type="text" autoComplete="given-name" value={form.first_name} onChange={handleChange} className={inputClass} style={fieldStyle} />
                </div>
                <div>
                  <label htmlFor="profile-last_name" className={labelCls} style={{ color: t.textSecondary }}>Last name</label>
                  <input id="profile-last_name" name="last_name" type="text" autoComplete="family-name" value={form.last_name} onChange={handleChange} className={inputClass} style={fieldStyle} />
                </div>
              </div>
              <div>
                <label htmlFor="profile-email" className={labelCls} style={{ color: t.textSecondary }}>Email</label>
                <input id="profile-email" type="email" value={profile.email} readOnly aria-describedby="profile-email-help" className={inputClass} style={fieldStyle} />
                <p id="profile-email-help" className="text-xs mt-1.5" style={{ color: t.textMuted }}>
                  This is your sign-in email and cannot be edited here. Manage how you sign in under{' '}
                  <Link href="/auth/security" className="underline" style={{ color: '#0E7C80' }}>Security</Link>.
                </p>
              </div>
              <div>
                <label htmlFor="profile-phone_number" className={labelCls} style={{ color: t.textSecondary }}>Phone number</label>
                <input id="profile-phone_number" name="phone_number" type="tel" autoComplete="tel" value={form.phone_number} onChange={handleChange} className={inputClass} style={fieldStyle} />
              </div>
              <div>
                <label htmlFor="profile-bio" className={labelCls} style={{ color: t.textSecondary }}>Bio</label>
                <textarea id="profile-bio" name="bio" rows={4} value={form.bio} onChange={handleChange} className={inputClass} style={fieldStyle} />
              </div>
              <Button type="submit" variant="accent" arrow={false} loading={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
            </form>
          </Section>

          <p className="text-xs" style={{ color: t.textMuted }}>
            Member since {new Date(profile.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </>
      )}
    </AccountShell>
  );
}
