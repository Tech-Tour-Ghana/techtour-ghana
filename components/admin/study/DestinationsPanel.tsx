'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faPencil, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

import UrlWithPicker from '@/components/admin/UrlWithPicker';
import { notify } from '@/components/admin/toast';
import { Button, IconButton, Modal, SearchInput, TableCard, Toggle, Toolbar, confirmAction, fieldStyle, reportError, rowClass } from '@/components/admin/ui';
import { Field, Section, inputCls, slugify } from '@/components/admin/tours/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import { copySlug, type Destination, type Scholarship } from './shared';

type Insert = Database['public']['Tables']['study_destinations']['Insert'];

interface Form {
  country_name: string; slug: string; flag: string; description: string; why_study: string; cost_of_living: string;
  language: string; currency_name: string; average_tuition: string; button_text: string; button_link: string;
  image_url: string; sort_order: string; is_active: boolean; is_featured: boolean;
}

const EMPTY: Form = {
  country_name: '', slug: '', flag: '', description: '', why_study: '', cost_of_living: '', language: '', currency_name: '', average_tuition: '',
  button_text: 'Find Out More', button_link: '/study-abroad', image_url: '', sort_order: '0', is_active: true, is_featured: false,
};

const toForm = (d: Destination): Form => ({
  country_name: d.country_name, slug: d.slug, flag: d.flag, description: d.description, why_study: d.why_study, cost_of_living: d.cost_of_living,
  language: d.language, currency_name: d.currency_name, average_tuition: d.average_tuition, button_text: d.button_text, button_link: d.button_link,
  image_url: d.image_url, sort_order: String(d.sort_order), is_active: d.is_active, is_featured: d.is_featured,
});

