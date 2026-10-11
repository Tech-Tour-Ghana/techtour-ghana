'use client';

// Programmes offered by the partner institutions. A student applies to a programme.

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faPencil, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

import { notify } from '@/components/admin/toast';
import { Button, IconButton, Modal, SearchInput, StatusPill, TableCard, Toggle, Toolbar, confirmAction, fieldStyle, reportError, rowClass } from '@/components/admin/ui';
import { Field, Section, inputCls, money, slugify } from '@/components/admin/tours/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { PROGRAM_LEVELS, levelLabel } from '@/lib/study/meta';
import type { Database } from '@/types/database';
import type { Institution } from './InstitutionsPanel';

export type Program = Database['public']['Tables']['study_programs']['Row'];
type Insert = Database['public']['Tables']['study_programs']['Insert'];

const CURRENCIES = ['USD', 'GBP', 'CAD', 'EUR', 'AUD', 'GHS'] as const;

interface Form {
  institution_id: string; title: string; slug: string; level: string; field: string; duration: string; tuition_amount: string;
  tuition_currency: string; application_fee: string; intakes: string; requirements: string; description: string; sort_order: string; is_active: boolean;
}
const EMPTY: Form = { institution_id: '', title: '', slug: '', level: 'bachelor', field: '', duration: '', tuition_amount: '', tuition_currency: 'USD', application_fee: '', intakes: '', requirements: '', description: '', sort_order: '0', is_active: true };
const toForm = (p: Program): Form => ({
  institution_id: p.institution_id, title: p.title, slug: p.slug, level: p.level, field: p.field, duration: p.duration,
  tuition_amount: p.tuition_amount === null ? '' : String(p.tuition_amount), tuition_currency: p.tuition_currency,
  application_fee: p.application_fee === null ? '' : String(p.application_fee), intakes: p.intakes, requirements: p.requirements,
  description: p.description, sort_order: String(p.sort_order), is_active: p.is_active,
});

