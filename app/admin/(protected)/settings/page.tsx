'use client';

// Branding and the copy on the sign-in and registration screens.

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons';

import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import UrlWithPicker from '@/components/admin/UrlWithPicker';
import { notify } from '@/components/admin/toast';
import { Button, ListSkeleton, Surface, fieldStyle } from '@/components/admin/ui';

interface SiteSettings {
  id: string;
  logo_url: string;
  favicon_url: string;
  login_background_url: string;
  login_headline: string;
  login_description: string;
  register_background_url: string;
  register_headline: string;
  register_description: string;
}

type Editable = Omit<SiteSettings, 'id'>;

const KEYS: (keyof Editable)[] = [
  'logo_url', 'favicon_url', 'login_background_url', 'login_headline', 'login_description',
  'register_background_url', 'register_headline', 'register_description',
];

function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Surface className="p-5">
      <h2 className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>{title}</h2>
      <p className="mb-4 text-xs" style={{ color: 'var(--adm-muted)' }}>{description}</p>
      <div className="space-y-4">{children}</div>
    </Surface>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>{label}</label>
      {children}
    </div>
  );
}

export default function SettingsAdminPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [row, setRow] = useState<SiteSettings | null>(null);
  const [form, setForm] = useState<Editable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
    if (err) setError('Could not load the settings.');
    else if (data) {
      setRow(data as SiteSettings);
      setForm(Object.fromEntries(KEYS.map((k) => [k, (data as SiteSettings)[k] ?? ''])) as Editable);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const dirty = !!row && !!form && KEYS.some((k) => (form[k] ?? '') !== (row[k] ?? ''));
  const set = (key: keyof Editable, value: string) => setForm((f) => (f ? { ...f, [key]: value } : f));

  async function save() {
    if (!row || !form) return;
    setSaving(true);
    const { error: err } = await supabase.from('site_settings').update(form).eq('id', row.id);
    setSaving(false);
    if (err) return notify('Could not save the settings. Please try again.');
    setRow({ ...row, ...form });
    notify('Settings saved.', 'success');
  }

  const text = 'w-full px-3 py-2 text-sm';

  return (
    <AdminLayout title="Settings" subtitle="Site branding and sign-in screens">
      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <p role="alert" className="rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>
      ) : !row || !form ? (
        <Surface className="p-6 text-sm" style={{ color: 'var(--adm-text-2)' }}>No site settings row exists yet.</Surface>
      ) : (
        <div className="max-w-3xl space-y-5 pb-20">
          <Card title="Branding" description="Your logo and the small icon shown in browser tabs.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="logo" label="Logo"><UrlWithPicker inputStyle={fieldStyle} value={form.logo_url} onChange={(v) => set('logo_url', v)} /></Field>
              <Field id="favicon" label="Favicon"><UrlWithPicker inputStyle={fieldStyle} value={form.favicon_url} onChange={(v) => set('favicon_url', v)} /></Field>
            </div>
          </Card>

          <Card title="Sign-in page" description="The background and welcome text next to the sign-in form.">
            <Field id="login-bg" label="Background image"><UrlWithPicker inputStyle={fieldStyle} value={form.login_background_url} onChange={(v) => set('login_background_url', v)} /></Field>
            <Field id="login-headline" label="Headline"><input id="login-headline" className={text} style={fieldStyle} value={form.login_headline} onChange={(e) => set('login_headline', e.target.value)} /></Field>
            <Field id="login-desc" label="Description"><textarea id="login-desc" rows={2} className={text} style={fieldStyle} value={form.login_description} onChange={(e) => set('login_description', e.target.value)} /></Field>
          </Card>

          <Card title="Registration page" description="The background and welcome text next to the sign-up form.">
            <Field id="reg-bg" label="Background image"><UrlWithPicker inputStyle={fieldStyle} value={form.register_background_url} onChange={(v) => set('register_background_url', v)} /></Field>
            <Field id="reg-headline" label="Headline"><input id="reg-headline" className={text} style={fieldStyle} value={form.register_headline} onChange={(e) => set('register_headline', e.target.value)} /></Field>
            <Field id="reg-desc" label="Description"><textarea id="reg-desc" rows={2} className={text} style={fieldStyle} value={form.register_description} onChange={(e) => set('register_description', e.target.value)} /></Field>
          </Card>

          <div className="sticky bottom-0 -mx-1 flex items-center gap-3 rounded-[var(--adm-radius-control)] px-4 py-3" style={{ background: 'var(--adm-card)', border: '1px solid var(--adm-border)', boxShadow: 'var(--adm-shadow)' }}>
            <Button onClick={save} disabled={saving || !dirty}>
              <FontAwesomeIcon icon={faFloppyDisk} className="mr-2 h-3 w-3" />{saving ? 'Saving…' : 'Save settings'}
            </Button>
            <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
