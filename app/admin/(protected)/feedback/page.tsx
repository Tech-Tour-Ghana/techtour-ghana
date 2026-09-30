'use client';

// Public suggestions and issue reports. Both tables take anonymous inserts and
// are staff-only to read (0012). Staff triage: status, read flag, and for
// issues the resolution notes.

import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { notify } from '@/components/admin/toast';
import { BRAND, IconButton, StatusSelect, TableCard, Tabs, Toggle, fmtDate, rowClass, useAdminTheme, confirmAction } from '@/components/admin/ui';
import type { Database } from '@/types/database';

type SuggestionStatus = Database['public']['Enums']['suggestion_status'];
type IssueStatus = Database['public']['Enums']['issue_status'];
const SUGGESTION_STATUSES: readonly SuggestionStatus[] = ['pending', 'reviewing', 'approved', 'rejected', 'implemented'];
const ISSUE_STATUSES: readonly IssueStatus[] = ['new', 'in_progress', 'resolved', 'closed', 'wont_fix'];

type Suggestion = Database['public']['Tables']['suggestions']['Row'];
type Issue = Database['public']['Tables']['issue_reports']['Row'];

export default function AdminFeedbackPage() {
  const t = useAdminTheme();
  const [tab, setTab] = useState<'suggestions' | 'issues'>('suggestions');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createBrowserClient();
    const [s, i] = await Promise.all([
      supabase.from('suggestions').select('*').order('created_at', { ascending: false }),
      supabase.from('issue_reports').select('*').order('created_at', { ascending: false }),
    ]);
    setSuggestions(s.data ?? []);
    setIssues(i.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function patchSuggestion(id: string, patch: Partial<Suggestion>) {
    const { error } = await createBrowserClient().from('suggestions').update(patch).eq('id', id);
    if (error) return notify(`Could not update: ${error.message}`);
    setSuggestions((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function patchIssue(id: string, patch: Partial<Issue>) {
    const { error } = await createBrowserClient().from('issue_reports').update(patch).eq('id', id);
    if (error) return notify(`Could not update: ${error.message}`);
    setIssues((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function remove(table: 'suggestions' | 'issue_reports', id: string) {
    if (!(await confirmAction({ message: 'Delete this item? This cannot be undone.', danger: true }))) return;
    const { error } = await createBrowserClient().from(table).delete().eq('id', id);
    if (error) return notify(`Could not delete: ${error.message}`);
    if (table === 'suggestions') setSuggestions((prev) => prev.filter((r) => r.id !== id));
    else setIssues((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <AdminLayout title="Feedback" subtitle="Suggestions and issue reports from visitors">
      <div className="space-y-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'suggestions' as const, label: 'Suggestions', count: suggestions.length },
            { key: 'issues' as const, label: 'Issue reports', count: issues.length },
          ]}
        />

        {tab === 'suggestions' ? (
          <TableCard loading={loading} empty={suggestions.length === 0} headers={['Subject', 'From', 'Category', 'Votes', 'Status', 'Read', 'Date', '']}>
            {suggestions.map((r) => (
              <tr key={r.id} className={rowClass} style={{ borderColor: t.border }}>
                <td className="px-4 py-3 max-w-xs">
                  <p className="font-medium" style={{ color: t.textPrimary }}>{r.subject}</p>
                  <p className="text-xs whitespace-pre-wrap" style={{ color: t.textSecondary }}>{r.message}</p>
                </td>
                <td className="px-4 py-3" style={{ color: t.textSecondary }}>{r.email}</td>
                <td className="px-4 py-3" style={{ color: t.textSecondary }}>{r.category}</td>
                <td className="px-4 py-3" style={{ color: t.textSecondary }}>{r.votes}</td>
                <td className="px-4 py-3">
                  <StatusSelect value={r.status} options={SUGGESTION_STATUSES} onChange={(status) => patchSuggestion(r.id, { status })} />
                </td>
                <td className="px-4 py-3"><Toggle on={r.is_read} label={r.is_read ? 'Read' : 'Unread'} onClick={() => patchSuggestion(r.id, { is_read: !r.is_read })} /></td>
                <td className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>{fmtDate(r.created_at)}</td>
                <td className="px-4 py-3">
                  <IconButton title="Delete" color={BRAND.red} onClick={() => remove('suggestions', r.id)}>
                    <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                  </IconButton>
                </td>
              </tr>
            ))}
          </TableCard>
        ) : (
          <TableCard loading={loading} empty={issues.length === 0} headers={['Issue', 'From', 'Priority', 'Status', 'Resolution notes', 'Read', 'Date', '']}>
            {issues.map((r) => (
              <tr key={r.id} className={rowClass} style={{ borderColor: t.border }}>
                <td className="px-4 py-3 max-w-xs">
                  <p className="font-medium" style={{ color: t.textPrimary }}>{r.subject}</p>
                  <p className="text-xs whitespace-pre-wrap" style={{ color: t.textSecondary }}>{r.description}</p>
                </td>
                <td className="px-4 py-3" style={{ color: t.textSecondary }}>{r.email}{r.phone ? ` / ${r.phone}` : ''}</td>
                <td className="px-4 py-3" style={{ color: t.textSecondary }}>{r.priority}</td>
                <td className="px-4 py-3">
                  <StatusSelect value={r.status} options={ISSUE_STATUSES} onChange={(status) => patchIssue(r.id, { status })} />
                </td>
                <td className="px-4 py-3">
                  <textarea
                    defaultValue={r.resolution_notes}
                    onBlur={(e) => e.target.value !== r.resolution_notes && patchIssue(r.id, { resolution_notes: e.target.value })}
                    rows={2}
                    placeholder="Internal notes"
                    className="px-2 py-1 rounded-lg text-xs w-48"
                    style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textPrimary }}
                  />
                </td>
                <td className="px-4 py-3"><Toggle on={r.is_read} label={r.is_read ? 'Read' : 'Unread'} onClick={() => patchIssue(r.id, { is_read: !r.is_read })} /></td>
                <td className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>{fmtDate(r.created_at)}</td>
                <td className="px-4 py-3">
                  <IconButton title="Delete" color={BRAND.red} onClick={() => remove('issue_reports', r.id)}>
                    <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                  </IconButton>
                </td>
              </tr>
            ))}
          </TableCard>
        )}
      </div>
    </AdminLayout>
  );
}
