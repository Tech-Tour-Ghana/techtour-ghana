'use client';

// Partner universities. Students apply to a programme at one of these, and
// TechTour handles the application with the institution on their behalf.

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

import UrlWithPicker from '@/components/admin/UrlWithPicker';
import { notify } from '@/components/admin/toast';
import { Button, IconButton, Modal, SearchInput, TableCard, Toggle, Toolbar, confirmAction, fieldStyle, reportError, rowClass } from '@/components/admin/ui';
import { Field, Section, inputCls, slugify } from '@/components/admin/tours/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import type { Destination } from './shared';

export type Institution = Database['public']['Tables']['study_institutions']['Row'];
type Insert = Database['public']['Tables']['study_institutions']['Insert'];

interface Form {
  name: string; slug: string; destination_id: string; city: string; website: string; logo_url: string; image_url: string;
  description: string; sort_order: string; is_partner: boolean; is_featured: boolean; is_active: boolean;
}
const EMPTY: Form = { name: '', slug: '', destination_id: '', city: '', website: '', logo_url: '', image_url: '', description: '', sort_order: '0', is_partner: true, is_featured: false, is_active: true };
const toForm = (i: Institution): Form => ({
  name: i.name, slug: i.slug, destination_id: i.destination_id ?? '', city: i.city, website: i.website, logo_url: i.logo_url, image_url: i.image_url,
  description: i.description, sort_order: String(i.sort_order), is_partner: i.is_partner, is_featured: i.is_featured, is_active: i.is_active,
});

