'use client';

// Site settings, grouped into tabs. General edits footer_settings (the name and
// tagline the navbar and footer read). Branding and the sign-in and
// registration screens edit the site_settings row.

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';

import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import UrlWithPicker from '@/components/admin/UrlWithPicker';
import { Card, Field, textClass } from '@/components/admin/settings/parts';
import { notify } from '@/components/admin/toast';
import { Button, ListSkeleton, Surface, Tabs, fieldStyle, reportError } from '@/components/admin/ui';

const SITE_KEYS = [
  'logo_url', 'favicon_url', 'login_background_url', 'login_headline', 'login_description',
  'register_background_url', 'register_headline', 'register_description',
] as const;

type SiteForm = Record<(typeof SITE_KEYS)[number], string>;
interface FooterForm { company_name: string; tagline: string }
type Tab = 'general' | 'branding' | 'screens' | 'more';

const TABS: { key: Tab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'branding', label: 'Branding' },
  { key: 'screens', label: 'Sign-in and registration' },
  { key: 'more', label: 'Related settings' },
];

const SHORTCUTS = [
  { href: '/admin/navigation', title: 'Social links', body: 'Social profiles, footer contacts, menus and legal links.' },
  { href: '/admin/maintenance', title: 'Maintenance mode', body: 'Show visitors a maintenance page while you work.' },
  { href: '/admin/seo', title: 'SEO', body: 'Site-wide title pattern, default description and share image.' },
];

const blankSite = (): SiteForm => ({
  logo_url: '', favicon_url: '', login_background_url: '', login_headline: '', login_description: '',
  register_background_url: '', register_headline: '', register_description: '',
});
const blankFooter = (): FooterForm => ({ company_name: '', tagline: '' });

