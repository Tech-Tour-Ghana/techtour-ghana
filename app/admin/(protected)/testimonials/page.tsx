'use client';

// Customer testimonials shown on the homepage. Public reads active rows, admin
// writes (testimonials_*_admin policies).

import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { BRAND, IconButton, TableCard, Toggle, fmtDate, rowClass, useAdminTheme } from '@/components/admin/ui';
import type { Database } from '@/types/database';

type Testimonial = Database['public']['Tables']['testimonials']['Row'];
const EMPTY = { author_name: '', author_position: '', content: '', rating: 5 };

export default function AdminTestimonialsPage() {
  const t = useAdminTheme();
  const [rows, setRows] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await createBrowserClient().from('testimonials').select('*').order('created_at', { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function patch(id: string, change: Partial<Testimonial>) {
    const { error } = await createBrowserClient().from('testimonials').update(change).eq('id', id);
    if (error) return window.alert(`Could not update: ${error.message}`);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...change } : r)));
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this testimonial? This cannot be undone.')) return;
    const { error } = await createBrowserClient().from('testimonials').delete().eq('id', id);
    if (error) return window.alert(`Could not delete: ${error.message}`);
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await createBrowserClient().from('testimonials').insert({
      author_name: form.author_name.trim(),
      author_position: form.author_position.trim(),
      content: form.content.trim(),
      rating: form.rating,
    });
    setSaving(false);
    if (error) return window.alert(`Could not add: ${error.message}`);
    setForm(EMPTY);
    load();
  }

  const input = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textPrimary };

  return (
    <AdminLayout title="Testimonials" subtitle="Customer quotes shown on the homepage">
      <div className="space-y-4">
        <form onSubmit={add} className="rounded-xl p-4 grid gap-3 md:grid-cols-4" style={{ background: t.cardBg, border: `1px solid ${t.border}` }}>
          <input required value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} placeholder="Author name" className="px-3 py-2 rounded-lg text-sm" style={input} />
          <input value={form.author_position} onChange={(e) => setForm({ ...form, author_position: e.target.value })} placeholder="Position or location" className="px-3 py-2 rounded-lg text-sm" style={input} />
          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm" style={input}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
          </select>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60" style={{ background: BRAND.teal }}>
            {saving ? 'Adding...' : 'Add testimonial'}
          </button>
          <textarea required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="What they said" rows={2} className="md:col-span-4 px-3 py-2 rounded-lg text-sm" style={input} />
        </form>

        <TableCard loading={loading} empty={rows.length === 0} headers={['Author', 'Quote', 'Rating', 'Active', 'Featured', 'Date', '']}>
          {rows.map((r) => (
            <tr key={r.id} className={rowClass} style={{ borderColor: t.border }}>
              <td className="px-4 py-3">
                <p className="font-medium" style={{ color: t.textPrimary }}>{r.author_name}</p>
                <p className="text-xs" style={{ color: t.textMuted }}>{r.author_position}</p>
              </td>
              <td className="px-4 py-3 max-w-md text-xs" style={{ color: t.textSecondary }}>{r.content}</td>
              <td className="px-4 py-3" style={{ color: t.textSecondary }}>{r.rating}/5</td>
              <td className="px-4 py-3"><Toggle on={r.is_active} label={r.is_active ? 'Active' : 'Hidden'} onClick={() => patch(r.id, { is_active: !r.is_active })} /></td>
              <td className="px-4 py-3"><Toggle on={r.is_featured} label={r.is_featured ? 'Featured' : 'Standard'} onClick={() => patch(r.id, { is_featured: !r.is_featured })} /></td>
              <td className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>{fmtDate(r.created_at)}</td>
              <td className="px-4 py-3">
                <IconButton title="Delete" color={BRAND.red} onClick={() => remove(r.id)}>
                  <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                </IconButton>
              </td>
            </tr>
          ))}
        </TableCard>
      </div>
    </AdminLayout>
  );
}
