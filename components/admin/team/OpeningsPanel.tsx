'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faPencil, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

import { notify } from '@/components/admin/toast';
import { Button, IconButton, Modal, SearchInput, StatusPill, TableCard, Toggle, Toolbar, confirmAction, fieldStyle, fmtDate, reportError, rowClass } from '@/components/admin/ui';
import { Field, Section, inputCls, slugify } from '@/components/admin/tours/shared';
import { copySlug } from '@/components/admin/study/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';
import { EMPLOYMENT_TYPES, typeLabel, type EmploymentType, type JobCategory, type Opening } from './shared';

type Insert = Database['public']['Tables']['job_openings']['Insert'];

interface Form {
  title: string; slug: string; category_id: string; location: string; employment_type: EmploymentType; closing_date: string; level: string;
  tags: string; description: string; responsibilities: string; requirements: string; benefits: string; is_active: boolean;
}

const EMPTY: Form = {
  title: '', slug: '', category_id: '', location: 'Accra', employment_type: 'full_time', closing_date: '', level: '', tags: '',
  description: '', responsibilities: '', requirements: '', benefits: '', is_active: true,
};

const toForm = (o: Opening): Form => ({
  title: o.title, slug: o.slug, category_id: o.category_id ?? '', location: o.location, employment_type: o.employment_type, closing_date: o.closing_date ?? '',
  level: o.level ?? '', tags: (o.tags ?? []).join(', '), description: o.description, responsibilities: o.responsibilities ?? '',
  requirements: o.requirements, benefits: o.benefits ?? '', is_active: o.is_active,
});