export default function SettingsAdminPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [tab, setTab] = useState<Tab>('general');
  const [siteId, setSiteId] = useState<string | null>(null);
  const [footerId, setFooterId] = useState<string | null>(null);
  const [siteSaved, setSiteSaved] = useState<SiteForm>(blankSite);
  const [footerSaved, setFooterSaved] = useState<FooterForm>(blankFooter);
  const [site, setSite] = useState<SiteForm>(blankSite);
  const [footer, setFooter] = useState<FooterForm>(blankFooter);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [s, f] = await Promise.all([
      supabase.from('site_settings').select('*').limit(1).maybeSingle(),
      supabase.from('footer_settings').select('id, company_name, tagline').limit(1).maybeSingle(),
    ]);
    if (s.error || f.error) {
      setError('Could not load the settings.');
    } else {
      const sf = blankSite();
      const row = s.data;
      if (row) for (const k of SITE_KEYS) sf[k] = row[k] ?? '';
      const ff = f.data ? { company_name: f.data.company_name, tagline: f.data.tagline } : blankFooter();
      setSiteId(row?.id ?? null);
      setFooterId(f.data?.id ?? null);
      setSite(sf); setSiteSaved(sf);
      setFooter(ff); setFooterSaved(ff);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const siteDirty = SITE_KEYS.some((k) => site[k] !== siteSaved[k]);
  const footerDirty = footer.company_name !== footerSaved.company_name || footer.tagline !== footerSaved.tagline;
  const dirty = siteDirty || footerDirty;
  const setS = (k: keyof SiteForm, v: string) => setSite((f) => ({ ...f, [k]: v }));
  const setF = (k: keyof FooterForm, v: string) => setFooter((f) => ({ ...f, [k]: v }));

  async function saveSite(): Promise<boolean> {
    if (siteId) {
      if (reportError((await supabase.from('site_settings').update(site).eq('id', siteId)).error)) return false;
    } else {
      // A fresh database has no row yet: create it, then keep updating that one.
      const res = await supabase.from('site_settings').insert(site).select('id').single();
      if (reportError(res.error)) return false;
      setSiteId(res.data?.id ?? null);
    }
    setSiteSaved(site);
    return true;
  }

  async function saveFooter(): Promise<boolean> {
    const values = { company_name: footer.company_name.trim(), tagline: footer.tagline.trim() };
    if (footerId) {
      if (reportError((await supabase.from('footer_settings').update(values).eq('id', footerId)).error)) return false;
    } else {
      const res = await supabase.from('footer_settings').insert(values).select('id').single();
      if (reportError(res.error)) return false;
      setFooterId(res.data?.id ?? null);
    }
    setFooterSaved(values);
    setFooter(values);
    return true;
  }

  async function save() {
    setSaving(true);
    const ok = (!siteDirty || (await saveSite())) && (!footerDirty || (await saveFooter()));
    setSaving(false);
    if (ok) notify('Settings saved.', 'success');
  }

  return (
    <AdminLayout title="Settings" subtitle="Site identity, branding and sign-in screens">
      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <p role="alert" className="rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>
      ) : (
        <div className="max-w-3xl space-y-5 pb-20">
          <Tabs tabs={TABS} value={tab} onChange={setTab} />

          {tab === 'general' && (
            <Card title="Site identity" description="The name and tagline shown in the navbar and footer.">
              <Field id="site-name" label="Site name"><input id="site-name" className={textClass} style={fieldStyle} value={footer.company_name} onChange={(e) => setF('company_name', e.target.value)} /></Field>
              <Field id="site-tagline" label="Tagline"><input id="site-tagline" className={textClass} style={fieldStyle} value={footer.tagline} onChange={(e) => setF('tagline', e.target.value)} /></Field>
              <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>
                Contact email, phone and address are managed with the footer contacts in <Link href="/admin/navigation" className="font-semibold underline">Navigation</Link>.
              </p>
            </Card>
          )}

          {tab === 'branding' && (
            <Card title="Branding" description="Your logo and the small icon shown in browser tabs. A new favicon can take up to an hour to appear.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="logo" label="Logo"><UrlWithPicker inputStyle={fieldStyle} value={site.logo_url} onChange={(v) => setS('logo_url', v)} /></Field>
                <Field id="favicon" label="Favicon" hint="Square PNG or ICO."><UrlWithPicker inputStyle={fieldStyle} value={site.favicon_url} onChange={(v) => setS('favicon_url', v)} /></Field>
              </div>
            </Card>
          )}

          {tab === 'screens' && (
            <>
              <Card title="Sign-in page" description="The background and welcome text beside the sign-in form. Leave blank to use the defaults.">
                <Field id="login-bg" label="Background image"><UrlWithPicker inputStyle={fieldStyle} value={site.login_background_url} onChange={(v) => setS('login_background_url', v)} /></Field>
                <Field id="login-headline" label="Headline"><input id="login-headline" className={textClass} style={fieldStyle} value={site.login_headline} onChange={(e) => setS('login_headline', e.target.value)} /></Field>
                <Field id="login-desc" label="Description"><textarea id="login-desc" rows={2} className={textClass} style={fieldStyle} value={site.login_description} onChange={(e) => setS('login_description', e.target.value)} /></Field>
              </Card>
              <Card title="Registration page" description="The background and welcome text beside the sign-up form. Leave blank to use the defaults.">
                <Field id="reg-bg" label="Background image"><UrlWithPicker inputStyle={fieldStyle} value={site.register_background_url} onChange={(v) => setS('register_background_url', v)} /></Field>
                <Field id="reg-headline" label="Headline"><input id="reg-headline" className={textClass} style={fieldStyle} value={site.register_headline} onChange={(e) => setS('register_headline', e.target.value)} /></Field>
                <Field id="reg-desc" label="Description"><textarea id="reg-desc" rows={2} className={textClass} style={fieldStyle} value={site.register_description} onChange={(e) => setS('register_description', e.target.value)} /></Field>
              </Card>
            </>
          )}

          {tab === 'more' && (
            <div className="grid gap-3 sm:grid-cols-3">
              {SHORTCUTS.map((s) => (
                <Link key={s.href} href={s.href} className="block">
                  <Surface className="h-full p-4 transition hover:opacity-90">
                    <h2 className="flex items-center justify-between text-sm font-bold">{s.title}<FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" style={{ color: 'var(--adm-muted)' }} /></h2>
                    <p className="mt-1 text-xs" style={{ color: 'var(--adm-muted)' }}>{s.body}</p>
                  </Surface>
                </Link>
              ))}
            </div>
          )}

          {tab !== 'more' && (
            <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 rounded-[var(--adm-radius-control)] px-4 py-3" style={{ background: 'var(--adm-card)', border: '1px solid var(--adm-border)', boxShadow: 'var(--adm-shadow)' }}>
              <Button onClick={save} disabled={saving || !dirty}>
                <FontAwesomeIcon icon={faFloppyDisk} className="mr-2 h-3 w-3" />{saving ? 'Saving…' : 'Save settings'}
              </Button>
              <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
