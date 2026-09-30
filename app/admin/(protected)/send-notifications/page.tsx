'use client';

// Send in-app notifications to one customer or to all active customers, and see
// what was sent. Customers read them on /auth/notifications and in the account
// bell. Admins may insert into public.notifications (migration 0021).

import { useCallback, useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { BRAND, TableCard, fmtDate, rowClass, useAdminTheme, confirmAction } from '@/components/admin/ui';

type NoteType = 'general' | 'order' | 'tour' | 'promotion' | 'wishlist';
const TYPES: NoteType[] = ['general', 'order', 'tour', 'promotion', 'wishlist'];

interface Customer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}
interface Sent {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  profiles: { email: string } | null;
}

export default function AdminSendNotificationsPage() {
  const t = useAdminTheme();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sent, setSent] = useState<Sent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState({ to: 'all', type: 'general' as NoteType, title: '', message: '' });

  const load = useCallback(async () => {
    const supabase = createBrowserClient();
    const [c, s] = await Promise.all([
      supabase.from('profiles').select('id, email, first_name, last_name').eq('is_admin', false).eq('is_active', true).order('email'),
      supabase
        .from('notifications')
        .select('id, type, title, message, is_read, created_at, profiles(email)')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);
    setCustomers(c.data ?? []);
    setSent((s.data as unknown as Sent[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const recipients = form.to === 'all' ? customers : customers.filter((c) => c.id === form.to);
    if (recipients.length === 0) return setStatus({ ok: false, text: 'There is nobody to send this to.' });
    if (form.to === 'all' && !(await confirmAction({ message: `Send this to all ${recipients.length} active customers?`, confirmLabel: 'Send' }))) return;

    setBusy(true);
    setStatus(null);
    const supabase = createBrowserClient();
    const rows = recipients.map((c) => ({ user_id: c.id, type: form.type, title: form.title.trim(), message: form.message.trim() }));
    let failed = '';
    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await supabase.from('notifications').insert(rows.slice(i, i + 100));
      if (error) {
        failed = error.message;
        break;
      }
    }
    setBusy(false);
    if (failed) return setStatus({ ok: false, text: `Could not send: ${failed}` });
    setStatus({ ok: true, text: `Sent to ${recipients.length} ${recipients.length === 1 ? 'customer' : 'customers'}.` });
    setForm({ ...form, title: '', message: '' });
    load();
  }

  const input = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textPrimary };
  const cls = 'px-3 py-2 rounded-lg text-sm';

  return (
    <AdminLayout title="Send Notifications" subtitle="Message customers inside their account">
      <div className="space-y-4">
        <form onSubmit={send} className="rounded-xl p-4 grid gap-3 md:grid-cols-3" style={{ background: t.cardBg, border: `1px solid ${t.border}` }}>
          <select value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} className={cls} style={input} aria-label="Recipient">
            <option value="all">All active customers ({customers.length})</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{[c.first_name, c.last_name].filter(Boolean).join(' ') || c.email} ({c.email})</option>
            ))}
          </select>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as NoteType })} className={cls} style={input} aria-label="Type">
            {TYPES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" maxLength={120} className={cls} style={input} />
          <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Message" rows={3} maxLength={500} className={`${cls} md:col-span-3`} style={input} />
          <div className="md:col-span-3 flex items-center gap-3">
            <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60" style={{ background: BRAND.teal }}>
              {busy ? 'Sending...' : 'Send notification'}
            </button>
            {status && <span className="text-sm" style={{ color: status.ok ? 'var(--adm-success)' : 'var(--adm-error)' }}>{status.text}</span>}
          </div>
        </form>

        <TableCard loading={loading} empty={sent.length === 0} headers={['Sent', 'To', 'Type', 'Title', 'Read']}>
          {sent.map((n) => (
            <tr key={n.id} className={rowClass} style={{ borderColor: t.border }}>
              <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: t.textMuted }}>{fmtDate(n.created_at)}</td>
              <td className="px-4 py-3" style={{ color: t.textSecondary }}>{n.profiles?.email ?? '-'}</td>
              <td className="px-4 py-3" style={{ color: t.textSecondary }}>{n.type}</td>
              <td className="px-4 py-3 max-w-xs" style={{ color: t.textPrimary }}>
                <p className="font-medium truncate">{n.title}</p>
                <p className="text-xs truncate" style={{ color: t.textMuted }}>{n.message}</p>
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: n.is_read ? 'var(--adm-success)' : t.textMuted }}>{n.is_read ? 'Read' : 'Unread'}</td>
            </tr>
          ))}
        </TableCard>
      </div>
    </AdminLayout>
  );
}
