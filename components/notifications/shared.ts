import {
  faBell,
  faCalendarCheck,
  faHeadset,
  faHeart,
  faShoppingBag,
  faTag,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import type { Notification } from '@/lib/api';

export const TYPE_ICON: Record<Notification['type'], IconDefinition> = {
  order: faShoppingBag,
  tour: faCalendarCheck,
  promotion: faTag,
  wishlist: faHeart,
  support: faHeadset,
  general: faBell,
};

export const TYPE_COLOR: Record<Notification['type'], string> = {
  order: 'var(--brand-teal)',
  tour: 'var(--brand-purple)',
  promotion: 'var(--brand-gold)',
  wishlist: 'var(--brand-error)',
  support: 'var(--brand-info)',
  general: 'var(--brand-info)',
};

/** Colour tokens for a surface. The admin shell keeps its own --adm-* set. */
export const TONES = {
  site: { card: 'var(--brand-card)', text: 'var(--brand-text)', text2: 'var(--brand-text-2)', muted: 'var(--brand-muted)', border: 'var(--brand-line)', hover: 'var(--brand-subtle)' },
  admin: { card: 'var(--adm-card)', text: 'var(--adm-text)', text2: 'var(--adm-text-2)', muted: 'var(--adm-muted)', border: 'var(--adm-border)', hover: 'var(--adm-track)' },
} as const;

export type Tone = keyof typeof TONES;

/** "5 min ago", "Yesterday", then a short date. */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return 'Yesterday';
  if (day < 7) return `${day} days ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