export default function OpeningsPanel({ openings, categories, loading, reload }: { openings: Opening[]; categories: JobCategory[]; loading: boolean; reload: () => Promise<void> }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<'new' | Opening | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? '-';
  const q = search.trim().toLowerCase();
  const shown = openings.filter((o) => {
    if (catFilter !== 'all' && (catFilter === 'none' ? o.category_id !== null : o.category_id !== catFilter)) return false;
    if (statusFilter === 'active' && !o.is_active) return false;
    if (statusFilter === 'inactive' && o.is_active) return false;
    return !q || [o.title, o.location, typeLabel(o.employment_type)].some((x) => x.toLowerCase().includes(q));
  });
  const allShownSelected = shown.length > 0 && shown.every((o) => selected.has(o.id));
  const chosen = openings.filter((o) => selected.has(o.id));
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  function open(o: 'new' | Opening) {
    setEditing(o);
    setForm(o === 'new' ? EMPTY : toForm(o));
    setSlugTouched(o !== 'new');
  }

  async function save() {
    const slug = form.slug.trim() || slugify(form.title);
    if (!form.title.trim()) return notify('Give the opening a title.');
    if (!slug) return notify('The web address (slug) is empty.');
    if (!form.description.trim()) return notify('Add a description of the role.');
    const own = editing && editing !== 'new' ? editing.id : null;
    if (openings.some((o) => o.slug === slug && o.id !== own)) return notify('Another opening already uses that web address. Pick a different slug.');
    const row: Insert = {
      title: form.title.trim(), slug, category_id: form.category_id || null, location: form.location.trim() || 'Accra', employment_type: form.employment_type,
      closing_date: form.closing_date || null, level: form.level.trim(), tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      description: form.description.trim(), responsibilities: form.responsibilities.trim(), requirements: form.requirements.trim(),
      benefits: form.benefits.trim(), is_active: form.is_active,
    };
    setSaving(true);
    const { error } = own ? await supabase.from('job_openings').update(row).eq('id', own) : await supabase.from('job_openings').insert(row);
    setSaving(false);
    if (reportError(error)) return;
    notify(own ? 'Opening saved.' : 'Opening created.', 'success');
    setEditing(null);
    await reload();
  }

  async function patch(o: Opening, change: Partial<Pick<Opening, 'is_active'>>) {
    if (reportError((await supabase.from('job_openings').update(change).eq('id', o.id)).error)) return;
    await reload();
  }

  async function duplicate(o: Opening) {
    const { id, created_at, updated_at, legacy_id, ...rest } = o; // eslint-disable-line @typescript-eslint/no-unused-vars
    const row: Insert = { ...rest, title: `${o.title} (copy)`, slug: copySlug(o.slug, openings.map((x) => x.slug)), is_active: false };
    if (reportError((await supabase.from('job_openings').insert(row)).error)) return;
    notify('Copy created as a hidden draft.', 'success');
    await reload();
  }

  async function remove(list: Opening[]) {
    const names = list.length === 1 ? `"${list[0]!.title}"` : `${list.length} openings`;
    if (!(await confirmAction({ title: 'Delete openings?', message: `Delete ${names}? You can restore it from Trash. To just close it, make it inactive instead.`, danger: true, confirmLabel: 'Delete' }))) return;
    if (reportError((await supabase.from('job_openings').delete().in('id', list.map((o) => o.id))).error)) return;
    setSelected(new Set());
    notify('Deleted.', 'success');
    await reload();
  }

  async function bulkActive(active: boolean) {
    if (reportError((await supabase.from('job_openings').update({ is_active: active }).in('id', chosen.map((o) => o.id))).error)) return;
    setSelected(new Set());
    await reload();
  }

  return (
    <>
      <Toolbar actions={<Button onClick={() => open('new')}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add opening</Button>}>
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-xs" value={search} onChange={setSearch} placeholder="Search title, location or type" label="Search openings" />
        <select aria-label="Category" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="px-3 py-2 text-sm" style={fieldStyle}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          <option value="none">No category</option>
        </select>
        <select aria-label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 text-sm" style={fieldStyle}>
          <option value="all">Any status</option>
          <option value="active">Open</option>
          <option value="inactive">Closed</option>
        </select>
      </Toolbar>

      <div className="mb-3 flex min-h-[2.25rem] flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2" style={{ color: 'var(--adm-text-2)' }}>
          <input type="checkbox" checked={allShownSelected} onChange={() => setSelected(allShownSelected ? new Set() : new Set(shown.map((o) => o.id)))} style={{ accentColor: 'var(--adm-primary)' }} />
          Select all shown ({shown.length})
        </label>
        {chosen.length > 0 && (
          <>
            <span className="font-semibold" style={{ color: 'var(--adm-text)' }}>{chosen.length} selected</span>
            <Button variant="secondary" onClick={() => bulkActive(true)}>Open</Button>
            <Button variant="secondary" onClick={() => bulkActive(false)}>Close</Button>
            <Button variant="danger" onClick={() => remove(chosen)}><FontAwesomeIcon icon={faTrash} className="mr-2 h-3 w-3" />Delete</Button>
          </>
        )}
      </div>

      <TableCard
        loading={loading}
        empty={shown.length === 0}
        emptyTitle={openings.length === 0 ? 'No job openings yet' : 'No openings match'}
        emptyBody={openings.length === 0 ? 'Add a role to show it on the Careers page.' : 'Try a different search or filter.'}
        headers={['', 'Opening', 'Category', 'Type', 'Closes', 'Status', '']}
      >
        {shown.map((o) => (
          <tr key={o.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
            <td className="w-8 px-4 py-3"><input type="checkbox" aria-label={`Select ${o.title}`} checked={selected.has(o.id)} onChange={() => setSelected((s) => { const n = new Set(s); if (n.has(o.id)) n.delete(o.id); else n.add(o.id); return n; })} style={{ accentColor: 'var(--adm-primary)' }} /></td>
            <td className="px-4 py-3">
              <p className="font-medium" style={{ color: 'var(--adm-text)' }}>{o.title}</p>
              <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>{[o.location, o.level].filter(Boolean).join(' · ')}</p>
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{catName(o.category_id)}</td>
            <td className="whitespace-nowrap px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{typeLabel(o.employment_type)}</td>
            <td className="whitespace-nowrap px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>
              {o.closing_date ? <>{fmtDate(o.closing_date)}{o.closing_date < today && <span className="ml-1.5"><StatusPill tone="warning">Passed</StatusPill></span>}</> : 'No closing date'}
            </td>
            <td className="px-4 py-3"><Toggle on={o.is_active} label={o.is_active ? 'Open' : 'Closed'} onClick={() => patch(o, { is_active: !o.is_active })} /></td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <IconButton title="Edit" onClick={() => open(o)}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                <IconButton title="Duplicate" onClick={() => duplicate(o)}><FontAwesomeIcon icon={faCopy} className="h-3 w-3" /></IconButton>
                <IconButton title="Delete" color="var(--adm-error)" onClick={() => remove([o])}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
              </div>
            </td>
          </tr>
        ))}
      </TableCard>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add job opening' : 'Edit job opening'}
          subtitle={editing === 'new' ? undefined : editing.title}
          maxWidth="max-w-3xl"
          onClose={() => setEditing(null)}
          footer={<>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save opening'}</Button>
          </>}
        >
          <Section title="Basics">
            <Field label="Title" className="sm:col-span-2"><input className={inputCls} style={fieldStyle} value={form.title} onChange={(e) => { set('title', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} /></Field>
            <Field label="Web address (slug)" hint="Must be unique."><input className={inputCls} style={fieldStyle} value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} /></Field>
            <Field label="Category">
              <select className={inputCls} style={fieldStyle} value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Employment type">
              <select className={inputCls} style={fieldStyle} value={form.employment_type} onChange={(e) => set('employment_type', e.target.value as EmploymentType)}>
                {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Location"><input className={inputCls} style={fieldStyle} value={form.location} onChange={(e) => set('location', e.target.value)} /></Field>
            <Field label="Closing date" hint="Leave blank to keep it open. Passed dates hide the role on the site."><input type="date" className={inputCls} style={fieldStyle} value={form.closing_date} onChange={(e) => set('closing_date', e.target.value)} /></Field>
            <Field label="Level" hint="For example Junior, Mid-level or Senior."><input className={inputCls} style={fieldStyle} value={form.level} onChange={(e) => set('level', e.target.value)} /></Field>
            <Field label="Tags" hint="Separate with commas. The first three show on the job cards." className="sm:col-span-2"><input className={inputCls} style={fieldStyle} value={form.tags} placeholder="e.g. Tourism, Customer care, Accra" onChange={(e) => set('tags', e.target.value)} /></Field>
          </Section>

          <Section title="The role">
            <Field label="Description" className="sm:col-span-2"><textarea rows={4} className={inputCls} style={fieldStyle} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
            <Field label="Responsibilities" hint="One per line."><textarea rows={5} className={inputCls} style={fieldStyle} value={form.responsibilities} onChange={(e) => set('responsibilities', e.target.value)} /></Field>
            <Field label="Requirements" hint="One per line."><textarea rows={5} className={inputCls} style={fieldStyle} value={form.requirements} onChange={(e) => set('requirements', e.target.value)} /></Field>
            <Field label="Benefits" hint="One per line." className="sm:col-span-2"><textarea rows={4} className={inputCls} style={fieldStyle} value={form.benefits} onChange={(e) => set('benefits', e.target.value)} /></Field>
          </Section>

          <Section title="Visibility">
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Open (visible on the Careers page)</label>
          </Section>
        </Modal>
      )}
    </>
  );
}
