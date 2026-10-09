'use client';

// Vacation rentals: add, edit, duplicate, delete and switch active / available /
// featured. The table already has admin write policies (0011) and a trash
// trigger is optional (see 0033), so this page is only the UI.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faHouse, faPencil, faPlus, faStar, faTrash } from '@fortawesome/free-solid-svg-icons';

import AdminLayout from '@/components/AdminLayout';
import UrlWithPicker from '@/components/admin/UrlWithPicker';
import { notify } from '@/components/admin/toast';
import { Button, IconButton, Modal, SearchInput, StatTile, TableCard, Toggle, Toolbar, confirmAction, fieldStyle, reportError, rowClass } from '@/components/admin/ui';
import { CURRENCY_CODES, Field, Section, inputCls, money, slugify, type CurrencyCode } from '@/components/admin/tours/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Rental = Database['public']['Tables']['vacation_rentals']['Row'];
type RentalInsert = Database['public']['Tables']['vacation_rentals']['Insert'];
type PropertyType = Database['public']['Enums']['rental_property_type'];

const PROPERTY_TYPES: readonly PropertyType[] = ['apartment', 'house', 'villa', 'cottage', 'studio', 'other'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Form {
  title: string; slug: string; description: string; property_type: PropertyType;
  location: string; address: string; city: string; region: string; country: string;
  bedrooms: string; bathrooms: string; max_guests: string;
  price_per_night: string; cleaning_fee: string; security_deposit: string; currency: CurrencyCode;
  amenities: string; main_image_url: string; images: string; sort_order: string;
  is_active: boolean; is_available: boolean; is_featured: boolean;
}

const EMPTY: Form = {
  title: '', slug: '', description: '', property_type: 'house', location: '', address: '', city: '', region: '', country: 'Ghana',
  bedrooms: '1', bathrooms: '1', max_guests: '2', price_per_night: '', cleaning_fee: '0', security_deposit: '0', currency: 'GHS',
  amenities: '', main_image_url: '', images: '', sort_order: '0', is_active: true, is_available: true, is_featured: false,
};

/** The images column is a JSON array of strings (or {url} objects from the old site). */
const imageLines = (v: Rental['images']) =>
  (Array.isArray(v) ? v.map((i) => (typeof i === 'string' ? i : i && typeof i === 'object' && !Array.isArray(i) && typeof i.url === 'string' ? i.url : '')) : []).filter(Boolean).join('\n');

const toForm = (r: Rental): Form => ({
  title: r.title, slug: r.slug, description: r.description, property_type: r.property_type, location: r.location, address: r.address,
  city: r.city, region: r.region, country: r.country, bedrooms: String(r.bedrooms), bathrooms: String(r.bathrooms), max_guests: String(r.max_guests),
  price_per_night: String(r.price_per_night), cleaning_fee: String(r.cleaning_fee), security_deposit: String(r.security_deposit), currency: r.currency,
  amenities: r.amenities, main_image_url: r.main_image_url, images: imageLines(r.images), sort_order: String(r.sort_order),
  is_active: r.is_active, is_available: r.is_available, is_featured: r.is_featured,
});

const isCount = (s: string, min: number) => s.trim() !== '' && Number.isInteger(Number(s)) && Number(s) >= min;
const isMoney = (s: string) => s.trim() !== '' && Number.isFinite(Number(s)) && Number(s) >= 0;

/** Returns an error message, or the row to save. Mirrors the table's CHECK constraints. */
function build(f: Form): { error: string } | { row: RentalInsert } {
  if (!f.title.trim()) return { error: 'Give the rental a title.' };
  const slug = f.slug.trim() || slugify(f.title);
  if (!slug) return { error: 'The web address (slug) is empty.' };
  if (!isCount(f.bedrooms, 0)) return { error: 'Bedrooms must be a whole number, 0 or more.' };
  if (!isCount(f.bathrooms, 0)) return { error: 'Bathrooms must be a whole number, 0 or more.' };
  if (!isCount(f.max_guests, 1)) return { error: 'Guests must be a whole number, at least 1.' };
  if (!isMoney(f.price_per_night)) return { error: 'Enter a valid price per night (0 or more).' };
  if (!isMoney(f.cleaning_fee)) return { error: 'The cleaning fee must be 0 or more.' };
  if (!isMoney(f.security_deposit)) return { error: 'The security deposit must be 0 or more.' };
  if (!isCount(f.sort_order, 0)) return { error: 'Sort order must be a whole number, 0 or more.' };
  return {
    row: {
      title: f.title.trim(), slug, description: f.description.trim(), property_type: f.property_type,
      location: f.location.trim(), address: f.address.trim(), city: f.city.trim(), region: f.region.trim(), country: f.country.trim() || 'Ghana',
      bedrooms: Number(f.bedrooms), bathrooms: Number(f.bathrooms), max_guests: Number(f.max_guests),
      price_per_night: Number(f.price_per_night), cleaning_fee: Number(f.cleaning_fee), security_deposit: Number(f.security_deposit), currency: f.currency,
      amenities: f.amenities.trim(), main_image_url: f.main_image_url.trim(),
      images: f.images.split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
      sort_order: Number(f.sort_order), is_active: f.is_active, is_available: f.is_available, is_featured: f.is_featured,
    },
  };
}

export default function AdminRentalsPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
  const [editing, setEditing] = useState<'new' | Rental | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('vacation_rentals').select('*').order('sort_order').order('created_at', { ascending: false });
    setError(err ? 'Rentals could not be loaded. Please refresh.' : '');
    setRentals(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const q = search.trim().toLowerCase();
  const shown = rentals.filter((r) => {
    if (typeFilter !== 'all' && r.property_type !== typeFilter) return false;
    if (statusFilter === 'active' && !r.is_active) return false;
    if (statusFilter === 'inactive' && r.is_active) return false;
    if (statusFilter === 'featured' && !r.is_featured) return false;
    return !q || [r.title, r.city, r.location, r.region].some((x) => x.toLowerCase().includes(q));
  });

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  function open(r: 'new' | Rental) {
    setEditing(r);
    setForm(r === 'new' ? EMPTY : toForm(r));
    // The address of an existing rental is never regenerated from its title.
    setSlugTouched(r !== 'new');
  }

  async function save() {
    const built = build(form);
    if ('error' in built) return notify(built.error);
    const self = editing === 'new' || editing === null ? null : editing.id;
    if (rentals.some((r) => r.slug === built.row.slug && r.id !== self)) return notify('Another rental already uses that web address. Change the slug.');
    setSaving(true);
    const { error: err } = self === null
      ? await supabase.from('vacation_rentals').insert(built.row)
      : await supabase.from('vacation_rentals').update(built.row).eq('id', self);
    setSaving(false);
    if (reportError(err)) return;
    notify(self === null ? 'Rental created.' : 'Rental saved.', 'success');
    setEditing(null);
    await load();
  }

  async function patch(r: Rental, change: Partial<Pick<Rental, 'is_active' | 'is_available' | 'is_featured'>>) {
    if (reportError((await supabase.from('vacation_rentals').update(change).eq('id', r.id)).error)) return;
    await load();
  }

  async function duplicate(r: Rental) {
    const { id, created_at, updated_at, legacy_id, main_image_path, ...rest } = r; // eslint-disable-line @typescript-eslint/no-unused-vars
    const taken = new Set(rentals.map((x) => x.slug));
    let slug = `${r.slug}-copy`;
    for (let n = 2; taken.has(slug); n++) slug = `${r.slug}-copy-${n}`;
    if (reportError((await supabase.from('vacation_rentals').insert({ ...rest, title: `${r.title} (copy)`, slug, is_active: false, is_featured: false })).error)) return;
    notify('Copy created as a hidden draft.', 'success');
    await load();
  }

  async function remove(r: Rental) {
    if (!(await confirmAction({ title: 'Delete rental?', message: `Delete "${r.title}"? This removes it from the site. Hide it instead if you may want it back.`, danger: true, confirmLabel: 'Delete' }))) return;
    if (reportError((await supabase.from('vacation_rentals').delete().eq('id', r.id)).error)) return;
    notify('Rental deleted.', 'success');
    await load();
  }

  return (
    <AdminLayout title="Vacation Rentals" subtitle="Rentals shown on the Dream Vacations page">
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={faHouse} label="Active rentals" value={rentals.filter((r) => r.is_active).length} tone="info" />
        <StatTile icon={faHouse} label="Available now" value={rentals.filter((r) => r.is_active && r.is_available).length} tone="success" />
        <StatTile icon={faStar} label="Featured" value={rentals.filter((r) => r.is_active && r.is_featured).length} tone="warning" />
        <StatTile icon={faHouse} label="Hidden" value={rentals.filter((r) => !r.is_active).length} tone="neutral" />
      </div>

      {error && <p role="alert" className="mb-4 rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>}

      <Toolbar actions={<Button onClick={() => open('new')}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add rental</Button>}>
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-xs" value={search} onChange={setSearch} placeholder="Search title, city or location" label="Search rentals" />
        <select aria-label="Property type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 text-sm" style={fieldStyle}>
          <option value="all">All types</option>
          {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{cap(t)}</option>)}
        </select>
        <select aria-label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 text-sm" style={fieldStyle}>
          <option value="all">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Hidden</option>
          <option value="featured">Featured</option>
        </select>
      </Toolbar>

      <TableCard
        loading={loading}
        empty={shown.length === 0}
        emptyTitle={rentals.length === 0 ? 'No rentals yet' : 'No rentals match'}
        emptyBody={rentals.length === 0 ? 'Add your first rental to show it on Dream Vacations.' : 'Try a different search or filter.'}
        headers={['Rental', 'Type', 'Price', 'Status', '']}
      >
        {shown.map((r) => (
          <tr key={r.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                {r.main_image_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={r.main_image_url} alt="" className="h-10 w-14 flex-shrink-0 rounded-md object-cover" />
                  : <span className="flex h-10 w-14 flex-shrink-0 items-center justify-center rounded-md text-[10px]" style={{ background: 'var(--adm-track)', color: 'var(--adm-muted)' }}>No image</span>}
                <div className="min-w-0">
                  <p className="truncate font-medium" style={{ color: 'var(--adm-text)' }}>{r.title}</p>
                  <p className="truncate text-xs" style={{ color: 'var(--adm-muted)' }}>{[[r.city, r.region].filter(Boolean).join(', ') || r.location, `${r.bedrooms} bed`, `${r.max_guests} guests`].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{cap(r.property_type)}</td>
            <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>{money(r.price_per_night, r.currency)}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                <Toggle on={r.is_active} label={r.is_active ? 'Active' : 'Hidden'} onClick={() => patch(r, { is_active: !r.is_active })} />
                <Toggle on={r.is_available} label={r.is_available ? 'Available' : 'Unavailable'} onClick={() => patch(r, { is_available: !r.is_available })} />
                <Toggle on={r.is_featured} label="Featured" onClick={() => patch(r, { is_featured: !r.is_featured })} />
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <IconButton title="Edit" onClick={() => open(r)}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                <IconButton title="Duplicate" onClick={() => duplicate(r)}><FontAwesomeIcon icon={faCopy} className="h-3 w-3" /></IconButton>
                <IconButton title="Delete" color="var(--adm-error)" onClick={() => remove(r)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
              </div>
            </td>
          </tr>
        ))}
      </TableCard>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add rental' : 'Edit rental'}
          subtitle={editing === 'new' ? undefined : editing.title}
          maxWidth="max-w-3xl"
          onClose={() => setEditing(null)}
          footer={<>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save rental'}</Button>
          </>}
        >
          <Section title="Basics">
            <Field label="Title" className="sm:col-span-2"><input className={inputCls} style={fieldStyle} value={form.title} onChange={(e) => { set('title', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} /></Field>
            <Field label="Web address (slug)" hint="Used in the rental link. Must be unique."><input className={inputCls} style={fieldStyle} value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} /></Field>
            <Field label="Property type">
              <select className={inputCls} style={fieldStyle} value={form.property_type} onChange={(e) => set('property_type', e.target.value as PropertyType)}>
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{cap(t)}</option>)}
              </select>
            </Field>
            <Field label="Description" className="sm:col-span-2"><textarea rows={5} className={inputCls} style={fieldStyle} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
          </Section>

          <Section title="Where">
            <Field label="Location" hint="For example Labadi, Accra."><input className={inputCls} style={fieldStyle} value={form.location} onChange={(e) => set('location', e.target.value)} /></Field>
            <Field label="Street address"><input className={inputCls} style={fieldStyle} value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
            <Field label="City" hint="Used for the city filter."><input className={inputCls} style={fieldStyle} value={form.city} onChange={(e) => set('city', e.target.value)} /></Field>
            <Field label="Region"><input className={inputCls} style={fieldStyle} value={form.region} onChange={(e) => set('region', e.target.value)} /></Field>
            <Field label="Country"><input className={inputCls} style={fieldStyle} value={form.country} onChange={(e) => set('country', e.target.value)} /></Field>
          </Section>

          <Section title="Size">
            <Field label="Bedrooms"><input type="number" min={0} step={1} className={inputCls} style={fieldStyle} value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} /></Field>
            <Field label="Bathrooms"><input type="number" min={0} step={1} className={inputCls} style={fieldStyle} value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} /></Field>
            <Field label="Maximum guests"><input type="number" min={1} step={1} className={inputCls} style={fieldStyle} value={form.max_guests} onChange={(e) => set('max_guests', e.target.value)} /></Field>
          </Section>

          <Section title="Price">
            <Field label="Price per night"><input type="number" min={0} step="0.01" className={inputCls} style={fieldStyle} value={form.price_per_night} onChange={(e) => set('price_per_night', e.target.value)} /></Field>
            <Field label="Currency">
              <select className={inputCls} style={fieldStyle} value={form.currency} onChange={(e) => set('currency', e.target.value as CurrencyCode)}>
                {CURRENCY_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Cleaning fee"><input type="number" min={0} step="0.01" className={inputCls} style={fieldStyle} value={form.cleaning_fee} onChange={(e) => set('cleaning_fee', e.target.value)} /></Field>
            <Field label="Security deposit"><input type="number" min={0} step="0.01" className={inputCls} style={fieldStyle} value={form.security_deposit} onChange={(e) => set('security_deposit', e.target.value)} /></Field>
          </Section>

          <Section title="Pictures and amenities">
            <Field label="Main image" className="sm:col-span-2"><UrlWithPicker inputStyle={fieldStyle} value={form.main_image_url} onChange={(v) => set('main_image_url', v)} /></Field>
            <Field label="More images" hint="One image address per line." className="sm:col-span-2"><textarea rows={3} className={inputCls} style={fieldStyle} value={form.images} onChange={(e) => set('images', e.target.value)} /></Field>
            <Field label="Amenities" hint="One per line, or separated by commas." className="sm:col-span-2"><textarea rows={4} className={inputCls} style={fieldStyle} value={form.amenities} onChange={(e) => set('amenities', e.target.value)} /></Field>
          </Section>

          <Section title="Visibility">
            <Field label="Sort order" hint="Lower numbers come first."><input type="number" min={0} step={1} className={inputCls} style={fieldStyle} value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></Field>
            <div className="flex flex-col gap-2 self-end">
              <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Active (visible on the site)</label>
              <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={form.is_available} onChange={(e) => set('is_available', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Available for stays</label>
              <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Featured</label>
            </div>
          </Section>
        </Modal>
      )}
    </AdminLayout>
  );
}
