'use client';

// Audit log of staff changes, written by database triggers (migration 0021).
// It records who changed what and which columns, never the values.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { TableCard, fmtDate, rowClass, useAdminTheme } from '@/components/admin/ui';

interface AuditRow {
  id: string;
  action: 'insert' | 'update' | 'delete';
  table_name: string;
  record_id: string;
  summary: string;
  changed_columns: string[];
  created_at: string;
  profiles: { email: string } | null;
}

const PAGE = 100;
const ACTION_COLOR = { insert: 'var(--adm-success)', update: 'var(--adm-primary)', delete: 'var(--adm-error)' } as const;

const fmtTime = (s: string) =>
  new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function AdminAuditPage() {
  const t = useAdminTheme();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [tableFilter, setTableFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (from: number) => {
      let query = createBrowserClient()
        .from('audit_log')
        .select('id, action, table_name, record_id, summary, changed_columns, created_at, profiles(email)')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1);
      if (tableFilter !== 'all') query = query.eq('table_name', tableFilter);
      const { data, error: err } = await query;
      if (err) return setError(err.message);
      const next = (data as unknown as AuditRow[]) ?? [];
      setRows((prev) => (from === 0 ? next : [...prev, ...next]));
      setMore(next.length === PAGE);
      setLoading(false);
    },
    [tableFilter],
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    load(0);
  }, [load]);

  const tables = useMemo(() => [...new Set(rows.map((r) => r.table_name))].sort(), [rows]);

  return (
    <AdminLayout title="Audit Log" subtitle="Who changed what in the admin">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textPrimary }}
            aria-label="Filter by table"
          >
            <option value="all">All tables</option>
            {tableFilter !== 'all' && !tables.includes(tableFilter) && <option value={tableFilter}>{tableFilter}</option>}
            {tables.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <p className="text-xs" style={{ color: t.textMuted }}>Column names only, values are never stored.</p>
        </div>

        {error ? (
          <p className="text-sm" style={{ color: 'var(--adm-error)' }}>Could not load the audit log: {error}</p>
        ) : (
          <TableCard loading={loading} empty={rows.length === 0} headers={['When', 'Who', 'Action', 'Table', 'Item', 'Changed']}>
            {rows.map((r) => (
              <tr key={r.id} className={rowClass} style={{ borderColor: t.border }}>
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: t.textMuted }} title={fmtDate(r.created_at)}>{fmtTime(r.created_at)}</td>
                <td className="px-4 py-3" style={{ color: t.textSecondary }}>{r.profiles?.email ?? 'Unknown'}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: `${ACTION_COLOR[r.action]}22`, color: ACTION_COLOR[r.action] }}>{r.action}</span>
                </td>
                <td className="px-4 py-3" style={{ color: t.textSecondary }}>{r.table_name}</td>
                <td className="px-4 py-3 max-w-xs truncate" style={{ color: t.textPrimary }} title={r.record_id}>{r.summary || r.record_id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>{r.changed_columns.join(', ')}</td>
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
    </AdminLayout>
  );
}
