'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faDownload, faTrash, faUserCheck, faUserMinus, faUsers, faXmark } from '@fortawesome/free-solid-svg-icons';

import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { notify } from '@/components/admin/toast';
import {
  Button, IconButton, SearchInput, StatTile, StatusPill, TableCard, Toolbar,
  confirmAction, downloadCsv, fieldStyle, fmtDate, rowClass, type Tone,
} from '@/components/admin/ui';

type Source = 'footer' | 'popup' | 'landing' | 'other';

interface Subscriber {
  id: string;
  email: string;
  country: string | null;
  source: Source | null;
  is_active: boolean;
  created_at: string;
}

const SOURCE_TONE: Record<Source, Tone> = { footer: 'info', popup: 'warning', landing: 'neutral', other: 'neutral' };

export default function AdminNewsletterPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, country, source, is_active, created_at')
      .order('created_at', { ascending: false });
    if (err) setError('Could not load subscribers.');
    else { setSubscribers((data as Subscriber[]) ?? []); setError(''); }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(sub: Subscriber) {
    setBusyId(sub.id);
    const { error: err } = await supabase.from('newsletter_subscribers').update({ is_active: !sub.is_active }).eq('id', sub.id);
    setBusyId(null);
    if (err) return notify('Could not update the subscriber.');
    setSubscribers((prev) => prev.map((s) => (s.id === sub.id ? { ...s, is_active: !s.is_active } : s)));
  }

  async function remove(sub: Subscriber) {
    if (!(await confirmAction({ message: `Remove ${sub.email} from the newsletter? This cannot be undone.`, danger: true, confirmLabel: 'Remove' }))) return;
    setBusyId(sub.id);
    const { error: err } = await supabase.from('newsletter_subscribers').delete().eq('id', sub.id);
    setBusyId(null);
    if (err) return notify('Could not remove the subscriber.');
    setSubscribers((prev) => prev.filter((s) => s.id !== sub.id));
    notify('Subscriber removed.', 'success');
  }

  const q = search.trim().toLowerCase();
  const visible = subscribers.filter((s) => {
    if (filter === 'active' && !s.is_active) return false;
    if (filter === 'unsubscribed' && s.is_active) return false;
    return !q || s.email.toLowerCase().includes(q) || (s.country ?? '').toLowerCase().includes(q);
  });
  const activeCount = subscribers.filter((s) => s.is_active).length;

  return (
    <AdminLayout title="Newsletter" subtitle="Manage newsletter subscribers">
      <div className="mb-4 grid max-w-md grid-cols-2 gap-3">
        <StatTile icon={faUsers} label="Total subscribers" value={subscribers.length} tone="info" />
        <StatTile icon={faUserCheck} label="Active" value={activeCount} tone="success" />
      </div>

      <Toolbar
        actions={
          <Button variant="secondary" disabled={visible.length === 0} onClick={() => downloadCsv('newsletter-subscribers.csv', ['Email', 'Country', 'Source', 'Status', 'Subscribed'], visible.map((s) => [s.email, s.country, s.source ?? 'other', s.is_active ? 'Active' : 'Unsubscribed', s.created_at]))}>
            <FontAwesomeIcon icon={faDownload} className="mr-2 h-3 w-3" />Export CSV
          </Button>
        }
      >
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-sm" value={search} onChange={setSearch} placeholder="Search email or country" label="Search subscribers" />
        <select aria-label="Filter subscribers" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="px-3 py-2 text-sm" style={fieldStyle}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
      </Toolbar>

      {error ? (
        <p role="alert" className="rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>
      ) : (
        <TableCard
          loading={loading}
          empty={visible.length === 0}
          emptyTitle={subscribers.length === 0 ? 'No subscribers yet' : 'No subscribers match'}
          emptyBody={subscribers.length === 0 ? 'People who sign up in the site footer appear here.' : 'Try a different search or filter.'}
          headers={['Email', 'Country', 'Source', 'Status', 'Subscribed', '']}
        >
          {visible.map((sub) => {
            const busy = busyId === sub.id;
            return (
              <tr key={sub.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--adm-text)' }}>{sub.email}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{sub.country || '-'}</td>
                <td className="px-4 py-3"><StatusPill tone={SOURCE_TONE[sub.source ?? 'other'] ?? 'neutral'}><span className="capitalize">{sub.source || 'other'}</span></StatusPill></td>
                <td className="px-4 py-3"><StatusPill tone={sub.is_active ? 'success' : 'danger'} icon={sub.is_active ? faCheck : faXmark}>{sub.is_active ? 'Active' : 'Unsubscribed'}</StatusPill></td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-muted)' }}>{fmtDate(sub.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <IconButton title={sub.is_active ? 'Unsubscribe' : 'Reactivate'} color={sub.is_active ? 'var(--adm-error)' : 'var(--adm-success)'} disabled={busy} onClick={() => toggleActive(sub)}>
                      <FontAwesomeIcon icon={sub.is_active ? faUserMinus : faCheck} className="h-3 w-3" />
                    </IconButton>
                    <IconButton title="Remove" color="var(--adm-error)" disabled={busy} onClick={() => remove(sub)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </TableCard>
      )}
    </AdminLayout>
  );
}