export default function InstitutionsPanel({ institutions, destinations, programCounts, loading, reload }: {
  institutions: Institution[]; destinations: Destination[]; programCounts: Record<string, number>; loading: boolean; reload: () => Promise<void>;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<'new' | Institution | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const country = (id: string | null) => destinations.find((d) => d.id === id)?.country_name ?? '';

  const q = search.trim().toLowerCase();
  const shown = institutions.filter((i) => !q || [i.name, i.city, country(i.destination_id)].some((x) => x.toLowerCase().includes(q)));

  function open(i: 'new' | Institution) {
    setEditing(i);
    setForm(i === 'new' ? EMPTY : toForm(i));
    setSlugTouched(i !== 'new');
  }

  async function save() {
    const slug = form.slug.trim() || slugify(form.name);
    const sort = Number(form.sort_order);
    if (form.name.trim().length < 2) return notify('Give the institution a name.');
    if (!slug) return notify('The web address (slug) is empty.');
    if (!form.destination_id) return notify('Choose the country this institution is in.');
    if (!Number.isInteger(sort) || sort < 0) return notify('Sort order must be a whole number, 0 or higher.');
    if (form.website.trim() && !/^https?:\/\//.test(form.website.trim())) return notify('The website must start with https://');
    const own = editing && editing !== 'new' ? editing.id : null;
    if (institutions.some((i) => i.slug === slug && i.id !== own)) return notify('Another institution already uses that web address.');
    const row: Insert = {
      name: form.name.trim(), slug, destination_id: form.destination_id, city: form.city.trim(), website: form.website.trim(),
      logo_url: form.logo_url.trim(), image_url: form.image_url.trim(), description: form.description.trim(), sort_order: sort,
      is_partner: form.is_partner, is_featured: form.is_featured, is_active: form.is_active,
    };
    setSaving(true);
    const { error } = own ? await supabase.from('study_institutions').update(row).eq('id', own) : await supabase.from('study_institutions').insert(row);
    setSaving(false);
    if (reportError(error)) return;
    notify(own ? 'Institution saved.' : 'Institution added.', 'success');
    setEditing(null);
    await reload();
  }

  async function patch(i: Institution, change: Partial<Pick<Institution, 'is_active' | 'is_featured' | 'is_partner'>>) {
    if (reportError((await supabase.from('study_institutions').update(change).eq('id', i.id)).error)) return;
    await reload();
  }

  async function remove(i: Institution) {
    const n = programCounts[i.id] ?? 0;
    if (!(await confirmAction({ title: 'Delete institution?', message: `Delete "${i.name}"?${n ? ` Its ${n} programme${n === 1 ? '' : 's'} are deleted with it.` : ''} Existing applications keep their details. You can restore it from Trash. To just hide it, make it inactive instead.`, danger: true, confirmLabel: 'Delete' }))) return;
    if (reportError((await supabase.from('study_institutions').delete().eq('id', i.id)).error)) return;
    notify('Deleted.', 'success');
    await reload();
  }

  return (
    <>
      <Toolbar actions={<Button onClick={() => open('new')} disabled={destinations.length === 0}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add institution</Button>}>
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-xs" value={search} onChange={setSearch} placeholder="Search name, city or country" label="Search institutions" />
      </Toolbar>

      <TableCard
        loading={loading}
        empty={shown.length === 0}
        emptyTitle={institutions.length === 0 ? 'No institutions yet' : 'No institutions match'}
        emptyBody={institutions.length === 0 ? (destinations.length === 0 ? 'Add a destination first, then add the universities you partner with.' : 'Add the first university you partner with.') : 'Try a different search.'}
        headers={['Institution', 'Country', 'Programmes', 'Status', '']}
      >
        {shown.map((i) => (
          <tr key={i.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                {i.logo_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={i.logo_url} alt="" className="h-10 w-10 flex-shrink-0 rounded-md object-contain" style={{ background: 'var(--adm-track)' }} />
                  : <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-[10px]" style={{ background: 'var(--adm-track)', color: 'var(--adm-muted)' }}>Logo</span>}
                <div className="min-w-0">
                  <p className="truncate font-medium" style={{ color: 'var(--adm-text)' }}>{i.name}</p>
                  <p className="truncate text-xs" style={{ color: 'var(--adm-muted)' }}>{[i.city, i.is_partner ? 'Partner' : 'Listed only'].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{country(i.destination_id) || '-'}</td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{programCounts[i.id] ?? 0}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                <Toggle on={i.is_active} label={i.is_active ? 'Active' : 'Hidden'} onClick={() => patch(i, { is_active: !i.is_active })} />
                <Toggle on={i.is_featured} label="Featured" onClick={() => patch(i, { is_featured: !i.is_featured })} />
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <IconButton title="Edit" onClick={() => open(i)}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                <IconButton title="Delete" color="var(--adm-error)" onClick={() => remove(i)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
              </div>
            </td>
          </tr>
        ))}
      </TableCard>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add institution' : 'Edit institution'}
          subtitle={editing === 'new' ? undefined : editing.name}
          maxWidth="max-w-3xl"
          onClose={() => setEditing(null)}
          footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save institution'}</Button></>}
        >
          <Section title="Basics">
            <Field label="Name"><input className={inputCls} style={fieldStyle} value={form.name} placeholder="e.g. University of Toronto" onChange={(e) => { set('name', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} /></Field>
            <Field label="Web address (slug)" hint="Unique. Used in the institution link."><input className={inputCls} style={fieldStyle} value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} /></Field>
            <Field label="Country">
              <select className={inputCls} style={fieldStyle} value={form.destination_id} onChange={(e) => set('destination_id', e.target.value)}>
                <option value="">Choose a country</option>
                {destinations.map((d) => <option key={d.id} value={d.id}>{d.country_name}</option>)}
              </select>
            </Field>
            <Field label="City"><input className={inputCls} style={fieldStyle} value={form.city} onChange={(e) => set('city', e.target.value)} /></Field>
            <Field label="Website" hint="Starts with https://" className="sm:col-span-2"><input className={inputCls} style={fieldStyle} value={form.website} onChange={(e) => set('website', e.target.value)} /></Field>
            <Field label="About the institution" className="sm:col-span-2"><textarea rows={4} className={inputCls} style={fieldStyle} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
          </Section>
          <Section title="Images">
            <Field label="Logo"><UrlWithPicker inputStyle={fieldStyle} placeholder="Logo URL or choose from the Media Library" value={form.logo_url} onChange={(v) => set('logo_url', v)} /></Field>
            <Field label="Photo" hint="Campus or city photo, shown on its card."><UrlWithPicker inputStyle={fieldStyle} placeholder="Photo URL or choose from the Media Library" value={form.image_url} onChange={(v) => set('image_url', v)} /></Field>
          </Section>
          <Section title="Display">
            <Field label="Sort order" hint="Lower numbers come first."><input type="number" min={0} className={inputCls} style={fieldStyle} value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></Field>
            <div className="flex flex-col justify-end gap-2 pb-1 text-sm" style={{ color: 'var(--adm-text-2)' }}>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Active (visible on the site)</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_partner} onChange={(e) => set('is_partner', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Official TechTour partner</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Featured</label>
            </div>
          </Section>
        </Modal>
      )}
    </>
  );
}