export default function DestinationsPanel({ destinations, scholarships, applications, loading, reload }: {
  destinations: Destination[]; scholarships: Scholarship[]; applications: Record<string, number>; loading: boolean; reload: () => Promise<void>;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<'new' | Destination | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const schCount = (id: string) => scholarships.filter((s) => s.destination_id === id).length;
  const q = search.trim().toLowerCase();
  const shown = destinations.filter((d) => {
    if (statusFilter === 'active' && !d.is_active) return false;
    if (statusFilter === 'inactive' && d.is_active) return false;
    if (statusFilter === 'featured' && !d.is_featured) return false;
    return !q || [d.country_name, d.slug, d.language].some((x) => x.toLowerCase().includes(q));
  });
  const allShownSelected = shown.length > 0 && shown.every((d) => selected.has(d.id));
  const chosen = destinations.filter((d) => selected.has(d.id));
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  function open(d: 'new' | Destination) {
    setEditing(d);
    setForm(d === 'new' ? EMPTY : toForm(d));
    setSlugTouched(d !== 'new');
  }

  async function save() {
    const sort = Number(form.sort_order);
    const slug = form.slug.trim() || slugify(form.country_name);
    if (!form.country_name.trim()) return notify('Give the destination a country name.');
    if (!slug) return notify('The web address (slug) is empty.');
    if (!Number.isInteger(sort) || sort < 0) return notify('Sort order must be a whole number, 0 or higher.');
    const own = editing && editing !== 'new' ? editing.id : null;
    if (destinations.some((d) => d.slug === slug && d.id !== own)) return notify('Another destination already uses that web address. Pick a different slug.');
    const row: Insert = {
      country_name: form.country_name.trim(), slug, flag: form.flag.trim(), description: form.description.trim(), why_study: form.why_study.trim(),
      cost_of_living: form.cost_of_living.trim(), language: form.language.trim(), currency_name: form.currency_name.trim(),
      average_tuition: form.average_tuition.trim(), button_text: form.button_text.trim(), button_link: form.button_link.trim(),
      image_url: form.image_url.trim(), sort_order: sort, is_active: form.is_active, is_featured: form.is_featured,
    };
    setSaving(true);
    const { error } = own ? await supabase.from('study_destinations').update(row).eq('id', own) : await supabase.from('study_destinations').insert(row);
    setSaving(false);
    if (reportError(error)) return;
    notify(own ? 'Destination saved.' : 'Destination created.', 'success');
    setEditing(null);
    await reload();
  }

  async function patch(d: Destination, change: Partial<Pick<Destination, 'is_active' | 'is_featured'>>) {
    if (reportError((await supabase.from('study_destinations').update(change).eq('id', d.id)).error)) return;
    await reload();
  }

  async function duplicate(d: Destination) {
    const { id, created_at, updated_at, legacy_id, ...rest } = d; // eslint-disable-line @typescript-eslint/no-unused-vars
    const row: Insert = { ...rest, country_name: `${d.country_name} (copy)`, slug: copySlug(d.slug, destinations.map((x) => x.slug)), is_active: false, is_featured: false };
    if (reportError((await supabase.from('study_destinations').insert(row)).error)) return;
    notify('Copy created as a hidden draft. Scholarships are not copied.', 'success');
    await reload();
  }

  async function remove(list: Destination[]) {
    const ids = new Set(list.map((d) => d.id));
    const sch = scholarships.filter((s) => ids.has(s.destination_id)).length;
    const apps = list.reduce((n, d) => n + (applications[d.id] ?? 0), 0);
    const names = list.length === 1 ? `"${list[0]!.country_name}"` : `${list.length} destinations`;
    const warn = [
      sch > 0 ? `Its ${sch} scholarship${sch === 1 ? '' : 's'} will be deleted with it.` : '',
      apps > 0 ? `${apps} application${apps === 1 ? '' : 's'} will keep their details but lose the link to the destination.` : '',
    ].filter(Boolean).join(' ');
    if (!(await confirmAction({ title: 'Delete destinations?', message: `Delete ${names}? ${warn} You can restore it from Trash. To just hide it, make it inactive instead.`.replace('  ', ' '), danger: true, confirmLabel: 'Delete' }))) return;
    if (reportError((await supabase.from('study_destinations').delete().in('id', [...ids])).error)) return;
    setSelected(new Set());
    notify('Deleted.', 'success');
    await reload();
  }

  async function bulkActive(active: boolean) {
    if (reportError((await supabase.from('study_destinations').update({ is_active: active }).in('id', chosen.map((d) => d.id))).error)) return;
    setSelected(new Set());
    await reload();
  }

  return (
    <>
      <Toolbar actions={<Button onClick={() => open('new')}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add destination</Button>}>
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-xs" value={search} onChange={setSearch} placeholder="Search country, slug or language" label="Search destinations" />
        <select aria-label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 text-sm" style={fieldStyle}>
          <option value="all">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Hidden</option>
          <option value="featured">Featured</option>
        </select>
      </Toolbar>

      <div className="mb-3 flex min-h-[2.25rem] flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2" style={{ color: 'var(--adm-text-2)' }}>
          <input type="checkbox" checked={allShownSelected} onChange={() => setSelected(allShownSelected ? new Set() : new Set(shown.map((d) => d.id)))} style={{ accentColor: 'var(--adm-primary)' }} />
          Select all shown ({shown.length})
        </label>
        {chosen.length > 0 && (
          <>
            <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{chosen.length} selected</span>
            <Button variant="secondary" onClick={() => bulkActive(true)}>Activate</Button>
            <Button variant="secondary" onClick={() => bulkActive(false)}>Deactivate</Button>
            <Button variant="danger" onClick={() => remove(chosen)}><FontAwesomeIcon icon={faTrash} className="mr-2 h-3 w-3" />Delete</Button>
          </>
        )}
      </div>

      <TableCard
        loading={loading}
        empty={shown.length === 0}
        emptyTitle={destinations.length === 0 ? 'No destinations yet' : 'No destinations match'}
        emptyBody={destinations.length === 0 ? 'Add the first country students can apply to.' : 'Try a different search or filter.'}
        headers={['', 'Destination', 'Scholarships', 'Applications', 'Order', 'Status', '']}
      >
        {shown.map((d) => (
          <tr key={d.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
            <td className="w-8 px-4 py-3"><input type="checkbox" aria-label={`Select ${d.country_name}`} checked={selected.has(d.id)} onChange={() => setSelected((s) => { const n = new Set(s); if (n.has(d.id)) n.delete(d.id); else n.add(d.id); return n; })} style={{ accentColor: 'var(--adm-primary)' }} /></td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                {d.image_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={d.image_url} alt="" className="h-10 w-14 flex-shrink-0 rounded-md object-cover" />
                  : <span className="flex h-10 w-14 flex-shrink-0 items-center justify-center rounded-md text-[10px]" style={{ background: 'var(--adm-track)', color: 'var(--adm-muted)' }}>No image</span>}
                <div className="min-w-0">
                  <p className="truncate font-medium" style={{ color: 'var(--adm-text)' }}>{d.flag && <span className="mr-1.5" aria-hidden>{d.flag}</span>}{d.country_name}</p>
                  <p className="truncate text-xs" style={{ color: 'var(--adm-muted)' }}>/{d.slug}{d.language ? ` · ${d.language}` : ''}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{schCount(d.id)}</td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{applications[d.id] ?? 0}</td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{d.sort_order}</td>
            <td className="px-4 py-3">
              <div className="flex gap-1.5">
                <Toggle on={d.is_active} label={d.is_active ? 'Active' : 'Hidden'} onClick={() => patch(d, { is_active: !d.is_active })} />
                <Toggle on={d.is_featured} label="Featured" onClick={() => patch(d, { is_featured: !d.is_featured })} />
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <IconButton title="Edit" onClick={() => open(d)}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                <IconButton title="Duplicate" onClick={() => duplicate(d)}><FontAwesomeIcon icon={faCopy} className="h-3 w-3" /></IconButton>
                <IconButton title="Delete" color="var(--adm-error)" onClick={() => remove([d])}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
              </div>
            </td>
          </tr>
        ))}
      </TableCard>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add destination' : 'Edit destination'}
          subtitle={editing === 'new' ? undefined : editing.country_name}
          maxWidth="max-w-3xl"
          onClose={() => setEditing(null)}
          footer={<>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save destination'}</Button>
          </>}
        >
          <Section title="Basics">
            <Field label="Country name"><input className={inputCls} style={fieldStyle} value={form.country_name} placeholder="e.g. United Kingdom" onChange={(e) => { set('country_name', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} /></Field>
            <Field label="Web address (slug)" hint="Used in the destination link. Must be unique."><input className={inputCls} style={fieldStyle} value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} /></Field>
            <Field label="Flag" hint="Paste a flag emoji. Some computers show it as two letters, which is normal."><input className={inputCls} style={fieldStyle} value={form.flag} maxLength={10} onChange={(e) => set('flag', e.target.value)} /></Field>
            <Field label="Language"><input className={inputCls} style={fieldStyle} value={form.language} placeholder="e.g. English" onChange={(e) => set('language', e.target.value)} /></Field>
            <Field label="Description" hint="Shown on destination cards." className="sm:col-span-2"><textarea rows={3} className={inputCls} style={fieldStyle} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
            <Field label="Why study here" className="sm:col-span-2"><textarea rows={4} className={inputCls} style={fieldStyle} value={form.why_study} onChange={(e) => set('why_study', e.target.value)} /></Field>
          </Section>

          <Section title="Costs">
            <Field label="Average tuition"><input className={inputCls} style={fieldStyle} value={form.average_tuition} placeholder="e.g. 10,000 to 20,000 per year" onChange={(e) => set('average_tuition', e.target.value)} /></Field>
            <Field label="Cost of living"><input className={inputCls} style={fieldStyle} value={form.cost_of_living} placeholder="e.g. About 1,200 per month" onChange={(e) => set('cost_of_living', e.target.value)} /></Field>
            <Field label="Currency name" hint="A label for readers, such as Canadian Dollar."><input className={inputCls} style={fieldStyle} value={form.currency_name} onChange={(e) => set('currency_name', e.target.value)} /></Field>
          </Section>

          <Section title="Picture and button">
            <Field label="Image" className="sm:col-span-2">
              <UrlWithPicker inputStyle={fieldStyle} value={form.image_url} onChange={(v) => set('image_url', v)} />
              {form.image_url.trim() && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image_url.trim()} alt="Preview" className="mt-2 h-32 w-full max-w-xs rounded-lg object-cover" style={{ border: '1px solid var(--adm-border)' }} />
              )}
            </Field>
            <Field label="Button text"><input className={inputCls} style={fieldStyle} value={form.button_text} onChange={(e) => set('button_text', e.target.value)} /></Field>
            <Field label="Button link"><input className={inputCls} style={fieldStyle} value={form.button_link} onChange={(e) => set('button_link', e.target.value)} /></Field>
          </Section>

          <Section title="Visibility">
            <Field label="Sort order" hint="Whole number, 0 or higher. Lower shows first."><input type="number" min={0} step={1} className={inputCls} style={fieldStyle} value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></Field>
            <div className="space-y-2 self-end">
              <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Active (visible on the site)</label>
              <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Featured</label>
            </div>
          </Section>
        </Modal>
      )}
    </>
  );
}
