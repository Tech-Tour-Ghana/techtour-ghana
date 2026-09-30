'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faPencil, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

import UrlWithPicker from '@/components/admin/UrlWithPicker';
import { notify } from '@/components/admin/toast';
import { Button, IconButton, Modal, SearchInput, TableCard, Toggle, Toolbar, confirmAction, fieldStyle, reportError, rowClass } from '@/components/admin/ui';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import { CURRENCY_CODES, Field, Section, inputCls, money, slugify, type Category, type CurrencyCode, type Tour } from './shared';

type TourInsert = Database['public']['Tables']['tours']['Insert'];

interface Form {
  title: string; slug: string; category_id: string; short_description: string; description: string;
  location: string; region: string; price: string; discount_price: string; currency: CurrencyCode;
  duration_days: string; min_group_size: string; max_group_size: string; meeting_point: string;
  featured_image_url: string; gallery: string; video_url: string; video_preview_seconds: string;
  highlights: string; itinerary: string; includes: string; excludes: string;
  is_active: boolean; is_featured: boolean;
}

const EMPTY: Form = {
  title: '', slug: '', category_id: '', short_description: '', description: '', location: '', region: '', price: '', discount_price: '',
  currency: 'GHS', duration_days: '1', min_group_size: '1', max_group_size: '20', meeting_point: '', featured_image_url: '', gallery: '',
  video_url: '', video_preview_seconds: '0', highlights: '', itinerary: '', includes: '', excludes: '', is_active: true, is_featured: false,
};

const toForm = (t: Tour): Form => ({
  title: t.title, slug: t.slug, category_id: t.category_id ?? '', short_description: t.short_description, description: t.description,
  location: t.location, region: t.region, price: String(t.price), discount_price: t.discount_price === null ? '' : String(t.discount_price),
  currency: t.currency, duration_days: String(t.duration_days), min_group_size: String(t.min_group_size), max_group_size: String(t.max_group_size),
  meeting_point: t.meeting_point, featured_image_url: t.featured_image_url, gallery: t.gallery, video_url: t.video_url,
  video_preview_seconds: String(t.video_preview_seconds), highlights: t.highlights, itinerary: t.itinerary, includes: t.includes, excludes: t.excludes,
  is_active: t.is_active, is_featured: t.is_featured,
});

/** Returns an error message, or the row to save. */
function build(f: Form): { error: string } | { row: TourInsert } {
  const price = Number(f.price);
  const discount = f.discount_price.trim() === '' ? null : Number(f.discount_price);
  const min = Number(f.min_group_size);
  const max = Number(f.max_group_size);
  if (!f.title.trim()) return { error: 'Give the tour a title.' };
  if (!(f.slug.trim() || slugify(f.title))) return { error: 'The web address (slug) is empty.' };
  if (!Number.isFinite(price) || price < 0) return { error: 'Enter a valid price.' };
  if (discount !== null && (!Number.isFinite(discount) || discount < 0 || discount >= price)) return { error: 'The sale price must be lower than the price.' };
  if (!Number.isInteger(Number(f.duration_days)) || Number(f.duration_days) < 1) return { error: 'Duration must be at least 1 day.' };
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min) return { error: 'Group size: the maximum must be at least the minimum.' };
  return {
    row: {
      title: f.title.trim(), slug: f.slug.trim() || slugify(f.title), category_id: f.category_id || null,
      short_description: f.short_description.trim(), description: f.description.trim(), location: f.location.trim(), region: f.region.trim(),
      price, discount_price: discount, currency: f.currency, duration_days: Number(f.duration_days), min_group_size: min, max_group_size: max,
      meeting_point: f.meeting_point.trim(), featured_image_url: f.featured_image_url.trim(), gallery: f.gallery.trim(), video_url: f.video_url.trim(),
      video_preview_seconds: Math.max(0, Number(f.video_preview_seconds) || 0), highlights: f.highlights.trim(), itinerary: f.itinerary.trim(),
      includes: f.includes.trim(), excludes: f.excludes.trim(), is_active: f.is_active, is_featured: f.is_featured,
    },
  };
}

