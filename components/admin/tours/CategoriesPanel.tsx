'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

import { notify } from '@/components/admin/toast';
import { Button, IconButton, Modal, StatusPill, TableCard, Toolbar, confirmAction, fieldStyle, reportError, rowClass } from '@/components/admin/ui';
import { createBrowserClient } from '@/lib/supabase/client';
import { Field, inputCls, slugify, type Category, type Tour } from './shared';

interface Form { name: string; slug: string; description: string; sort_order: string; is_active: boolean }
const EMPTY: Form = { name: '', slug: '', description: '', sort_order: '0', is_active: true };

export default function CategoriesPanel({ categories, tours, loading, reload }: { categories: Category[]; tours: Tour[]; loading: boolean; reload: () => Promise<void> }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [editing, setEditing] = useState<'new' | Category | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const count = (id: string) => tours.filter((t) => t.category_id === id).length;

  function open(c: 'new' | Category) {
    setEditing(c);
    setSlugTouched(c !== 'new');
    setForm(c === 'new' ? EMPTY : { name: c.name, slug: c.slug, description: c.description, sort_order: String(c.sort_order), is_active: c.is_active });
  }

  async function save() {
    if (!form.name.trim()) return notify('Give the category a name.');
    const row = { name: form.name.trim(), slug: form.slug.trim() || slugify(form.name), description: form.description.trim(), sort_order: Number(form.sort_order) || 0, is_active: form.is_active };
    setSaving(true);
    const { error } = editing === 'new' || editing === null
      ? await supabase.from('tour_categories').insert(row)
      : await supabase.from('tour_categories').update(row).eq('id', editing.id);
    setSaving(false);
    if (reportError(error)) return;
    notify('Category saved.', 'success');
    setEditing(null);
    await reload();
  }

  async function remove(c: Category) {
    const n = count(c.id);
    const message = n > 0 ? `"${c.name}" has ${n} tour${n === 1 ? '' : 's'}. They will stay, but lose their category. Delete it?` : `Delete "${c.name}"? This cannot be undone.`;
    if (!(await confirmAction({ message, danger: true, confirmLabel: 'Delete' }))) return;
    if (reportError((await supabase.from('tour_categories').delete().eq('id', c.id)).error)) return;
    await reload();
  }

  return (
    <>
      <Toolbar actions={<Button onClick={() => open('new')}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add category</Button>}>
        <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>{categories.length} categor{categories.length === 1 ? 'y' : 'ies'}</span>
      </Toolbar>
      <TableCard loading={loading} empty={categories.length === 0} emptyTitle="No categories yet" emptyBody="Categories group tours, for example Culture or Adventure." headers={['Category', 'Tours', 'Order', 'Status', '']}>
        {categories.map((c) => (
          <tr key={c.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
            <td className="px-4 py-3">
              <p className="font-medium" style={{ color: 'var(--adm-text)' }}>{c.name}</p>
              {c.description && <p className="line-clamp-1 text-xs" style={{ color: 'var(--adm-muted)' }}>{c.description}</p>}
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{count(c.id)}</td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{c.sort_order}</td>
            <td className="px-4 py-3"><StatusPill tone={c.is_active ? 'success' : 'neutral'}>{c.is_active ? 'Active' : 'Hidden'}</StatusPill></td>
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
            <Field label="Name"><input className={inputCls} style={fieldStyle} value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) })); }} /></Field>
            <Field label="Web address (slug)"><input className={inputCls} style={fieldStyle} value={form.slug} onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: slugify(e.target.value) })); }} /></Field>
            <Field label="Description"><textarea rows={3} className={inputCls} style={fieldStyle} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
            <Field label="Sort order" hint="Lower numbers show first."><input type="number" className={inputCls} style={fieldStyle} value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} /></Field>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} style={{ accentColor: 'var(--adm-primary)' }} />Active</label>
          </div>
        </Modal>
      )}
    </>
  );
}
