'use client';

// Destination pages behind the Destinations menu. Public reads active rows (0018).

import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { notify } from '@/components/admin/toast';
import UrlWithPicker from '@/components/admin/UrlWithPicker';
import { BRAND, IconButton, TableCard, Toggle, rowClass, useAdminTheme, confirmAction } from '@/components/admin/ui';
import type { Database } from '@/types/database';

type Destination = Database['public']['Tables']['destinations']['Row'];

const EMPTY = { name: '', slug: '', tagline: '', description: '', highlights: '', image_url: '' };
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function AdminDestinationsPage() {
  const t = useAdminTheme();
  const [rows, setRows] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await createBrowserClient().from('destinations').select('*').order('sort_order');
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createBrowserClient();
    const values = { ...form, name: form.name.trim(), slug: form.slug.trim() || slugify(form.name) };
    const { error } = editingId
      ? await supabase.from('destinations').update(values).eq('id', editingId)
      : await supabase.from('destinations').insert({ ...values, sort_order: rows.length + 1 });
    if (error) return notify(`Could not save: ${error.message}`);
    setForm(EMPTY);
    setEditingId(null);
    load();
  }

  function edit(d: Destination) {
    setEditingId(d.id);
    setForm({ name: d.name, slug: d.slug, tagline: d.tagline, description: d.description, highlights: d.highlights, image_url: d.image_url });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function toggleActive(d: Destination) {
    const { error } = await createBrowserClient().from('destinations').update({ is_active: !d.is_active }).eq('id', d.id);
    if (error) return notify(`Could not update: ${error.message}`);
    setRows((prev) => prev.map((x) => (x.id === d.id ? { ...x, is_active: !d.is_active } : x)));
  }

  async function remove(id: string) {
    if (!(await confirmAction({ message: 'Delete this destination? You can restore it from Trash.', danger: true }))) return;
    const { error } = await createBrowserClient().from('destinations').delete().eq('id', id);
    if (error) return notify(`Could not delete: ${error.message}`);
    setRows((prev) => prev.filter((x) => x.id !== id));
  }

  const input = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textPrimary };
  const cls = 'px-3 py-2 rounded-lg text-sm';

  return (
    <AdminLayout title="Destinations" subtitle="Pages behind the Destinations menu">
      <div className="space-y-4">
        <form onSubmit={save} className="rounded-xl p-4 grid gap-3 md:grid-cols-3" style={{ background: t.cardBg, border: `1px solid ${t.border}` }}>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" aria-label="Name" className={cls} style={input} />
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Slug (auto from name)" aria-label="Slug (auto from name)" className={cls} style={input} />
          <div className="md:col-span-3"><UrlWithPicker inputStyle={input} placeholder="Image URL or choose from the Media Library" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} /></div>
          <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Tagline" aria-label="Tagline" className={`${cls} md:col-span-3`} style={input} />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" aria-label="Description" rows={4} className={`${cls} md:col-span-3`} style={input} />
          <textarea value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })} placeholder="Highlights, one per line" aria-label="Highlights, one per line" rows={4} className={`${cls} md:col-span-3`} style={input} />
          <div className="md:col-span-3 flex gap-3">
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: BRAND.teal }}>
              {editingId ? 'Save changes' : 'Add destination'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY); }} className="px-4 py-2 rounded-lg text-sm" style={{ background: t.chipBg, color: t.textSecondary }}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <TableCard loading={loading} empty={rows.length === 0} headers={['Destination', 'Slug', 'Active', '']}>
          {rows.map((d) => (
            <tr key={d.id} className={rowClass} style={{ borderColor: t.border }}>
              <td className="px-4 py-3 font-medium" style={{ color: t.textPrimary }}>{d.name}</td>
              <td className="px-4 py-3" style={{ color: t.textSecondary }}>{d.slug}</td>
              <td className="px-4 py-3"><Toggle on={d.is_active} label={d.is_active ? 'Active' : 'Hidden'} onClick={() => toggleActive(d)} /></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="Edit" onClick={() => edit(d)}><FontAwesomeIcon icon={faPen} className="w-3 h-3" /></IconButton>
                  <IconButton title="Delete" color={BRAND.red} onClick={() => remove(d.id)}><FontAwesomeIcon icon={faTrash} className="w-3 h-3" /></IconButton>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      </div>
    </AdminLayout>
  );
}
