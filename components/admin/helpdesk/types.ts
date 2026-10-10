import type { SupportTicket, TicketPriority } from '@/lib/support/meta';

export interface PersonRef {
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
}

export interface AdminTicket extends SupportTicket {
  customer: PersonRef | null;
  assignee: PersonRef | null;
  /** Public staff replies on the ticket; zero means nobody has answered yet. */
  staff_replies: number;
}

export interface AdminUser extends PersonRef {
  id: string;
  email: string | null;
}

export const PRIORITY_RANK: Record<TicketPriority, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

export const personName = (p: PersonRef | null | undefined, fallback = 'Unknown') =>
  [p?.first_name, p?.last_name].filter(Boolean).join(' ') || p?.email || fallback;

export const initials = (p: PersonRef | null | undefined) =>
  [p?.first_name, p?.last_name].filter(Boolean).map((w) => w![0]!.toUpperCase()).join('') || (p?.email?.[0]?.toUpperCase() ?? '?');

export const soft = (color: string, pct = 14) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

export const MIN_TAP = 'min-h-[44px]';
