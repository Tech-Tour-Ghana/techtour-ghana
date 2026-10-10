'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusPill from '@/components/support/StatusPill';
import { createBrowserClient } from '@/lib/supabase/client';
import { CATEGORY_LABELS, STATUS_META, timeAgo, type SupportMessage, type SupportTicket } from '@/lib/support/meta';

const TICKET_COLUMNS = 'id, ticket_number, subject, category, priority, status, reference, last_activity_at, resolved_at, closed_at, created_at, updated_at, user_id, assigned_to';
const MESSAGE_COLUMNS = 'id, ticket_id, author_id, is_staff, is_internal, body, created_at';
const STEPS = ['Open', 'In progress', 'Resolved'] as const;

function stepIndex(status: SupportTicket['status']) {
  if (status === 'open') return 0;
  if (status === 'in_progress' || status === 'waiting') return 1;
  return 2;
}

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const uid = useId();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);

  const load = useCallback(async (quiet = false) => {
    const supabase = createBrowserClient();
    const [t, m] = await Promise.all([
      supabase.from('support_tickets').select(TICKET_COLUMNS).eq('id', id).maybeSingle(),
      supabase.from('support_messages').select(MESSAGE_COLUMNS).eq('ticket_id', id).order('created_at'),
    ]);
    if (t.error || m.error) { if (!quiet) setFailed(true); }
    else { setFailed(false); setTicket(t.data as SupportTicket | null); setMessages(((m.data ?? []) as SupportMessage[]).filter((x) => !x.is_internal)); }
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void load(true); }, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const act = async (action: 'resolve' | 'reopen' | 'close') => {
    setBusy(true); setError('');
    const { error: e } = await createBrowserClient().rpc('customer_update_support_ticket', { p_ticket_id: id, p_action: action });
    if (e) setError('That did not work. Please try again.');
    setConfirmClose(false);
    await load(true);
    setBusy(false);
  };

  const send = async () => {
    const body = reply.trim();
    if (!body || busy) return;
    setBusy(true); setError('');
    const { error: e } = await createBrowserClient().rpc('reply_support_ticket', { p_ticket_id: id, p_body: body });
    if (e) setError('We could not send your reply. Please try again.');
    else setReply('');
    await load(true);
    setBusy(false);
  };

  const back = <Button variant="accent" size="sm" href="/auth/support">Back to help</Button>;

  if (loading) {
    return <DashboardLayout title="Help" subtitle="Ticket"><p role="status" className="py-12 text-center text-sm" style={{ color: 'var(--brand-text-2)' }}>Loading ticket...</p></DashboardLayout>;
  }
  if (failed || !ticket) {
    return (
      <DashboardLayout title="Help" subtitle="Ticket">
        <div role="alert" className="text-center py-12">
          <p className="mb-4 text-sm" style={{ color: 'var(--brand-text-2)' }}>{failed ? 'We could not load this ticket. Please try again.' : 'We could not find that ticket. It may not belong to your account.'}</p>
          {failed ? <Button variant="accent" size="sm" onClick={() => void load()}>Try again</Button> : back}
        </div>
      </DashboardLayout>
    );
  }

  const meta = STATUS_META[ticket.status];
  const closed = ticket.status === 'closed';
  const step = stepIndex(ticket.status);
  const card = { background: 'var(--brand-card)', border: '1px solid var(--brand-line)' };

  return (
    <DashboardLayout title="Help" subtitle={ticket.ticket_number}>
      <div className="mb-4">{back}</div>

      <section className="rounded-2xl p-5 mb-4" style={card} aria-labelledby={`${uid}-h`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--brand-muted)' }}>{ticket.ticket_number}</span>
          <StatusPill status={ticket.status} />
        </div>
        <h2 id={`${uid}-h`} className="mt-1 text-lg font-semibold break-words" style={{ color: 'var(--brand-text)' }}>{ticket.subject}</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--brand-text-2)' }}>{meta.customerHint}</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--brand-muted)' }}>
          {CATEGORY_LABELS[ticket.category]}{ticket.reference ? ` · Ref: ${ticket.reference}` : ''}
        </p>

        <ol className="mt-4 flex items-start" aria-label="Ticket progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1 text-center" aria-current={i === step ? 'step' : undefined}>
              <div className="h-1.5 rounded-full mx-0.5" style={{ background: i <= step ? 'var(--brand-teal)' : 'var(--brand-line)' }} />
              <span className="mt-1 block text-xs" style={{ color: i === step ? 'var(--brand-text)' : 'var(--brand-muted)', fontWeight: i === step ? 600 : 400 }}>
                {label}{i === step ? ' (current)' : ''}
              </span>
            </li>
          ))}
        </ol>
        {ticket.status === 'waiting' && <p className="mt-2 text-sm font-medium" style={{ color: 'var(--brand-purple)' }}>We are waiting on your reply to continue.</p>}

        <div className="mt-4 flex flex-wrap gap-3">
          {ticket.status === 'resolved' && <Button variant="accent" size="sm" loading={busy} onClick={() => void act('reopen')}>Reopen</Button>}
          {!closed && ticket.status !== 'resolved' && <Button variant="accent" size="sm" loading={busy} onClick={() => void act('resolve')}>Mark as resolved</Button>}
          {!closed && !confirmClose && <Button variant="secondary" size="sm" arrow={false} disabled={busy} onClick={() => setConfirmClose(true)} style={{ color: 'var(--brand-text-2)' }}>Close ticket</Button>}
        </div>
        {confirmClose && (
          <div role="alertdialog" aria-label="Confirm close" className="mt-3 rounded-xl p-3" style={{ border: '1px solid var(--brand-line)' }}>
            <p className="text-sm mb-3" style={{ color: 'var(--brand-text)' }}>Close this ticket? You will not be able to reply afterwards.</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="danger" size="sm" loading={busy} onClick={() => void act('close')}>Yes, close it</Button>
              <Button variant="secondary" size="sm" arrow={false} onClick={() => setConfirmClose(false)} style={{ color: 'var(--brand-text-2)' }}>Keep open</Button>
            </div>
          </div>
        )}
      </section>

      <ul className="space-y-3 mb-4" aria-label="Messages">
        {messages.map((m) => (
          <li key={m.id} className={`flex ${m.is_staff ? 'justify-start' : 'justify-end'}`}>
            <div
              className="max-w-[88%] rounded-2xl px-4 py-3"
              style={m.is_staff
                ? { ...card }
                : { background: 'rgba(var(--brand-teal-rgb), 0.12)', border: '1px solid rgba(var(--brand-teal-rgb), 0.3)' }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: m.is_staff ? 'var(--brand-teal)' : 'var(--brand-text-2)' }}>{m.is_staff ? 'TechTour support' : 'You'}</p>
              <p className="text-sm whitespace-pre-wrap break-words" style={{ color: 'var(--brand-text)' }}>{m.body}</p>
              <time className="mt-1 block text-xs" dateTime={m.created_at} title={new Date(m.created_at).toLocaleString('en-GB')} style={{ color: 'var(--brand-muted)' }}>{timeAgo(m.created_at)}</time>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl p-4" style={card}>
        <label htmlFor={`${uid}-reply`} className="block text-sm font-medium mb-1" style={{ color: 'var(--brand-text-2)' }}>Your reply</label>
        <textarea
          id={`${uid}-reply`}
          value={reply}
          disabled={closed}
          rows={4}
          placeholder={closed ? 'This ticket is closed. Raise a new ticket if you need more help.' : 'Write your reply'}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void send(); } }}
          className="w-full rounded-xl px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
          style={{ background: 'var(--brand-bg)', color: 'var(--brand-text)', border: '1px solid var(--brand-line)' }}
        />
        <div aria-live="polite">{error && <p role="alert" className="mt-2 text-sm" style={{ color: 'var(--brand-error)' }}>{error}</p>}</div>
        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs" style={{ color: 'var(--brand-muted)' }}>Ctrl or Cmd + Enter to send</span>
          <Button variant="accent" size="sm" loading={busy} disabled={closed || !reply.trim()} onClick={() => void send()}>Send reply</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
