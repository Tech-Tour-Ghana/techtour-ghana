'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faPencil, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

import { notify } from '@/components/admin/toast';
import { Button, IconButton, Modal, SearchInput, StatusPill, TableCard, Toggle, Toolbar, confirmAction, fieldStyle, fmtDate, reportError, rowClass } from '@/components/admin/ui';
import { Field, Section, inputCls, slugify } from '@/components/admin/tours/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import { LEVELS, LEVEL_LABELS, LEVEL_TONE, OPEN_DEADLINE, copySlug, type Destination, type Level, type Scholarship } from './shared';

type Insert = Database['public']['Tables']['scholarships']['Insert'];

interface Form {
  title: string; slug: string; destination_id: string; level: Level; description: string; deadline: string; amount: string;
  is_active: boolean; is_featured: boolean;
}

const EMPTY: Form = { title: '', slug: '', destination_id: '', level: 'all', description: '', deadline: '', amount: '', is_active: true, is_featured: false };

const toForm = (s: Scholarship): Form => ({
  title: s.title, slug: s.slug, destination_id: s.destination_id, level: s.level, description: s.description,
  deadline: s.deadline >= OPEN_DEADLINE ? '' : s.deadline, amount: s.amount, is_active: s.is_active, is_featured: s.is_featured,
});

