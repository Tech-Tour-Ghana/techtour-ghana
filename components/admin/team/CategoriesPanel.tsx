'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

import { notify } from '@/components/admin/toast';
import { Button, IconButton, Modal, TableCard, Toggle, Toolbar, confirmAction, fieldStyle, reportError, rowClass } from '@/components/admin/ui';
import { Field, inputCls, slugify } from '@/components/admin/tours/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import type { JobCategory, Opening } from './shared';

interface Form { name: string; slug: string; sort_order: string; is_active: boolean }
const EMPTY: Form = { name: '', slug: '', sort_order: '0', is_active: true };

export default function CategoriesPanel({ categories, openings, loading, reload }: { categories: JobCategory[]; openings: Opening[]; loading: boolean; reload: () => Promise<void> }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [editing, setEditing] = useState<'new' | JobCategory | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const count = (id: string) => openings.filter((o) => o.category_id === id).length;

  function open(c: 'new' | JobCategory) {
    setEditing(c);
    setSlugTouched(c !== 'new');
    setForm(c === 'new' ? { ...EMPTY, sort_order: String(categories.reduce((n, x) => Math.max(n, x.sort_order), -1) + 1) } : { name: c.name, slug: c.slug, sort_order: String(c.sort_order), is_active: c.is_active });
  }

  async function save() {
    const slug = form.slug.trim() || slugify(form.name);
    const sort = Number(form.sort_order);
    if (!form.name.trim()) return notify('Give the category a name.');
    if (!slug) return notify('The web address (slug) is empty.');
    if (!Number.isInteger(sort) || sort < 0) return notify('Sort order must be a whole number, 0 or higher.');
    const own = editing && editing !== 'new' ? editing.id : null;
    if (categories.some((c) => c.slug === slug && c.id !== own)) return notify('Another category already uses that web address. Pick a different slug.');
    const row = { name: form.name.trim(), slug, sort_order: sort, is_active: form.is_active };
    setSaving(true);
    const { error } = own ? await supabase.from('job_categories').update(row).eq('id', own) : await supabase.from('job_categories').insert(row);
    setSaving(false);
    if (reportError(error)) return;
    notify('Category saved.', 'success');
    setEditing(null);
    await reload();
  }

  async function patch(c: JobCategory) {
    if (reportError((await supabase.from('job_categories').update({ is_active: !c.is_active }).eq('id', c.id)).error)) return;
    await reload();
  }

  async function remove(c: JobCategory) {
    const n = count(c.id);
    const message = n > 0
      ? `"${c.name}" has ${n} opening${n === 1 ? '' : 's'}. They stay on the site but lose their category. You can restore the category from Trash. Delete it?`
      : `Delete "${c.name}"? You can restore it from Trash.`;
    if (!(await confirmAction({ message, danger: true, confirmLabel: 'Delete' }))) return;
    if (reportError((await supabase.from('job_categories').delete().eq('id', c.id)).error)) return;
    await reload();
  }

  return (
    <>
      <Toolbar actions={<Button onClick={() => open('new')}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add category</Button>}>
        <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>{categories.length} categor{categories.length === 1 ? 'y' : 'ies'}</span>
      </Toolbar>
      <TableCard loading={loading} empty={categories.length === 0} emptyTitle="No categories yet" emptyBody="Categories group job openings, for example Operations or Engineering." headers={['Category', 'Openings', 'Order', 'Status', '']}>
        {categories.map((c) => (
          <tr key={c.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
            <td className="px-4 py-3">
              <p className="font-medium" style={{ color: 'var(--adm-text)' }}>{c.name}</p>
              <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>/{c.slug}</p>
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{count(c.id)}</td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{c.sort_order}</td>
            <td className="px-4 py-3"><Toggle on={c.is_active} label={c.is_active ? 'Active' : 'Hidden'} onClick={() => patch(c)} /></td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <IconButton title="Edit" onClick={() => open(c)}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                <IconButton title="Delete" color="var(--adm-error)" onClick={() => remove(c)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
              </div>
            </td>
          </tr>
        ))}
      </TableCard>

      {editing && (
        <Modal title={editing === 'new' ? 'Add category' : 'Edit category'} maxWidth="max-w-md" onClose={() => setEditing(null)}
          footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></>}>
          <div className="space-y-4">
            <Field label="Name"><input className={inputCls} style={fieldStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }))} /></Field>
            <Field label="Web address (slug)" hint="Must be unique."><input className={inputCls} style={fieldStyle} value={form.slug} onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: slugify(e.target.value) })); }} /></Field>
            <Field label="Sort order" hint="Whole number, 0 or higher. Lower shows first."><input type="number" min={0} step={1} className={inputCls} style={fieldStyle} value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} /></Field>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} style={{ accentColor: 'var(--adm-primary)' }} />Active</label>
          </div>
        </Modal>
      )}
    </>
  );
}
