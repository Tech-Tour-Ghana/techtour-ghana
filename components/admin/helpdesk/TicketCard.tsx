'use client';

import { CATEGORY_LABELS, PRIORITY_META, STATUS_META, TICKET_STATUSES, timeAgo, type TicketStatus } from '@/lib/support/meta';
import { MIN_TAP, initials, personName, soft, type AdminTicket } from './types';

export default function TicketCard({
  ticket,
  onOpen,
  onMove,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  ticket: AdminTicket;
  onOpen: () => void;
  onMove: (status: TicketStatus) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  dragging: boolean;
}) {
  const pr = PRIORITY_META[ticket.priority];
  const unanswered = ticket.staff_replies === 0 && ticket.status !== 'closed';

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', ticket.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className="cursor-grab rounded-[var(--adm-radius-control)] p-3 active:cursor-grabbing"
      style={{
        background: 'var(--adm-card)',
        border: '1px solid var(--adm-border)',
        borderLeft: `4px solid ${pr.color}`,
        boxShadow: 'var(--adm-shadow)',
        opacity: dragging ? 0.5 : 1,
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        className={`block w-full text-left ${MIN_TAP} rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
        style={{ outlineColor: 'var(--adm-primary)' }}
        aria-label={`Open ticket ${ticket.ticket_number}: ${ticket.subject}`}
      >
        <span className="flex items-center justify-between gap-2 text-[11px] font-semibold" style={{ color: 'var(--adm-muted)' }}>
          <span>{ticket.ticket_number}</span>
          <span>{timeAgo(ticket.last_activity_at)}</span>
        </span>
        <span className="mt-1 line-clamp-2 block text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>{ticket.subject}</span>
        <span className="mt-1 block truncate text-xs" style={{ color: 'var(--adm-text-2)' }}>{personName(ticket.customer, 'Unknown customer')}</span>
      </button>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: soft(pr.color), color: 'var(--adm-text)' }}>
          <span aria-hidden className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: pr.color }} />
          {pr.label} priority
        </span>
        <span className="rounded-full px-2 py-0.5" style={{ background: 'var(--adm-track)', color: 'var(--adm-text-2)' }}>{CATEGORY_LABELS[ticket.category]}</span>
        {unanswered && (
          <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: soft('var(--adm-error)', 14), color: 'var(--adm-text)' }}>
            No reply yet
          </span>
        )}
        {ticket.assignee && (
          <span
            className="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
            style={{ background: 'var(--adm-primary-soft)', color: 'var(--adm-primary)' }}
            title={`Assigned to ${personName(ticket.assignee)}`}
            aria-label={`Assigned to ${personName(ticket.assignee)}`}
          >
            {initials(ticket.assignee)}
          </span>
        )}
      </div>

      <label className="mt-2 block">
        <span className="sr-only">Move {ticket.ticket_number} to</span>
        <select
          value=""
          onChange={(e) => e.target.value && onMove(e.target.value as TicketStatus)}
          className={`${MIN_TAP} w-full px-2 text-xs`}
          style={{ background: 'var(--adm-bg)', border: '1px solid var(--adm-border)', color: 'var(--adm-text)', borderRadius: 'var(--adm-radius-control)' }}
        >
          <option value="">Move to…</option>
          {TICKET_STATUSES.filter((s) => s !== ticket.status).map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
      </label>
    </article>
  );
}