export default function ToursPanel({ tours, categories, loading, reload }: { tours: Tour[]; categories: Category[]; loading: boolean; reload: () => Promise<void> }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<'new' | Tour | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? '-';
  const q = search.trim().toLowerCase();
  const shown = tours.filter((t) => {
    if (catFilter !== 'all' && (catFilter === 'none' ? t.category_id !== null : t.category_id !== catFilter)) return false;
    if (statusFilter === 'active' && !t.is_active) return false;
    if (statusFilter === 'inactive' && t.is_active) return false;
    if (statusFilter === 'featured' && !t.is_featured) return false;
    return !q || [t.title, t.location, t.region].some((x) => x.toLowerCase().includes(q));
  });
  const allShownSelected = shown.length > 0 && shown.every((t) => selected.has(t.id));
  const chosen = tours.filter((t) => selected.has(t.id));

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  function open(t: 'new' | Tour) {
    setEditing(t);
    setForm(t === 'new' ? EMPTY : toForm(t));
    setSlugTouched(t !== 'new');
  }

  async function save() {
    const built = build(form);
    if ('error' in built) return notify(built.error);
    setSaving(true);
    const { error } = editing === 'new' || editing === null
      ? await supabase.from('tours').insert(built.row)
      : await supabase.from('tours').update(built.row).eq('id', editing.id);
    setSaving(false);
    if (reportError(error)) return;
    notify(editing === 'new' ? 'Tour created.' : 'Tour saved.', 'success');
    setEditing(null);
    await reload();
  }

  async function patch(t: Tour, change: Partial<Pick<Tour, 'is_active' | 'is_featured'>>) {
    if (reportError((await supabase.from('tours').update(change).eq('id', t.id)).error)) return;
    await reload();
  }

  async function duplicate(t: Tour) {
    const { id, created_at, updated_at, legacy_id, final_price, rating, review_count, ...rest } = t; // eslint-disable-line @typescript-eslint/no-unused-vars
    const taken = new Set(tours.map((x) => x.slug));
    let slug = `${t.slug}-copy`;
    for (let n = 2; taken.has(slug); n++) slug = `${t.slug}-copy-${n}`;
    if (reportError((await supabase.from('tours').insert({ ...rest, title: `${t.title} (copy)`, slug, is_active: false, is_featured: false } as TourInsert)).error)) return;
    notify('Copy created as a hidden draft.', 'success');
    await reload();
  }

  async function remove(list: Tour[]) {
    const names = list.length === 1 ? `"${list[0]!.title}"` : `${list.length} tours`;
    if (!(await confirmAction({ title: 'Delete tours?', message: `Delete ${names}? Their schedules and bookings links are removed too. This cannot be undone.`, danger: true, confirmLabel: 'Delete' }))) return;
    if (reportError((await supabase.from('tours').delete().in('id', list.map((t) => t.id))).error)) return;
    setSelected(new Set());
    notify(`${list.length === 1 ? 'Tour' : 'Tours'} deleted.`, 'success');
    await reload();
  }

  async function bulkActive(active: boolean) {
    if (reportError((await supabase.from('tours').update({ is_active: active }).in('id', chosen.map((t) => t.id))).error)) return;
    setSelected(new Set());
    await reload();
  }

  return (
    <>
      <Toolbar actions={<Button onClick={() => open('new')}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add tour</Button>}>
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-xs" value={search} onChange={setSearch} placeholder="Search title, location or region" label="Search tours" />
        <select aria-label="Category" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="px-3 py-2 text-sm" style={fieldStyle}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          <option value="none">No category</option>
        </select>
        <select aria-label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 text-sm" style={fieldStyle}>
          <option value="all">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Hidden</option>
          <option value="featured">Featured</option>
        </select>
      </Toolbar>

      <div className="mb-3 flex min-h-[2.25rem] flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2" style={{ color: 'var(--adm-text-2)' }}>
          <input type="checkbox" checked={allShownSelected} onChange={() => setSelected(allShownSelected ? new Set() : new Set(shown.map((t) => t.id)))} style={{ accentColor: 'var(--adm-primary)' }} />
          Select all shown ({shown.length})
        </label>
        {chosen.length > 0 && (
          <>
            <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{chosen.length} selected</span>
            <Button variant="secondary" onClick={() => bulkActive(true)}>Show</Button>
            <Button variant="secondary" onClick={() => bulkActive(false)}>Hide</Button>
            <Button variant="danger" onClick={() => remove(chosen)}><FontAwesomeIcon icon={faTrash} className="mr-2 h-3 w-3" />Delete</Button>
          </>
        )}
      </div>

      <TableCard
        loading={loading}
        empty={shown.length === 0}
        emptyTitle={tours.length === 0 ? 'No tours yet' : 'No tours match'}
        emptyBody={tours.length === 0 ? 'Add your first tour to start taking bookings.' : 'Try a different search or filter.'}
        headers={['', 'Tour', 'Category', 'Price', 'Status', '']}
      >
        {shown.map((t) => (
          <tr key={t.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
            <td className="w-8 px-4 py-3"><input type="checkbox" aria-label={`Select ${t.title}`} checked={selected.has(t.id)} onChange={() => setSelected((s) => { const n = new Set(s); if (n.has(t.id)) n.delete(t.id); else n.add(t.id); return n; })} style={{ accentColor: 'var(--adm-primary)' }} /></td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                {t.featured_image_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={t.featured_image_url} alt="" className="h-10 w-14 flex-shrink-0 rounded-md object-cover" />
                  : <span className="flex h-10 w-14 flex-shrink-0 items-center justify-center rounded-md text-[10px]" style={{ background: 'var(--adm-track)', color: 'var(--adm-muted)' }}>No image</span>}
                <div className="min-w-0">
                  <p className="truncate font-medium" style={{ color: 'var(--adm-text)' }}>{t.title}</p>
                  <p className="truncate text-xs" style={{ color: 'var(--adm-muted)' }}>{[[t.location, t.region].filter(Boolean).join(', '), `${t.duration_days} ${t.duration_days === 1 ? 'day' : 'days'}`].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{catName(t.category_id)}</td>
            <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>
              {t.discount_price !== null ? <><span>{money(t.discount_price, t.currency)}</span> <span className="font-normal line-through" style={{ color: 'var(--adm-muted)' }}>{money(t.price, t.currency)}</span></> : money(t.price, t.currency)}
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-1.5">
                <Toggle on={t.is_active} label={t.is_active ? 'Active' : 'Hidden'} onClick={() => patch(t, { is_active: !t.is_active })} />
                <Toggle on={t.is_featured} label="Featured" onClick={() => patch(t, { is_featured: !t.is_featured })} />
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <IconButton title="Edit" onClick={() => open(t)}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                <IconButton title="Duplicate" onClick={() => duplicate(t)}><FontAwesomeIcon icon={faCopy} className="h-3 w-3" /></IconButton>
                <IconButton title="Delete" color="var(--adm-error)" onClick={() => remove([t])}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
              </div>
            </td>
          </tr>
        ))}
      </TableCard>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add tour' : 'Edit tour'}
          subtitle={editing === 'new' ? undefined : editing.title}
          maxWidth="max-w-3xl"
          onClose={() => setEditing(null)}
          footer={<>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save tour'}</Button>
          </>}
        >
          <Section title="Basics">
            <Field label="Title" className="sm:col-span-2"><input className={inputCls} style={fieldStyle} value={form.title} onChange={(e) => { set('title', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} /></Field>
            <Field label="Web address (slug)" hint="Used in the tour link. Must be unique."><input className={inputCls} style={fieldStyle} value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} /></Field>
            <Field label="Category">
              <select className={inputCls} style={fieldStyle} value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Short description" hint="One or two lines for tour cards." className="sm:col-span-2"><textarea rows={2} className={inputCls} style={fieldStyle} value={form.short_description} onChange={(e) => set('short_description', e.target.value)} /></Field>
            <Field label="Full description" className="sm:col-span-2"><textarea rows={5} className={inputCls} style={fieldStyle} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
          </Section>

          <Section title="Where and how long">
            <Field label="Location"><input className={inputCls} style={fieldStyle} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Cape Coast" /></Field>
            <Field label="Region"><input className={inputCls} style={fieldStyle} value={form.region} onChange={(e) => set('region', e.target.value)} placeholder="e.g. Central Region" /></Field>
            <Field label="Duration (days)"><input type="number" min={1} className={inputCls} style={fieldStyle} value={form.duration_days} onChange={(e) => set('duration_days', e.target.value)} /></Field>
            <Field label="Meeting point"><input className={inputCls} style={fieldStyle} value={form.meeting_point} onChange={(e) => set('meeting_point', e.target.value)} /></Field>
            <Field label="Smallest group"><input type="number" min={1} className={inputCls} style={fieldStyle} value={form.min_group_size} onChange={(e) => set('min_group_size', e.target.value)} /></Field>
            <Field label="Largest group"><input type="number" min={1} className={inputCls} style={fieldStyle} value={form.max_group_size} onChange={(e) => set('max_group_size', e.target.value)} /></Field>
          </Section>

          <Section title="Price">
            <Field label="Price per person"><input type="number" min={0} step="0.01" className={inputCls} style={fieldStyle} value={form.price} onChange={(e) => set('price', e.target.value)} /></Field>
            <Field label="Sale price (optional)" hint="Must be lower than the price."><input type="number" min={0} step="0.01" className={inputCls} style={fieldStyle} value={form.discount_price} onChange={(e) => set('discount_price', e.target.value)} /></Field>
            <Field label="Currency">
              <select className={inputCls} style={fieldStyle} value={form.currency} onChange={(e) => set('currency', e.target.value as CurrencyCode)}>
                {CURRENCY_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </Section>

          <Section title="Pictures and video">
            <Field label="Main image" className="sm:col-span-2"><UrlWithPicker inputStyle={fieldStyle} value={form.featured_image_url} onChange={(v) => set('featured_image_url', v)} /></Field>
            <Field label="More images" hint="One image address per line." className="sm:col-span-2"><textarea rows={3} className={inputCls} style={fieldStyle} value={form.gallery} onChange={(e) => set('gallery', e.target.value)} /></Field>
            <Field label="Video link"><input className={inputCls} style={fieldStyle} value={form.video_url} onChange={(e) => set('video_url', e.target.value)} placeholder="https://..." /></Field>
            <Field label="Video preview (seconds)"><input type="number" min={0} className={inputCls} style={fieldStyle} value={form.video_preview_seconds} onChange={(e) => set('video_preview_seconds', e.target.value)} /></Field>
          </Section>

          <Section title="What guests get">
            <Field label="Highlights" hint="One per line." className="sm:col-span-2"><textarea rows={4} className={inputCls} style={fieldStyle} value={form.highlights} onChange={(e) => set('highlights', e.target.value)} /></Field>
            <Field label="Itinerary" hint="For example: Day 1 - Arrival and city tour." className="sm:col-span-2"><textarea rows={5} className={inputCls} style={fieldStyle} value={form.itinerary} onChange={(e) => set('itinerary', e.target.value)} /></Field>
            <Field label="Included" hint="One per line."><textarea rows={4} className={inputCls} style={fieldStyle} value={form.includes} onChange={(e) => set('includes', e.target.value)} /></Field>
            <Field label="Not included" hint="One per line."><textarea rows={4} className={inputCls} style={fieldStyle} value={form.excludes} onChange={(e) => set('excludes', e.target.value)} /></Field>
          </Section>

          <Section title="Visibility">
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Active (visible on the site)</label>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Featured</label>
          </Section>
        </Modal>
      )}
    </>
  );
}