export default function ProgramsPanel({ programs, institutions, applicationCounts, loading, reload }: {
  programs: Program[]; institutions: Institution[]; applicationCounts: Record<string, number>; loading: boolean; reload: () => Promise<void>;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [search, setSearch] = useState('');
  const [instFilter, setInstFilter] = useState('all');
  const [editing, setEditing] = useState<'new' | Program | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const instName = (id: string) => institutions.find((i) => i.id === id)?.name ?? '';

  const q = search.trim().toLowerCase();
  const shown = programs.filter((p) => (instFilter === 'all' || p.institution_id === instFilter) && (!q || [p.title, p.field, instName(p.institution_id)].some((x) => x.toLowerCase().includes(q))));

  function open(p: 'new' | Program) {
    setEditing(p);
    setForm(p === 'new' ? { ...EMPTY, institution_id: instFilter !== 'all' ? instFilter : '' } : toForm(p));
    setSlugTouched(p !== 'new');
  }

  async function save() {
    const slug = form.slug.trim() || slugify(form.title);
    const sort = Number(form.sort_order);
    const tuition = form.tuition_amount.trim() === '' ? null : Number(form.tuition_amount);
    const fee = form.application_fee.trim() === '' ? null : Number(form.application_fee);
    if (!form.institution_id) return notify('Choose the institution.');
    if (form.title.trim().length < 2) return notify('Give the programme a title.');
    if (!slug) return notify('The web address (slug) is empty.');
    if (tuition !== null && (!Number.isFinite(tuition) || tuition < 0)) return notify('Tuition must be a number, 0 or higher.');
    if (fee !== null && (!Number.isFinite(fee) || fee < 0)) return notify('The application fee must be a number, 0 or higher.');
    if (!Number.isInteger(sort) || sort < 0) return notify('Sort order must be a whole number, 0 or higher.');
    const own = editing && editing !== 'new' ? editing.id : null;
    if (programs.some((p) => p.slug === slug && p.institution_id === form.institution_id && p.id !== own)) return notify('This institution already has a programme with that web address.');
    const row: Insert = {
      institution_id: form.institution_id, title: form.title.trim(), slug, level: form.level, field: form.field.trim(), duration: form.duration.trim(),
      tuition_amount: tuition, tuition_currency: form.tuition_currency, application_fee: fee, intakes: form.intakes.trim(),
      requirements: form.requirements.trim(), description: form.description.trim(), sort_order: sort, is_active: form.is_active,
    };
    setSaving(true);
    const { error } = own ? await supabase.from('study_programs').update(row).eq('id', own) : await supabase.from('study_programs').insert(row);
    setSaving(false);
    if (reportError(error)) return;
    notify(own ? 'Programme saved.' : 'Programme added.', 'success');
    setEditing(null);
    await reload();
  }

  async function duplicate(p: Program) {
    const { id, created_at, updated_at, ...rest } = p; // eslint-disable-line @typescript-eslint/no-unused-vars
    let slug = `${p.slug}-copy`;
    for (let n = 2; programs.some((x) => x.institution_id === p.institution_id && x.slug === slug); n++) slug = `${p.slug}-copy-${n}`;
    if (reportError((await supabase.from('study_programs').insert({ ...rest, title: `${p.title} (copy)`, slug, is_active: false })).error)) return;
    notify('Copy created as a hidden draft.', 'success');
    await reload();
  }

  async function remove(p: Program) {
    const n = applicationCounts[p.id] ?? 0;
    if (!(await confirmAction({ title: 'Delete programme?', message: `Delete "${p.title}"?${n ? ` ${n} application${n === 1 ? '' : 's'} keep their details but lose the link.` : ''} You can restore it from Trash. To just hide it, make it inactive instead.`, danger: true, confirmLabel: 'Delete' }))) return;
    if (reportError((await supabase.from('study_programs').delete().eq('id', p.id)).error)) return;
    notify('Deleted.', 'success');
    await reload();
  }

  async function toggle(p: Program) {
    if (reportError((await supabase.from('study_programs').update({ is_active: !p.is_active }).eq('id', p.id)).error)) return;
    await reload();
  }

  return (
    <>
      <Toolbar actions={<Button onClick={() => open('new')} disabled={institutions.length === 0}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add programme</Button>}>
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-xs" value={search} onChange={setSearch} placeholder="Search programme, field or university" label="Search programmes" />
        <select aria-label="Institution" value={instFilter} onChange={(e) => setInstFilter(e.target.value)} className="px-3 py-2 text-sm" style={fieldStyle}>
          <option value="all">All institutions</option>
          {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </Toolbar>

      <TableCard
        loading={loading}
        empty={shown.length === 0}
        emptyTitle={programs.length === 0 ? 'No programmes yet' : 'No programmes match'}
        emptyBody={programs.length === 0 ? (institutions.length === 0 ? 'Add an institution first.' : 'Add the courses students can apply for.') : 'Try a different search or filter.'}
        headers={['Programme', 'Institution', 'Level', 'Tuition', 'Applications', 'Status', '']}
      >
        {shown.map((p) => (
          <tr key={p.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
            <td className="px-4 py-3">
              <p className="font-medium" style={{ color: 'var(--adm-text)' }}>{p.title}</p>
              <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>{[p.field, p.duration].filter(Boolean).join(' · ')}</p>
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{instName(p.institution_id)}</td>
            <td className="px-4 py-3"><StatusPill tone="neutral">{levelLabel(p.level)}</StatusPill></td>
            <td className="whitespace-nowrap px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{p.tuition_amount === null ? '-' : money(Number(p.tuition_amount), p.tuition_currency)}</td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{applicationCounts[p.id] ?? 0}</td>
            <td className="px-4 py-3"><Toggle on={p.is_active} label={p.is_active ? 'Active' : 'Hidden'} onClick={() => toggle(p)} /></td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <IconButton title="Edit" onClick={() => open(p)}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                <IconButton title="Duplicate" onClick={() => duplicate(p)}><FontAwesomeIcon icon={faCopy} className="h-3 w-3" /></IconButton>
                <IconButton title="Delete" color="var(--adm-error)" onClick={() => remove(p)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
              </div>
            </td>
          </tr>
        ))}
      </TableCard>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add programme' : 'Edit programme'}
          subtitle={editing === 'new' ? undefined : editing.title}
          maxWidth="max-w-3xl"
          onClose={() => setEditing(null)}
          footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save programme'}</Button></>}
        >
          <Section title="Basics">
            <Field label="Institution">
              <select className={inputCls} style={fieldStyle} value={form.institution_id} onChange={(e) => set('institution_id', e.target.value)}>
                <option value="">Choose an institution</option>
                {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </Field>
            <Field label="Level">
              <select className={inputCls} style={fieldStyle} value={form.level} onChange={(e) => set('level', e.target.value)}>
                {PROGRAM_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </Field>
            <Field label="Title" className="sm:col-span-2"><input className={inputCls} style={fieldStyle} value={form.title} placeholder="e.g. BSc Computer Science" onChange={(e) => { set('title', e.target.value); if (!slugTouched) set('slug', slugify(e.target.value)); }} /></Field>
            <Field label="Web address (slug)" hint="Unique within the institution."><input className={inputCls} style={fieldStyle} value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} /></Field>
            <Field label="Field of study"><input className={inputCls} style={fieldStyle} value={form.field} placeholder="e.g. Computing" onChange={(e) => set('field', e.target.value)} /></Field>
            <Field label="Duration"><input className={inputCls} style={fieldStyle} value={form.duration} placeholder="e.g. 4 years" onChange={(e) => set('duration', e.target.value)} /></Field>
            <Field label="Intakes" hint="When students can start."><input className={inputCls} style={fieldStyle} value={form.intakes} placeholder="e.g. September, January" onChange={(e) => set('intakes', e.target.value)} /></Field>
          </Section>
          <Section title="Costs">
            <Field label="Tuition (per year)"><input type="number" min={0} step="0.01" className={inputCls} style={fieldStyle} value={form.tuition_amount} onChange={(e) => set('tuition_amount', e.target.value)} /></Field>
            <Field label="Currency">
              <select className={inputCls} style={fieldStyle} value={form.tuition_currency} onChange={(e) => set('tuition_currency', e.target.value)}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="University application fee" hint="What the university charges to apply, if anything."><input type="number" min={0} step="0.01" className={inputCls} style={fieldStyle} value={form.application_fee} onChange={(e) => set('application_fee', e.target.value)} /></Field>
          </Section>
          <Section title="Details">
            <Field label="Entry requirements" hint="One per line." className="sm:col-span-2"><textarea rows={4} className={inputCls} style={fieldStyle} value={form.requirements} onChange={(e) => set('requirements', e.target.value)} /></Field>
            <Field label="Description" className="sm:col-span-2"><textarea rows={4} className={inputCls} style={fieldStyle} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
            <Field label="Sort order" hint="Lower numbers come first."><input type="number" min={0} className={inputCls} style={fieldStyle} value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></Field>
            <label className="flex items-end gap-2 pb-2 text-sm" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Active (visible on the site)</label>
          </Section>
        </Modal>
      )}
    </>
  );
}
