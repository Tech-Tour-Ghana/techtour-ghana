'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusPill from '@/components/support/StatusPill';
import NewTicketDialog from '@/components/support/NewTicketDialog';
import { createBrowserClient } from '@/lib/supabase/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLifeRing } from '@fortawesome/free-solid-svg-icons';
import { CATEGORY_LABELS, timeAgo, type SupportTicket } from '@/lib/support/meta';

type Filter = 'all' | 'open' | 'done';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'done', label: 'Resolved' },
];
const COLUMNS = 'id, ticket_number, subject, category, priority, status, reference, last_activity_at, resolved_at, closed_at, created_at, updated_at, user_id, assigned_to';

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [dialog, setDialog] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    setLoading(true);
    const { data, error } = await createBrowserClient().from('support_tickets').select(COLUMNS).order('last_activity_at', { ascending: false });
    if (error) setFailed(true);
    else setTickets((data ?? []) as SupportTicket[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const shown = tickets.filter((t) => {
    const done = t.status === 'resolved' || t.status === 'closed';
    return filter === 'all' || (filter === 'done' ? done : !done);
  });

  const card = { background: 'var(--brand-card)', border: '1px solid var(--brand-line)' };

  return (
    <DashboardLayout title="Help" subtitle="Raise a ticket and follow its progress">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter tickets">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className="px-4 min-h-[44px] text-sm rounded-full transition-all duration-200"
              style={{
                background: filter === f.key ? 'var(--brand-teal)' : 'transparent',
                color: filter === f.key ? 'var(--brand-white)' : 'var(--brand-text-2)',
                border: `1px solid ${filter === f.key ? 'var(--brand-teal)' : 'var(--brand-line)'}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button variant="accent" size="sm" onClick={() => setDialog(true)}>New ticket</Button>
      </div>

      {loading ? (
        <p role="status" className="py-12 text-center text-sm" style={{ color: 'var(--brand-text-2)' }}>Loading tickets...</p>
      ) : failed ? (
        <div role="alert" className="text-center py-12">
          <p className="mb-4 text-sm" style={{ color: 'var(--brand-text-2)' }}>We could not load your tickets. Please try again.</p>
          <Button variant="accent" size="sm" onClick={() => void load()}>Try again</Button>
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={card}>
          <FontAwesomeIcon icon={faLifeRing} className="text-5xl mb-4" style={{ color: 'var(--brand-muted)' }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>{tickets.length ? 'No tickets here' : 'No tickets yet'}</h3>
          <p className="text-sm" style={{ color: 'var(--brand-text-2)' }}>Need a hand with a booking, payment or order? Raise a ticket and our team will reply here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((t) => {
            const waiting = t.status === 'waiting';
            return (
              <li key={t.id}>
                <Link
                  href={`/auth/support/${t.id}`}
                  className="block rounded-2xl p-4 min-h-[44px] transition-all duration-200 hover:shadow-lg focus-visible:outline focus-visible:outline-2"
                  style={{ ...card, ...(waiting ? { border: '2px solid var(--brand-purple)' } : {}) }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--brand-muted)' }}>{t.ticket_number}</span>
                    <StatusPill status={t.status} />
                  </div>
                  <p className="mt-1 font-semibold break-words" style={{ color: 'var(--brand-text)' }}>{t.subject}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--brand-text-2)' }}>
                    {CATEGORY_LABELS[t.category]} &middot; <time dateTime={t.last_activity_at}>Updated {timeAgo(t.last_activity_at)}</time>
                  </p>
                  {waiting && <p className="mt-2 text-sm font-medium" style={{ color: 'var(--brand-purple)' }}>We need a reply from you.</p>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {dialog && <NewTicketDialog onClose={() => setDialog(false)} />}
    </DashboardLayout>
  );
}
