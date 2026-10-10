'use client';

// The signed-in admin's own account: name, photo, password, sign out, and the
// changes they have made recently (from the audit log, migration 0021).

import MfaCard from '@/components/admin/settings/MfaCard';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightFromBracket, faCamera, faFloppyDisk, faKey, faSpinner } from '@fortawesome/free-solid-svg-icons';

import { createBrowserClient } from '@/lib/supabase/client';
import { logoutUser } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Card, Field, textClass } from '@/components/admin/settings/parts';
import { notify } from '@/components/admin/toast';
import { Avatar, Button, ListSkeleton, StatusPill, Surface, fieldStyle, fmtDate, reportError } from '@/components/admin/ui';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_admin: boolean;
  avatar_path: string | null;
}

interface Action {
  id: string;
  action: 'insert' | 'update' | 'delete';
  table_name: string;
  summary: string;
  created_at: string;
}

const VERB = { insert: 'Created', update: 'Updated', delete: 'Deleted' } as const;
const MIN_PASSWORD = 8;

export default function AdminProfilePage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState({ first_name: '', last_name: '' });
  const [form, setForm] = useState({ first_name: '', last_name: '' });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [actions, setActions] = useState<Action[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pw, setPw] = useState({ next: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, is_admin, avatar_path, avatar_url')
      .eq('id', user.id)
      .single();
    if (!data) { setLoading(false); return; }
    setProfile(data);
    const names = { first_name: data.first_name ?? '', last_name: data.last_name ?? '' };
    setForm(names); setSaved(names);
    setLoading(false);

    if (data.avatar_path) {
      const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(data.avatar_path, 3600);
      if (signed) setAvatar(signed.signedUrl);
    } else if (data.avatar_url) {
      setAvatar(data.avatar_url);
    }
    // Admins can read the audit log; if the read is refused the list is simply hidden.
    const { data: log, error } = await supabase
      .from('audit_log')
      .select('id, action, table_name, summary, created_at')
      .eq('actor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setActions(error ? null : ((log as unknown as Action[]) ?? []));
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const dirty = form.first_name !== saved.first_name || form.last_name !== saved.last_name;

  async function handleAvatarUpload(file: File) {
    if (!profile) return;
    if (file.size > 5 * 1024 * 1024) { notify('Photo must be 5 MB or smaller.'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${profile.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) { notify('Could not upload the photo. Please try again.'); setUploading(false); return; }
    const res = await supabase.from('profiles').update({ avatar_path: path, avatar_url: null }).eq('id', profile.id);
    if (reportError(res.error)) { setUploading(false); return; }
    // Only drop the old file once the profile points at the new one.
    if (profile.avatar_path) await supabase.storage.from('avatars').remove([profile.avatar_path]);
    const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(path, 3600);
    if (signed) setAvatar(signed.signedUrl);
    setProfile({ ...profile, avatar_path: path });
    setUploading(false);
    notify('Photo updated.', 'success');
  }

  async function saveName() {
    if (!profile) return;
    const first_name = form.first_name.trim();
    const last_name = form.last_name.trim();
    if (!first_name) { notify('First name is required.'); return; }
    setSaving(true);
    const res = await supabase.from('profiles').update({ first_name, last_name }).eq('id', profile.id);
    setSaving(false);
    if (reportError(res.error)) return;
    setForm({ first_name, last_name });
    setSaved({ first_name, last_name });
    notify('Profile saved.', 'success');
  }

  async function changePassword() {
    if (pw.next.length < MIN_PASSWORD) { notify(`Use at least ${MIN_PASSWORD} characters for the new password.`); return; }
    if (pw.next !== pw.confirm) { notify('The two passwords do not match.'); return; }
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    setPwBusy(false);
    if (error) { notify(`Could not change the password: ${error.message}`); return; }
    setPw({ next: '', confirm: '' });
    notify('Password changed.', 'success');
  }

  async function signOut() {
    await logoutUser();
    router.push('/admin/login');
  }

  const fullName = `${form.first_name} ${form.last_name}`.trim() || profile?.email || 'Admin';

  return (
    <AdminLayout title="My Profile" subtitle="Your account, photo and password">
      {loading ? (
        <ListSkeleton />
      ) : !profile ? (
        <Surface className="p-6 text-sm" style={{ color: 'var(--adm-text-2)' }}>Could not load your profile. Try signing in again.</Surface>
      ) : (
        <div className="grid items-start gap-5 pb-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <Surface className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center lg:col-span-2">
            <div className="relative flex-shrink-0">
              <Avatar name={fullName} src={avatar} size={88} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-label="Upload photo"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-60"
                style={{ background: 'var(--adm-primary)', color: '#FFFFFF', border: '2px solid var(--adm-card)' }}
              >
                <FontAwesomeIcon icon={uploading ? faSpinner : faCamera} className={`h-3 w-3 ${uploading ? 'animate-spin' : ''}`} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ''; }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold">{fullName}</p>
              <p className="truncate text-xs" style={{ color: 'var(--adm-muted)' }}>{profile.email}</p>
              <div className="mt-2"><StatusPill tone={profile.is_admin ? 'info' : 'neutral'}>{profile.is_admin ? 'Administrator' : 'Staff'}</StatusPill></div>
              <p className="mt-2 text-[11px]" style={{ color: 'var(--adm-muted)' }}>JPEG, PNG, WebP or GIF, up to 5 MB.</p>
            </div>
            <Button variant="secondary" onClick={signOut}>
              <FontAwesomeIcon icon={faArrowRightFromBracket} className="mr-2 h-3 w-3" />Sign out
            </Button>
          </Surface>

          <div className="min-w-0 space-y-5">
          <Card title="Your details" description="Your name as shown to other admins. Your email is your sign-in and cannot be changed here.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="pf-first" label="First name"><input id="pf-first" className={textClass} style={fieldStyle} value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} /></Field>
              <Field id="pf-last" label="Last name"><input id="pf-last" className={textClass} style={fieldStyle} value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} /></Field>
            </div>
            <Field id="pf-email" label="Email"><input id="pf-email" className={textClass} style={{ ...fieldStyle, opacity: 0.6, cursor: 'not-allowed' }} value={profile.email} readOnly /></Field>
            <div className="flex items-center gap-3">
              <Button onClick={saveName} disabled={saving || !dirty}>
                <FontAwesomeIcon icon={faFloppyDisk} className="mr-2 h-3 w-3" />{saving ? 'Saving…' : 'Save changes'}
              </Button>
              {dirty && <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>You have unsaved changes.</span>}
            </div>
          </Card>

          <Card title="Change password" description={`At least ${MIN_PASSWORD} characters.`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="pw-new" label="New password"><input id="pw-new" type="password" autoComplete="new-password" className={textClass} style={fieldStyle} value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} /></Field>
              <Field id="pw-confirm" label="Confirm new password"><input id="pw-confirm" type="password" autoComplete="new-password" className={textClass} style={fieldStyle} value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} /></Field>
            </div>
            <Button onClick={changePassword} disabled={pwBusy || !pw.next || !pw.confirm}>
              <FontAwesomeIcon icon={faKey} className="mr-2 h-3 w-3" />{pwBusy ? 'Changing…' : 'Change password'}
            </Button>
          </Card>

          <MfaCard />
          </div>

          {actions && (
            <Card title="Your recent activity" description="The last changes you made in the admin.">
              {actions.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>No recorded changes yet.</p>
              ) : (
                <ul className="-my-2 divide-y" style={{ borderColor: 'var(--adm-border)' }}>
                  {actions.map((a) => (
                    <li key={a.id} className="flex items-baseline justify-between gap-3 py-2 text-xs" style={{ borderColor: 'var(--adm-border)' }}>
                      <span className="min-w-0 truncate">
                        <span className="font-semibold">{VERB[a.action]}</span>{' '}
                        <span style={{ color: 'var(--adm-text-2)' }}>{a.summary || a.table_name}</span>{' '}
                        <span style={{ color: 'var(--adm-muted)' }}>in {a.table_name.replace(/_/g, ' ')}</span>
                      </span>
                      <span className="flex-shrink-0" style={{ color: 'var(--adm-muted)' }}>{fmtDate(a.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
