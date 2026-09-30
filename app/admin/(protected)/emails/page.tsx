'use client';

// Email log: every email the site sends (welcome, contact, order confirmation),
// written by lib/email/send.server.ts. Admin read only (email_log_select_admin).

import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { BRAND, IconButton, TableCard, Tabs, rowClass, useAdminTheme, Modal } from '@/components/admin/ui';

interface EmailRow {
  id: string;
  template_name: string;
  recipient: string;
  subject: string;
  content: string;
  status: string;
  error_message: string;
  sent_at: string | null;
  created_at: string;
}

const PAGE = 100;
type Filter = 'all' | 'sent' | 'failed';

const fmtTime = (s: string) =>
  new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AdminEmailsPage() {
  const t = useAdminTheme();
  const [rows, setRows] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<EmailRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (from: number) => {
      let query = createBrowserClient()
        .from('email_log')
        .select('id, template_name, recipient, subject, content, status, error_message, sent_at, created_at')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1);
      if (filter !== 'all') query = query.eq('status', filter);
      const { data, error: err } = await query;
      if (err) return setError(err.message);
      const next = data ?? [];
      setRows((prev) => (from === 0 ? next : [...prev, ...next]));
      setMore(next.length === PAGE);
      setLoading(false);
    },
    [filter],
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    load(0);
  }, [load]);

  return (
    <AdminLayout title="Email Log" subtitle="Emails the site has sent">
      <div className="space-y-4">
        <Tabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { key: 'all' as const, label: 'All' },
            { key: 'sent' as const, label: 'Sent' },
            { key: 'failed' as const, label: 'Failed' },
          ]}
        />

        {error ? (
          <p className="text-sm" style={{ color: '#EF4444' }}>Could not load the email log: {error}</p>
        ) : (
          <TableCard loading={loading} empty={rows.length === 0} headers={['When', 'To', 'Type', 'Subject', 'Status', '']}>
            {rows.map((r) => (
              <tr key={r.id} className={rowClass} style={{ borderColor: t.border }}>
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: t.textMuted }}>{fmtTime(r.sent_at ?? r.created_at)}</td>
                <td className="px-4 py-3" style={{ color: t.textSecondary }}>{r.recipient}</td>
                <td className="px-4 py-3" style={{ color: t.textSecondary }}>{r.template_name}</td>
                <td className="px-4 py-3 max-w-xs truncate" style={{ color: t.textPrimary }}>{r.subject}</td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={r.status === 'failed' ? { background: '#EF444422', color: '#EF4444' } : { background: '#10B98122', color: '#10B981' }}
                    title={r.error_message || undefined}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <IconButton title="View email" onClick={() => setView(r)}>
                    <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                  </IconButton>
                </td>
              </tr>
            ))}
          </TableCard>
        )}

        {more && (
          <button onClick={() => load(rows.length)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: t.chipBg, color: t.textSecondary }}>
            Load more
          </button>
        )}
      </div>

      {view && (
        <Modal title={view.subject} subtitle={`To ${view.recipient}`} maxWidth="max-w-2xl" onClose={() => setView(null)}
          footer={
            <>
              <button onClick={() => setView(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: BRAND.teal }}>Close</button>
            
            </>
          }
        >
<div className="space-y-4">
            {view.error_message && <p className="text-xs" style={{ color: 'var(--adm-error)' }}>{view.error_message}</p>}
            {/* sandbox="" so nothing inside a stored email can run scripts or navigate. */}
            <iframe title="Email content" sandbox="" srcDoc={view.content} className="min-h-[320px] w-full rounded-lg bg-white" />
            
          
</div>
        </Modal>
      )}
    </AdminLayout>
  );
}