export default function ScholarshipsPanel({ scholarships, destinations, loading, reload }: {
  scholarships: Scholarship[]; destinations: Destination[]; loading: boolean; reload: () => Promise<void>;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [search, setSearch] = useState('');
  const [destFilter, setDestFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState<'all' | Level>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<'new' | Scholarship | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const destName = (id: string) => destinations.find((d) => d.id === id)?.country_name ?? 'Unknown';
  const q = search.trim().toLowerCase();
  const shown = scholarships.filter((s) => {
    if (destFilter !== 'all' && s.destination_id !== destFilter) return false;
    if (levelFilter !== 'all' && s.level !== levelFilter) return false;
    if (statusFilter === 'active' && !s.is_active) return false;
    if (statusFilter === 'inactive' && s.is_active) return false;
    if (statusFilter === 'featured' && !s.is_featured) return false;
    return !q || [s.title, s.amount, destName(s.destination_id)].some((x) => x.toLowerCase().includes(q));
  });
  const allShownSelected = shown.length > 0 && shown.every((s) => selected.has(s.id));
  const chosen = scholarships.filter((s) => selected.has(s.id));
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  function open(s: 'new' | Scholarship) {
    setEditing(s);
    setForm(s === 'new' ? EMPTY : toForm(s));
    setSlugTouched(s !== 'new');
  }

  async function save() {
    const slug = form.slug.trim() || slugify(form.title);
    if (!form.title.trim()) return notify('Give the scholarship a title.');
    if (!form.destination_id) return notify('Choose the destination this scholarship belongs to.');
    if (!slug) return notify('The web address (slug) is empty.');
    const own = editing && editing !== 'new' ? editing.id : null;
    if (scholarships.some((s) => s.slug === slug && s.id !== own)) return notify('Another scholarship already uses that web address. Pick a different slug.');
    const row: Insert = {
      destination_id: form.destination_id, title: form.title.trim(), slug, level: form.level, description: form.description.trim(),
      deadline: form.deadline || OPEN_DEADLINE, amount: form.amount.trim(), is_active: form.is_active, is_featured: form.is_featured,
    };
    setSaving(true);
    const { error } = own ? await supabase.from('scholarships').update(row).eq('id', own) : await supabase.from('scholarships').insert(row);
    setSaving(false);
    if (reportError(error)) return;
    notify(own ? 'Scholarship saved.' : 'Scholarship created.', 'success');
    setEditing(null);
    await reload();
  }

  async function patch(s: Scholarship, change: Partial<Pick<Scholarship, 'is_active' | 'is_featured'>>) {
    if (reportError((await supabase.from('scholarships').update(change).eq('id', s.id)).error)) return;
    await reload();
  }

  async function duplicate(s: Scholarship) {
    const { id, created_at, updated_at, legacy_id, ...rest } = s; // eslint-disable-line @typescript-eslint/no-unused-vars
    const row: Insert = { ...rest, title: `${s.title} (copy)`, slug: copySlug(s.slug, scholarships.map((x) => x.slug)), is_active: false, is_featured: false };
    if (reportError((await supabase.from('scholarships').insert(row)).error)) return;
    notify('Copy created as a hidden draft.', 'success');
    await reload();
  }

  async function remove(list: Scholarship[]) {
    const names = list.length === 1 ? `"${list[0]!.title}"` : `${list.length} scholarships`;
    if (!(await confirmAction({ title: 'Delete scholarships?', message: `Delete ${names}? You can restore it from Trash. To just hide it, make it inactive instead.`, danger: true, confirmLabel: 'Delete' }))) return;
    if (reportError((await supabase.from('scholarships').delete().in('id', list.map((s) => s.id))).error)) return;
    setSelected(new Set());
    notify('Deleted.', 'success');
    await reload();
  }

  async function bulkActive(active: boolean) {
    if (reportError((await supabase.from('scholarships').update({ is_active: active }).in('id', chosen.map((s) => s.id))).error)) return;
    setSelected(new Set());
    await reload();
  }

  return (
    <>
      <Toolbar actions={<Button onClick={() => open('new')} disabled={destinations.length === 0}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add scholarship</Button>}>
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-xs" value={search} onChange={setSearch} placeholder="Search title, amount or country" label="Search scholarships" />
        <select aria-label="Destination" value={destFilter} onChange={(e) => setDestFilter(e.target.value)} className="px-3 py-2 text-sm" style={fieldStyle}>
          <option value="all">All destinations</option>
          {destinations.map((d) => <option key={d.id} value={d.id}>{d.country_name}</option>)}
        </select>
        <select aria-label="Level" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value as typeof levelFilter)} className="px-3 py-2 text-sm" style={fieldStyle}>
          <option value="all">Any level</option>
          {LEVELS.filter((l) => l !== 'all').map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
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
          <input type="checkbox" checked={allShownSelected} onChange={() => setSelected(allShownSelected ? new Set() : new Set(shown.map((s) => s.id)))} style={{ accentColor: 'var(--adm-primary)' }} />
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
        emptyTitle={scholarships.length === 0 ? 'No scholarships yet' : 'No scholarships match'}
        emptyBody={scholarships.length === 0 ? (destinations.length === 0 ? 'Add a destination first, then attach scholarships to it.' : 'Add the first scholarship students can apply for.') : 'Try a different search or filter.'}
        headers={['', 'Scholarship', 'Destination', 'Level', 'Deadline', 'Status', '']}
      >
        {shown.map((s) => {
          const isOpen = s.deadline >= OPEN_DEADLINE;
          return (
            <tr key={s.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="w-8 px-4 py-3"><input type="checkbox" aria-label={`Select ${s.title}`} checked={selected.has(s.id)} onChange={() => setSelected((p) => { const n = new Set(p); if (n.has(s.id)) n.delete(s.id); else n.add(s.id); return n; })} style={{ accentColor: 'var(--adm-primary)' }} /></td>
              <td className="px-4 py-3">
                <p className="font-medium" style={{ color: 'var(--adm-text)' }}>{s.title}</p>
                <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>{s.amount || 'No amount set'}</p>
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{destName(s.destination_id)}</td>
              <td className="px-4 py-3"><StatusPill tone={LEVEL_TONE[s.level]}>{LEVEL_LABELS[s.level]}</StatusPill></td>
              <td className="whitespace-nowrap px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>
                {isOpen ? 'Open all year' : <>{fmtDate(s.deadline)}{s.deadline < today && <span className="ml-1.5"><StatusPill tone="warning">Passed</StatusPill></span>}</>}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  <Toggle on={s.is_active} label={s.is_active ? 'Active' : 'Hidden'} onClick={() => patch(s, { is_active: !s.is_active })} />
                  <Toggle on={s.is_featured} label="Featured" onClick={() => patch(s, { is_featured: !s.is_featured })} />
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="Edit" onClick={() => open(s)}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                  <IconButton title="Duplicate" onClick={() => duplicate(s)}><FontAwesomeIcon icon={faCopy} className="h-3 w-3" /></IconButton>
                  <IconButton title="Delete" color="var(--adm-error)" onClick={() => remove([s])}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                </div>
              </td>
            </tr>
          );
        })}
      </TableCard>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add scholarship' : 'Edit scholarship'}
          subtitle={editing === 'new' ? undefined : editing.title}
          maxWidth="max-w-2xl"
          onClose={() => setEditing(null)}
          footer={<>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save scholarship'}</Button>
          </>}
        >
          <Section title="Basics">
            <Field label="Title" className="sm:col-span-2"><input className={inputCls} style={fieldStyle} value={form.title} placeholder="e.g. Commonwealth Scholarship" onChange={(e) => { set('title', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} /></Field>
            <Field label="Web address (slug)" hint="Must be unique."><input className={inputCls} style={fieldStyle} value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} /></Field>
            <Field label="Destination">
              <select className={inputCls} style={fieldStyle} value={form.destination_id} onChange={(e) => set('destination_id', e.target.value)}>
                <option value="">Choose a destination</option>
                {destinations.map((d) => <option key={d.id} value={d.id}>{d.country_name}</option>)}
              </select>
            </Field>
            <Field label="Description" className="sm:col-span-2"><textarea rows={4} className={inputCls} style={fieldStyle} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
          </Section>

          <Section title="Award">
            <Field label="Level">
              <select className={inputCls} style={fieldStyle} value={form.level} onChange={(e) => set('level', e.target.value as Level)}>
                {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
              </select>
            </Field>
            <Field label="Deadline" hint="Leave blank if it is open all year."><input type="date" className={inputCls} style={fieldStyle} value={form.deadline} onChange={(e) => set('deadline', e.target.value)} /></Field>
            <Field label="Amount" hint="Free text, for example Full tuition or Up to GHS 20,000." className="sm:col-span-2"><input className={inputCls} style={fieldStyle} value={form.amount} onChange={(e) => set('amount', e.target.value)} /></Field>
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
