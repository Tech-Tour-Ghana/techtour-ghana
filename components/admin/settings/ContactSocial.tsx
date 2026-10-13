'use client';

// Contact details and social links, edited in Settings and stored in the same
// tables the public site reads (footer_contacts and social_links).
//
// The public Contact page finds each contact detail by its emoji icon (address,
// first and second phone, email, opening hours), so this form works in those five
// slots and keeps the icon exact. Social links keep the platform's own logo and
// colour (lib/social/brands.ts).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

import { notify } from '@/components/admin/toast';
import { Button, ListSkeleton, Toggle, confirmAction, fieldStyle, reportError } from '@/components/admin/ui';
import { Card, Field, textClass } from '@/components/admin/settings/parts';
import { SOCIAL_BRANDS, SOCIAL_PLATFORMS, socialBrand, type SocialPlatform } from '@/lib/social/brands';
import { createBrowserClient } from '@/lib/supabase/client';

// What the Contact page looks for. The email icon keeps its variation selector.
const ICON = { address: '\u{1F4CD}', phone: '\u{1F4DE}', email: '✉️', hours: '\u{1F552}' } as const;
const norm = (icon: string) => icon.replace(/️/g, '');
const SLOT_ORDER = { address: 10, main: 20, support: 30, email: 40, hours: 50 } as const;

interface ContactRow { id: string; icon: string; text: string; sort_order: number }
interface Slots { address: string; main: string; support: string; email: string; hours: string }
const BLANK: Slots = { address: '', main: '', support: '', email: '', hours: '' };

interface SocialRow { key: string; id: string | null; platform: SocialPlatform; url: string; is_active: boolean }

function toSlots(rows: ContactRow[]): { slots: Slots; ids: Record<keyof Slots, string | null> } {
  const sorted = [...rows].sort((a, b) => a.sort_order - b.sort_order);
  const byIcon = (icon: string) => sorted.filter((r) => norm(r.icon) === norm(icon));
  const phones = byIcon(ICON.phone);
  const pick = (r: ContactRow | undefined) => ({ text: r?.text ?? '', id: r?.id ?? null });
  const a = pick(byIcon(ICON.address)[0]);
  const m = pick(phones[0]);
  const s = pick(phones[1]);
  const e = pick(byIcon(ICON.email)[0]);
  const h = pick(byIcon(ICON.hours)[0]);
  return {
    slots: { address: a.text, main: m.text, support: s.text, email: e.text, hours: h.text },
    ids: { address: a.id, main: m.id, support: s.id, email: e.id, hours: h.id },
  };
}

const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const looksLikePhone = (v: string) => /^[+()\d][\d\s()+.-]{5,}$/.test(v);
const isWebUrl = (v: string) => { try { const u = new URL(v); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; } };

/** A platform's logo on its own colour. */
export function BrandChip({ platform, size = 36 }: { platform: string; size?: number }) {
  const b = socialBrand(platform);
  return (
    <span
      role="img"
      aria-label={b.label}
      className="inline-flex flex-shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: b.color, color: 'rgb(var(--brand-white-rgb))', border: '1px solid var(--adm-border)' }}
    >
      <FontAwesomeIcon icon={b.icon} style={{ width: size * 0.45, height: size * 0.45 }} />
    </span>
  );
}

