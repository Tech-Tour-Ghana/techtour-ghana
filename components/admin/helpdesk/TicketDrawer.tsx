'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

import { createBrowserClient } from '@/lib/supabase/client';
import { notify } from '@/components/admin/toast';
import { Button, ListSkeleton, fieldStyle, fmtDate, reportError } from '@/components/admin/ui';
import {
  CATEGORY_LABELS, PRIORITY_META, STATUS_META, TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES, timeAgo,
  type SupportMessage, type TicketCategory, type TicketPriority, type TicketStatus,
} from '@/lib/support/meta';
import { MIN_TAP, personName, soft, type AdminTicket, type AdminUser } from './types';

const CANNED = [
  'We are looking into this and will update you shortly.',
  'Thanks for getting in touch. Could you share a few more details so we can help?',
  'We have fixed this on our side. Please try again and tell us if it still happens.',
  'Your payment has been confirmed and your booking is up to date.',
  'Thank you for your patience. We are marking this as resolved, reply here if you need anything else.',
];

export type TicketPatch = Partial<Pick<AdminTicket, 'status' | 'priority' | 'category' | 'assigned_to'>>;

const focusSel = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

export default function TicketDrawer({
  ticket,
  admins,
  meId,
  onClose,
  onPatch,
  onChanged,
}: {
  ticket: AdminTicket;
  admins: AdminUser[];
  meId: string | null;
  onClose: () => void;
  onPatch: (t: AdminTicket, patch: TicketPatch) => void;
  onChanged: () => void;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'reply' | 'note'>('reply');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const loadThread = useCallback(async () => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('id, ticket_id, author_id, is_staff, is_internal, body, created_at')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });
    if (!reportError(error)) setMessages((data as SupportMessage[]) ?? []);
    setLoading(false);
  }, [supabase, ticket.id]);

  useEffect(() => { void loadThread(); }, [loadThread]);

  // Focus trap, Escape, and focus restore. Yields to a confirm dialog opened on top.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>('textarea')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelectorAll('[role="dialog"]').length > 1) return;
      if (e.key === 'Escape') { closeRef.current(); return; }
      if (e.key !== 'Tab' || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(focusSel));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); opener?.focus?.(); };
  }, []);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/helpdesk/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id, body, internal: mode === 'note' }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; errors?: Record<string, string> };
      if (!res.ok || !json.ok) {
        notify(json.error ?? (json.errors ? Object.values(json.errors).join(' ') : 'Could not send the reply.'));
        return;
      }
      setText('');
      notify(mode === 'note' ? 'Internal note added.' : 'Reply sent.', 'success');
      await loadThread();
      onChanged();
    } catch {
      notify('Could not send the reply. Check your connection.');
    } finally {
      setSending(false);
    }
  }

  const select = (label: string, value: string, onChange: (v: string) => void, options: { value: string; label: string }[]) => (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${MIN_TAP} w-full px-2 text-sm`} style={fieldStyle}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );

  const assigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...admins.map((a) => ({ value: a.id, label: personName(a) + (a.id === meId ? ' (me)' : '') })),
  ];
  const note = mode === 'note';

  return (
    <div className="fixed inset-0 z-40 flex" style={{ background: 'var(--adm-overlay)' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={`Ticket ${ticket.ticket_number}`}
        className="ml-auto flex h-full w-full flex-col sm:max-w-xl"
        style={{ background: 'var(--adm-card)', borderLeft: '1px solid var(--adm-border)', color: 'var(--adm-text)' }}
      >
        <header className="flex items-start gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--adm-border)' }}>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold" style={{ color: 'var(--adm-muted)' }}>{ticket.ticket_number} · opened {fmtDate(ticket.created_at)}</p>
            <h2 className="break-words text-base font-bold">{ticket.subject}</h2>
            <p className="break-words text-xs" style={{ color: 'var(--adm-text-2)' }}>
              {personName(ticket.customer, 'Unknown customer')}
              {ticket.customer?.email && <> · <a href={`mailto:${ticket.customer.email}`} className="font-semibold underline" style={{ color: 'var(--adm-primary)' }}>{ticket.customer.email}</a></>}
            </p>
            {ticket.reference && <p className="mt-1 text-xs" style={{ color: 'var(--adm-text-2)' }}>Reference: <span className="font-semibold">{ticket.reference}</span></p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close ticket" className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--adm-track)', color: 'var(--adm-text-2)' }}>
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-3 border-b p-4 min-[420px]:grid-cols-2" style={{ borderColor: 'var(--adm-border)' }}>
            {select('Status', ticket.status, (v) => onPatch(ticket, { status: v as TicketStatus }), TICKET_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label })))}
            {select('Priority', ticket.priority, (v) => onPatch(ticket, { priority: v as TicketPriority }), TICKET_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label })))}
            {select('Category', ticket.category, (v) => onPatch(ticket, { category: v as TicketCategory }), TICKET_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })))}
            <div className="min-w-0">
              {select('Assignee', ticket.assigned_to ?? '', (v) => onPatch(ticket, { assigned_to: v || null }), assigneeOptions)}
              {meId && ticket.assigned_to !== meId && (
                <button type="button" onClick={() => onPatch(ticket, { assigned_to: meId })} className="mt-1 min-h-[44px] text-xs font-semibold underline" style={{ color: 'var(--adm-primary)' }}>
                  Assign to me
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 p-4" aria-live="polite">
            {loading ? <ListSkeleton rows={3} /> : messages.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--adm-muted)' }}>No messages yet.</p>
            ) : messages.map((m) => {
              const internal = m.is_internal;
              return (
                <div
                  key={m.id}
                  className={`max-w-[92%] rounded-[var(--adm-radius-control)] p-3 ${m.is_staff ? 'ml-auto' : ''}`}
                  style={{
                    background: internal ? soft('var(--brand-warning)', 16) : m.is_staff ? 'var(--adm-primary-soft)' : 'var(--adm-bg)',
                    border: internal ? '1px dashed var(--brand-warning)' : '1px solid var(--adm-border)',
                  }}
                >
                  {internal && <p className="mb-1 text-[11px] font-bold uppercase tracking-wide">Internal note, not visible to the customer</p>}
                  <p className="text-[11px] font-semibold" style={{ color: 'var(--adm-muted)' }}>
                    {m.is_staff ? (internal ? 'Staff note' : 'Staff reply') : 'Customer'} · {timeAgo(m.created_at)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm">{m.body}</p>
                </div>
              );
            })}
          </div>
        </div>

        <footer className="border-t p-4" style={{ borderColor: 'var(--adm-border)' }}>
          <div role="group" aria-label="Message type" className="mb-2 inline-flex rounded-[var(--adm-radius-control)] p-1" style={{ background: 'var(--adm-track)' }}>
            {([['reply', 'Reply to customer'], ['note', 'Internal note']] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={mode === key}
                onClick={() => setMode(key)}
                className="min-h-[44px] rounded-lg px-3 text-xs font-semibold"
                style={{ background: mode === key ? 'var(--adm-card)' : 'transparent', color: mode === key ? 'var(--adm-primary)' : 'var(--adm-text-2)', boxShadow: mode === key ? 'var(--adm-shadow)' : 'none' }}
              >
                {label}
              </button>
            ))}
          </div>
          {note && <p className="mb-2 text-xs font-semibold">Internal note, not visible to the customer</p>}
          <label className="mb-2 block">
            <span className="sr-only">Canned replies</span>
            <select
              value=""
              onChange={(e) => e.target.value && setText((t) => (t ? `${t}\n${e.target.value}` : e.target.value))}
              className={`${MIN_TAP} w-full px-2 text-xs`}
              style={fieldStyle}
            >
              <option value="">Insert a canned reply…</option>
              {CANNED.map((c) => <option key={c} value={c}>{c.length > 60 ? `${c.slice(0, 57)}...` : c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">{note ? 'Internal note' : 'Reply to customer'}</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void send(); } }}
              rows={4}
              maxLength={5000}
              placeholder={note ? 'Write a note for the team' : 'Write a reply. The customer is emailed.'}
              className="w-full p-3 text-sm"
              style={fieldStyle}
            />
          </label>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>Ctrl or Cmd + Enter to send</span>
            <Button onClick={() => void send()} disabled={sending || !text.trim()} className={MIN_TAP}>
              {sending ? 'Sending…' : note ? 'Add note' : 'Send reply'}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
