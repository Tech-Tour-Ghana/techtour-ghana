// Shared labels and colour roles for helpdesk tickets, used by the customer pages
// and the admin kanban board. Colours are brand variables (see lib/theme/tokens.ts),
// never hex values, so they follow Admin > Settings > Branding.

export const TICKET_STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_CATEGORIES = ['booking', 'payment', 'order', 'study', 'account', 'technical', 'other'] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

/** The customer sees the same five states staff work with. */
export const STATUS_META: Record<TicketStatus, { label: string; customerHint: string; color: string }> = {
  open: { label: 'Open', customerHint: 'We have your request and will pick it up soon.', color: 'var(--brand-info)' },
  in_progress: { label: 'In progress', customerHint: 'Our team is working on it.', color: 'var(--brand-warning)' },
  waiting: { label: 'Waiting on you', customerHint: 'We need a reply from you to continue.', color: 'var(--brand-purple)' },
  resolved: { label: 'Resolved', customerHint: 'Marked as resolved. Reply if you still need help.', color: 'var(--brand-success)' },
  closed: { label: 'Closed', customerHint: 'This ticket is closed.', color: 'var(--brand-muted)' },
};

export const PRIORITY_META: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'var(--brand-muted)' },
  normal: { label: 'Normal', color: 'var(--brand-info)' },
  high: { label: 'High', color: 'var(--brand-warning)' },
  urgent: { label: 'Urgent', color: 'var(--brand-error)' },
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  booking: 'Tour booking',
  payment: 'Payment',
  order: 'Market order',
  study: 'Study abroad',
  account: 'My account',
  technical: 'Website problem',
  other: 'Something else',
};

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  reference: string;
  assigned_to: string | null;
  last_activity_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  author_id: string | null;
  is_staff: boolean;
  is_internal: boolean;
  body: string;
  created_at: string;
}

/** "5 minutes ago", "2 days ago", else a short date. */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.round(h / 24);
  if (d < 14) return `${d} day${d === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
