'use client';

// Site-wide SEO defaults. Only values that genuinely need configuring: everything
// else falls back sensibly in lib/seo/resolve.ts.

import { useState } from 'react';

import MediaPicker from '@/components/admin/media/MediaPicker';
import { Button, Surface, fieldStyle } from '@/components/admin/ui';
import { notify } from '@/components/admin/toast';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Settings = Database['public']['Tables']['site_settings']['Row'];

type Form = Pick<Settings, 'seo_site_name' | 'seo_title_pattern' | 'seo_default_description' | 'seo_default_image_url' | 'seo_org_name' | 'seo_org_logo_url'> & { profiles: string };

const isHttpUrl = (s: string) => { try { const u = new URL(s); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; } };

export default function SeoSettingsForm({ settings, onSaved }: { settings: Settings | null; onSaved: (s: Settings) => void }) {
  const [form, setForm] = useState<Form | null>(() => settings && {
    seo_site_name: settings.seo_site_name, seo_title_pattern: settings.seo_title_pattern, seo_default_description: settings.seo_default_description,
    seo_default_image_url: settings.seo_default_image_url, seo_org_name: settings.seo_org_name, seo_org_logo_url: settings.seo_org_logo_url,
    profiles: settings.seo_social_profiles.join('\n'),
  });
  const [pick, setPick] = useState<'seo_default_image_url' | 'seo_org_logo_url' | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  if (!settings || !form) return <Surface className="p-6 text-sm" style={{ color: 'var(--adm-text-2)' }}>No site settings row exists yet. Open Settings once to create it.</Surface>;

  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f));

  async function save() {
    if (!form || !settings) return;
    const profiles = form.profiles.split('\n').map((s) => s.trim()).filter(Boolean);
    const problems: string[] = [];
    if (!form.seo_site_name.trim()) problems.push('Enter a site name.');
    if (!form.seo_title_pattern.includes('%s')) problems.push('The title pattern must contain %s, where the page title goes.');
    for (const p of profiles) if (!isHttpUrl(p)) problems.push(`“${p}” is not a valid web address.`);
    setErrors(problems);
    if (problems.length) return;

    setSaving(true);
    const { data, error } = await createBrowserClient()
      .from('site_settings')
      .update({
        seo_site_name: form.seo_site_name.trim(),
        seo_title_pattern: form.seo_title_pattern.trim(),
        seo_default_description: form.seo_default_description.trim(),
        seo_default_image_url: form.seo_default_image_url.trim(),
        seo_org_name: form.seo_org_name.trim(),
        seo_org_logo_url: form.seo_org_logo_url.trim(),
        seo_social_profiles: profiles,
      })
      .eq('id', settings.id)
      .select('*')
      .single();
    setSaving(false);
    if (error || !data) return notify('Could not save the SEO settings.');
    onSaved(data);
    notify('SEO settings saved.', 'success');
  }

  const input = 'w-full px-3 py-2 text-sm';
  const label = 'mb-1 block text-xs font-semibold';
  const help = { color: 'var(--adm-muted)' };

  return (
    <Surface className="max-w-3xl space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="s-name" className={label} style={{ color: 'var(--adm-text-2)' }}>Site name</label>
          <input id="s-name" value={form.seo_site_name} onChange={(e) => set({ seo_site_name: e.target.value })} className={input} style={fieldStyle} />
        </div>
        <div>
          <label htmlFor="s-pattern" className={label} style={{ color: 'var(--adm-text-2)' }}>Title pattern</label>
          <input id="s-pattern" value={form.seo_title_pattern} onChange={(e) => set({ seo_title_pattern: e.target.value })} className={input} style={fieldStyle} />
          <p className="mt-1 text-[11px]" style={help}>%s is replaced by the page title, for example “Kente Cloth | TechTour Ghana”.</p>
        </div>
      </div>
      <div>
        <label htmlFor="s-desc" className={label} style={{ color: 'var(--adm-text-2)' }}>Default meta description</label>
        <textarea id="s-desc" rows={3} value={form.seo_default_description} onChange={(e) => set({ seo_default_description: e.target.value })} className={input} style={fieldStyle} />
        <p className="mt-1 text-[11px]" style={help}>Used when a page has neither a meta description nor an excerpt.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {([['seo_default_image_url', 'Default social image'], ['seo_org_logo_url', 'Organisation logo']] as const).map(([key, text]) => (
          <div key={key}>
            <p className={label} style={{ color: 'var(--adm-text-2)' }}>{text}</p>
            <div className="flex items-center gap-2">
              <div className="flex h-12 w-20 items-center justify-center overflow-hidden rounded-md" style={{ background: 'var(--adm-track)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {form[key] && <img src={form[key]} alt="" className="h-full w-full object-contain" />}
              </div>
              <Button variant="secondary" onClick={() => setPick(key)}>{form[key] ? 'Change' : 'Choose'}</Button>
              {form[key] && <Button variant="secondary" onClick={() => set({ [key]: '' } as Partial<Form>)}>Remove</Button>}
            </div>
          </div>
        ))}
      </div>
      <div>
        <label htmlFor="s-org" className={label} style={{ color: 'var(--adm-text-2)' }}>Organisation name</label>
        <input id="s-org" value={form.seo_org_name} onChange={(e) => set({ seo_org_name: e.target.value })} className={input} style={fieldStyle} />
      </div>
      <div>
        <label htmlFor="s-profiles" className={label} style={{ color: 'var(--adm-text-2)' }}>Social profile links</label>
        <textarea id="s-profiles" rows={3} value={form.profiles} onChange={(e) => set({ profiles: e.target.value })} placeholder={'https://www.instagram.com/…\nhttps://www.facebook.com/…'} className={input} style={fieldStyle} />
        <p className="mt-1 text-[11px]" style={help}>One per line. Published as part of the organisation&apos;s structured data.</p>
      </div>

      {errors.length > 0 && <ul role="alert" className="space-y-1 rounded-[var(--adm-radius-control)] p-3 text-xs" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
      <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save SEO settings'}</Button>

      <MediaPicker open={!!pick} onClose={() => setPick(null)} onSelect={([a]) => { if (a && pick) set({ [pick]: a.public_url } as Partial<Form>); setPick(null); }} />
    </Surface>
  );
}
