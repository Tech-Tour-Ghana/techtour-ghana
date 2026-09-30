'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';

import { Button, IconButton, Modal, Surface, TableCard, Toggle, fieldStyle, fmtDate, rowClass } from '@/components/admin/ui';
import { notify } from '@/components/admin/toast';
import { validateRedirect } from '@/lib/seo/redirects';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

export type RedirectRow = Database['public']['Tables']['redirects']['Row'];

const BLANK = { id: null as string | null, source_path: '', destination: '', status_code: 301, is_active: true };

export default function RedirectsManager({ rows, onChange }: { rows: RedirectRow[]; onChange: (rows: RedirectRow[]) => void }) {
  const supabase = createBrowserClient();
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<RedirectRow | null>(null);

  async function save() {
    const problem = validateRedirect(form, rows, form.id ?? undefined);
    if (problem) return setError(problem);
    setError('');
    setSaving(true);
    const values = { source_path: form.source_path.trim(), destination: form.destination.trim(), status_code: form.status_code, is_active: form.is_active };
    const { data, error: err } = form.id
      ? await supabase.from('redirects').update(values).eq('id', form.id).select('*').single()
      : await supabase.from('redirects').insert(values).select('*').single();
    setSaving(false);
    if (err || !data) return setError('Could not save the redirect.');
    onChange(form.id ? rows.map((r) => (r.id === data.id ? data : r)) : [data, ...rows]);
    setForm(BLANK);
    notify('Redirect saved.', 'success');
  }

  async function toggle(r: RedirectRow) {
    const problem = !r.is_active ? validateRedirect(r, rows, r.id) : null;
    if (problem) return notify(problem);
    const { data, error: err } = await supabase.from('redirects').update({ is_active: !r.is_active }).eq('id', r.id).select('*').single();
    if (err || !data) return notify('Could not update the redirect.');
    onChange(rows.map((x) => (x.id === r.id ? data : x)));
  }

  async function remove(r: RedirectRow) {
    const { error: err } = await supabase.from('redirects').delete().eq('id', r.id);
    if (err) return notify('Could not delete the redirect.');
    onChange(rows.filter((x) => x.id !== r.id));
    setToDelete(null);
  }

  return (
    <div className="space-y-4">
      <Surface className="p-4">
        <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--adm-text)' }}>{form.id ? 'Edit redirect' : 'Add a redirect'}</h3>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_10rem_auto]">
          <div>
            <label htmlFor="rd-source" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Old address</label>
            <input id="rd-source" value={form.source_path} onChange={(e) => setForm({ ...form, source_path: e.target.value })} placeholder="/blog/culture/old-slug" className="w-full px-3 py-2 text-sm" style={fieldStyle} />
          </div>
          <div>
            <label htmlFor="rd-dest" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>New address</label>
            <input id="rd-dest" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="/blog/culture/new-slug" className="w-full px-3 py-2 text-sm" style={fieldStyle} />
          </div>
          <div>
            <label htmlFor="rd-type" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Type</label>
            <select id="rd-type" value={form.status_code} onChange={(e) => setForm({ ...form, status_code: Number(e.target.value) })} className="w-full px-3 py-2 text-sm" style={fieldStyle}>
              <option value={301}>301 Permanent</option>
              <option value={302}>302 Temporary</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={save} disabled={saving}>{form.id ? 'Save' : 'Add'}</Button>
            {form.id && <Button variant="secondary" onClick={() => { setForm(BLANK); setError(''); }}>Cancel</Button>}
          </div>
        </div>
        {error && <p role="alert" className="mt-2 text-xs" style={{ color: 'var(--adm-error)' }}>{error}</p>}
        <p className="mt-2 text-[11px]" style={{ color: 'var(--adm-muted)' }}>Use a 301 when a page has moved for good. Changing an article&apos;s URL in the editor can create one for you.</p>
      </Surface>

      <TableCard loading={false} empty={rows.length === 0} emptyTitle="No redirects yet" emptyBody="Redirects you add, or that the blog editor creates, appear here." headers={['Old address', 'New address', 'Type', 'Active', 'Created', 'Modified', '']}>
        {rows.map((r) => (
          <tr key={r.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
            <td className="max-w-[14rem] truncate px-4 py-3 font-mono text-xs" style={{ color: 'var(--adm-text)' }}>{r.source_path}</td>
            <td className="max-w-[14rem] truncate px-4 py-3 font-mono text-xs" style={{ color: 'var(--adm-text-2)' }}>{r.destination}</td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{r.status_code}</td>
            <td className="px-4 py-3"><Toggle on={r.is_active} label={r.is_active ? 'Active' : 'Off'} onClick={() => toggle(r)} /></td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-muted)' }}>{fmtDate(r.created_at)}</td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-muted)' }}>{fmtDate(r.updated_at)}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <IconButton title="Edit" onClick={() => { setForm({ id: r.id, source_path: r.source_path, destination: r.destination, status_code: r.status_code, is_active: r.is_active }); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><FontAwesomeIcon icon={faPen} className="h-3 w-3" /></IconButton>
                <IconButton title="Delete" color="var(--adm-error)" onClick={() => setToDelete(r)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
              </div>
            </td>
          </tr>
        ))}
      </TableCard>

      {toDelete && (
        <Modal title="Delete redirect?" maxWidth="max-w-sm" onClose={() => setToDelete(null)}
          footer={<><Button variant="secondary" onClick={() => setToDelete(null)}>Cancel</Button><Button variant="danger" onClick={() => remove(toDelete)}>Delete</Button></>}>
          <p className="text-xs" style={{ color: 'var(--adm-text-2)' }}>Visitors to <strong>{toDelete.source_path}</strong> will no longer be sent to the new address.</p>
        </Modal>
      )}
    </div>
  );
}