export default function ContactSocial() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [ids, setIds] = useState<Record<keyof Slots, string | null>>({ address: null, main: null, support: null, email: null, hours: null });
  const [saved, setSaved] = useState<Slots>(BLANK);
  const [slots, setSlots] = useState<Slots>(BLANK);
  const [savingContact, setSavingContact] = useState(false);

  const [socialSaved, setSocialSaved] = useState<SocialRow[]>([]);
  const [social, setSocial] = useState<SocialRow[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [adding, setAdding] = useState<SocialPlatform | ''>('');
  const [savingSocial, setSavingSocial] = useState(false);

  const load = useCallback(async () => {
    const [c, s] = await Promise.all([
      supabase.from('footer_contacts').select('id, icon, text, sort_order').order('sort_order'),
      supabase.from('social_links').select('id, platform, url, is_active, sort_order').order('sort_order'),
    ]);
    if (c.error || s.error) { setError('Could not load contact details and social links. Please refresh.'); setLoading(false); return; }
    setError('');
    const parsed = toSlots(c.data ?? []);
    setIds(parsed.ids); setSaved(parsed.slots); setSlots(parsed.slots);
    const rows: SocialRow[] = (s.data ?? []).map((r) => ({ key: r.id, id: r.id, platform: r.platform, url: r.url, is_active: r.is_active }));
    setSocialSaved(rows); setSocial(rows); setRemoved([]);
    setLoading(false);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const contactDirty = JSON.stringify(slots) !== JSON.stringify(saved);
  const socialDirty = removed.length > 0 || JSON.stringify(social) !== JSON.stringify(socialSaved);

  async function saveContact() {
    const v = Object.fromEntries(Object.entries(slots).map(([k, x]) => [k, x.trim()])) as unknown as Slots;
    if (v.email && !looksLikeEmail(v.email)) return notify('That email address does not look right.');
    for (const [k, label] of [['main', 'main phone'], ['support', 'support phone']] as const) {
      if (v[k] && !looksLikePhone(v[k])) return notify(`The ${label} number does not look right.`);
    }
    if (v.address.length > 200 || v.hours.length > 200) return notify('Keep the address and opening hours under 200 characters.');
    if (v.support && !v.main) return notify('Add a main phone number before a support number.');

    setSavingContact(true);
    const spec: { key: keyof Slots; icon: string; order: number }[] = [
      { key: 'address', icon: ICON.address, order: SLOT_ORDER.address },
      { key: 'main', icon: ICON.phone, order: SLOT_ORDER.main },
      { key: 'support', icon: ICON.phone, order: SLOT_ORDER.support },
      { key: 'email', icon: ICON.email, order: SLOT_ORDER.email },
      { key: 'hours', icon: ICON.hours, order: SLOT_ORDER.hours },
    ];
    for (const s of spec) {
      const text = v[s.key];
      const id = ids[s.key];
      const result = text && id ? await supabase.from('footer_contacts').update({ icon: s.icon, text, sort_order: s.order, is_active: true }).eq('id', id)
        : text ? await supabase.from('footer_contacts').insert({ icon: s.icon, text, sort_order: s.order, is_active: true })
        : id ? await supabase.from('footer_contacts').delete().eq('id', id)
        : null;
      if (result && reportError(result.error)) { setSavingContact(false); await load(); return; }
    }
    setSavingContact(false);
    notify('Contact details saved.', 'success');
    await load();
  }

  async function saveSocial() {
    const seen = new Set<string>();
    for (const r of social) {
      const url = r.url.trim();
      if (!isWebUrl(url)) return notify(`${SOCIAL_BRANDS[r.platform].label}: enter the full web address, starting with https://`);
      if (r.platform !== 'other') {
        if (seen.has(r.platform)) return notify(`${SOCIAL_BRANDS[r.platform].label} is listed twice.`);
        seen.add(r.platform);
      }
    }
    setSavingSocial(true);
    for (const id of removed) {
      if (reportError((await supabase.from('social_links').delete().eq('id', id)).error)) { setSavingSocial(false); await load(); return; }
    }
    for (const [i, r] of social.entries()) {
      const row = { platform: r.platform, url: r.url.trim(), is_active: r.is_active, sort_order: (i + 1) * 10, color: SOCIAL_BRANDS[r.platform].color };
      const res = r.id ? await supabase.from('social_links').update(row).eq('id', r.id) : await supabase.from('social_links').insert(row);
      if (reportError(res.error)) { setSavingSocial(false); await load(); return; }
    }
    setSavingSocial(false);
    notify('Social links saved.', 'success');
    await load();
  }

  async function removeSocial(r: SocialRow) {
    if (r.id && !(await confirmAction({ message: `Remove ${SOCIAL_BRANDS[r.platform].label} from the site? The change applies when you save.`, danger: true, confirmLabel: 'Remove' }))) return;
    setSocial((s) => s.filter((x) => x.key !== r.key));
    if (r.id) setRemoved((x) => [...x, r.id as string]);
  }

  function addSocial(platform: SocialPlatform) {
    setSocial((s) => [...s, { key: `new-${Date.now()}`, id: null, platform, url: '', is_active: true }]);
    setAdding('');
  }

  const set = (k: keyof Slots) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSlots((s) => ({ ...s, [k]: e.target.value }));
  const used = new Set(social.map((r) => r.platform));
  const available = SOCIAL_PLATFORMS.filter((p) => p === 'other' || !used.has(p));

  if (loading) return <ListSkeleton />;
  if (error) return <p role="alert" className="rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>;

  return (
    <>
      <Card title="Contact details" description="Shown on the public Contact page. Leave a field empty to remove it.">
        <Field id="ct-address" label="Address"><textarea id="ct-address" rows={2} maxLength={200} className={textClass} style={fieldStyle} value={slots.address} onChange={set('address')} placeholder="Street, area, city" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="ct-main" label="Main phone"><input id="ct-main" type="tel" inputMode="tel" autoComplete="off" className={textClass} style={fieldStyle} value={slots.main} onChange={set('main')} placeholder="+233 20 000 0000" /></Field>
          <Field id="ct-support" label="Support phone" hint="Optional."><input id="ct-support" type="tel" inputMode="tel" autoComplete="off" className={textClass} style={fieldStyle} value={slots.support} onChange={set('support')} placeholder="+233 30 000 0000" /></Field>
          <Field id="ct-email" label="Email"><input id="ct-email" type="email" autoComplete="off" className={textClass} style={fieldStyle} value={slots.email} onChange={set('email')} placeholder="hello@techtourghana.com" /></Field>
          <Field id="ct-hours" label="Opening hours"><input id="ct-hours" maxLength={200} className={textClass} style={fieldStyle} value={slots.hours} onChange={set('hours')} placeholder="Mon to Sat, 8am to 6pm" /></Field>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={saveContact} disabled={savingContact || !contactDirty}><FontAwesomeIcon icon={faFloppyDisk} className="mr-2 h-3 w-3" />{savingContact ? 'Saving…' : 'Save contact details'}</Button>
          <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>{contactDirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
        </div>
      </Card>

      <Card title="Social links" description="Each platform keeps its own logo and colour. These appear in the site footer and on the Contact page.">
        {social.length === 0 && <p className="text-sm" style={{ color: 'var(--adm-muted)' }}>No social links yet. Add a platform below.</p>}
        <ul className="space-y-3">
          {social.map((r) => {
            const b = SOCIAL_BRANDS[r.platform];
            const inputId = `soc-${r.key}`;
            return (
              <li key={r.key} className="flex flex-wrap items-center gap-3 rounded-[var(--adm-radius-control)] p-3" style={{ border: '1px solid var(--adm-border)', opacity: r.is_active ? 1 : 0.65 }}>
                <BrandChip platform={r.platform} />
                <div className="min-w-0 flex-1 basis-56">
                  <label htmlFor={inputId} className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>{b.label}</label>
                  <input id={inputId} type="url" inputMode="url" autoComplete="off" className={textClass} style={fieldStyle} value={r.url} placeholder={b.placeholder} onChange={(e) => setSocial((s) => s.map((x) => (x.key === r.key ? { ...x, url: e.target.value } : x)))} />
                </div>
                <Toggle on={r.is_active} label={r.is_active ? 'Shown' : 'Hidden'} onClick={() => setSocial((s) => s.map((x) => (x.key === r.key ? { ...x, is_active: !x.is_active } : x)))} />
                <button type="button" aria-label={`Remove ${b.label}`} title="Remove" onClick={() => removeSocial(r)} className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>
                  <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="soc-add" className="sr-only">Add a platform</label>
          <select id="soc-add" value={adding} onChange={(e) => setAdding(e.target.value as SocialPlatform | '')} className="px-3 py-2 text-sm" style={fieldStyle}>
            <option value="">Add a platform</option>
            {available.map((p) => <option key={p} value={p}>{SOCIAL_BRANDS[p].label}</option>)}
          </select>
          <Button variant="secondary" disabled={!adding} onClick={() => adding && addSocial(adding)}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add</Button>
        </div>

        {social.some((r) => r.is_active) && (
          <div>
            <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>How it looks on the site</p>
            <div className="flex flex-wrap gap-2">{social.filter((r) => r.is_active).map((r) => <BrandChip key={r.key} platform={r.platform} size={40} />)}</div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={saveSocial} disabled={savingSocial || !socialDirty}><FontAwesomeIcon icon={faFloppyDisk} className="mr-2 h-3 w-3" />{savingSocial ? 'Saving…' : 'Save social links'}</Button>
          <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>{socialDirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
        </div>
      </Card>
    </>
  );
}
