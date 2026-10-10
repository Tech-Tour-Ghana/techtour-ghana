'use client';

// The bell in the account and admin top bars. The count is the number of unread
// notifications and drops as they are read. Opening the panel does not mark
// anything read; clicking a notification does, and takes the reader to its page.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { useNotifications } from '@/lib/useNotifications';
import { TONES, TYPE_COLOR, TYPE_ICON, timeAgo, type Tone } from './shared';

export default function NotificationBell({ tone, allHref, buttonStyle }: { tone: Tone; allHref: string; buttonStyle: React.CSSProperties }) {
  const t = TONES[tone];
  const router = useRouter();
  const { items, unread, setRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openItem = (id: string, read: boolean, link: string | null) => {
    if (!read) setRead(id, true);
    setOpen(false);
    if (link) router.push(link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative flex items-center justify-center rounded-lg transition-colors"
        style={buttonStyle}
      >
        <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full px-1 text-center text-[10px] font-semibold leading-4"
            style={{ background: 'var(--brand-error)', color: 'var(--brand-white)' }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl shadow-lg"
          style={{ background: t.card, border: `1px solid ${t.border}` }}
        >
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5" style={{ borderColor: t.border }}>
            <p className="text-sm font-semibold" style={{ color: t.text }}>
              Notifications{unread > 0 && <span className="ml-1.5 text-xs font-normal" style={{ color: t.muted }}>{unread} unread</span>}
            </p>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--brand-teal)' }}>
                <FontAwesomeIcon icon={faCheckDouble} className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm" style={{ color: t.muted }}>You are all caught up.</p>
          ) : (
            <ul className="max-h-[22rem] overflow-y-auto">
              {items.slice(0, 6).map((n) => (
                <li key={n.id} className="border-b last:border-b-0" style={{ borderColor: t.border }}>
                  <button
                    type="button"
                    onClick={() => openItem(n.id, n.read, n.link)}
                    className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:brightness-95"
                    style={{ background: n.read ? 'transparent' : `color-mix(in srgb, var(--brand-teal) 7%, ${t.card})` }}
                  >
                    <span
                      className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `color-mix(in srgb, ${TYPE_COLOR[n.type]} 14%, transparent)`, color: TYPE_COLOR[n.type] }}
                    >
                      <FontAwesomeIcon icon={TYPE_ICON[n.type]} className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm ${n.read ? 'font-normal' : 'font-semibold'}`} style={{ color: t.text }}>{n.title}</span>
                      <span className="line-clamp-2 block text-xs" style={{ color: t.text2 }}>{n.message}</span>
                      <span className="mt-0.5 block text-[11px]" style={{ color: t.muted }}>{timeAgo(n.date)}</span>
                    </span>
                    {!n.read && <span aria-label="Unread" className="mt-2 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: 'var(--brand-teal)' }} />}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Link href={allHref} onClick={() => setOpen(false)} className="block border-t px-3 py-2.5 text-center text-sm font-medium" style={{ borderColor: t.border, color: 'var(--brand-teal)' }}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
