'use client';

// Study abroad applications shown to customers on /auth/study. There is no
// public application form yet, so staff record and update them here. Admin
// insert, update and delete are allowed by the study_applications policies
// (migration 0016).

import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { BRAND, IconButton, StatusSelect, TableCard, fmtDate, rowClass, useAdminTheme } from '@/components/admin/ui';

const STATUSES = ['pending', 'approved', 'rejected', 'completed'] as const;
type Status = (typeof STATUSES)[number];

interface Customer {
  id: string;
  email: string;
}
interface Application {
  id: string;
  program_name: string;
  university: string;
  location: string;
  start_date: string | null;
  duration: string;
  status: string;
  created_at: string;
  profiles: { email: string } | null;
}

const EMPTY = { user_id: '', program_name: '', university: '', location: '', start_date: '', duration: '' };

export default function AdminApplicationsPage() {
  const t = useAdminTheme();
  const [apps, setApps] = useState<Application[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    const supabase = createBrowserClient();
    const [a, c] = await Promise.all([
      supabase
        .from('study_applications')
        .select('id, program_name, university, location, start_date, duration, status, created_at, profiles(email)')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, email').eq('is_admin', false).order('email'),
    ]);
    setApps((a.data as unknown as Application[]) ?? []);
    setCustomers(c.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createBrowserClient().from('study_applications').insert({
      user_id: form.user_id,
      program_name: form.program_name.trim(),
      university: form.university.trim(),
      location: form.location.trim(),
      start_date: form.start_date || null,
      duration: form.duration.trim(),
    });
    if (error) return window.alert(`Could not add: ${error.message}`);
    setForm(EMPTY);
    load();
  }

  async function setStatus(id: string, status: Status) {
    const { error } = await createBrowserClient().from('study_applications').update({ status }).eq('id', id);
    if (error) return window.alert(`Could not update: ${error.message}`);
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this application? This cannot be undone.')) return;
    const { error } = await createBrowserClient().from('study_applications').delete().eq('id', id);
    if (error) return window.alert(`Could not delete: ${error.message}`);
    setApps((prev) => prev.filter((a) => a.id !== id));
  }

  const input = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textPrimary };
  const cls = 'px-3 py-2 rounded-lg text-sm';

  return (
    <AdminLayout title="Study Applications" subtitle="Applications customers see under Study in their account">
      <div className="space-y-4">
        <form onSubmit={add} className="rounded-xl p-4 grid gap-3 md:grid-cols-3" style={{ background: t.cardBg, border: `1px solid ${t.border}` }}>
          <select required value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className={cls} style={input} aria-label="Customer">
            <option value="">Choose a customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.email}</option>)}
          </select>
          <input required value={form.program_name} onChange={(e) => setForm({ ...form, program_name: e.target.value })} placeholder="Programme" className={cls} style={input} />
          <input value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} placeholder="University" className={cls} style={input} />
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" className={cls} style={input} />
          <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={cls} style={input} aria-label="Start date" />
          <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Duration, e.g. 2 years" className={cls} style={input} />
          <div className="md:col-span-3">
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: BRAND.teal }}>Add application</button>
          </div>
        </form>

        <TableCard loading={loading} empty={apps.length === 0} headers={['Customer', 'Programme', 'University', 'Starts', 'Status', 'Created', '']}>
          {apps.map((a) => (
            <tr key={a.id} className={rowClass} style={{ borderColor: t.border }}>
              <td className="px-4 py-3" style={{ color: t.textSecondary }}>{a.profiles?.email ?? '-'}</td>
              <td className="px-4 py-3 font-medium" style={{ color: t.textPrimary }}>{a.program_name}</td>
              <td className="px-4 py-3" style={{ color: t.textSecondary }}>{[a.university, a.location].filter(Boolean).join(', ') || '-'}</td>
              <td className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>{a.start_date ? fmtDate(a.start_date) : '-'}</td>
              <td className="px-4 py-3">
                <StatusSelect value={(STATUSES as readonly string[]).includes(a.status) ? (a.status as Status) : 'pending'} options={STATUSES} onChange={(s) => setStatus(a.id, s)} />
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>{fmtDate(a.created_at)}</td>
              <td className="px-4 py-3">
                <IconButton title="Delete" color={BRAND.red} onClick={() => remove(a.id)}>
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
