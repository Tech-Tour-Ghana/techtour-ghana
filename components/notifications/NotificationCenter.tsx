'use client';

// Body of the notifications page, used by the account (/auth/notifications) and
// the admin (/admin/notifications). All / Unread filter, open a notification to
// read it and go to its page, toggle read or unread on any row, mark all read.

import { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheckDouble, faEnvelope, faEnvelopeOpen, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useNotifications } from '@/lib/useNotifications';
import { TONES, TYPE_COLOR, TYPE_ICON, timeAgo, type Tone } from './shared';

type Filter = 'all' | 'unread';

export default function NotificationCenter({ tone }: { tone: Tone }) {
  const t = TONES[tone];
  const { items, loading, failed, unread, refresh, setRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<Filter>('all');
  const shown = filter === 'unread' ? items.filter((n) => !n.read) : items;

  if (loading) return <p className="py-12 text-center text-sm" style={{ color: t.muted }}>Loading notifications...</p>;

  if (failed) {
    return (
      <div role="alert" className="py-12 text-center">
        <p className="mb-3 text-sm" style={{ color: t.text2 }}>We could not load your notifications.</p>
        <button type="button" onClick={refresh} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: 'var(--brand-teal)', color: 'var(--brand-on-primary)' }}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Filter notifications" className="inline-flex rounded-lg p-1" style={{ background: t.hover }}>
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className="rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors"
              style={filter === f ? { background: t.card, color: t.text, boxShadow: '0 1px 2px rgba(var(--brand-black-rgb), 0.12)' } : { color: t.text2 }}
            >
              {f}
              {f === 'unread' && unread > 0 && <span className="ml-1.5 rounded-full px-1.5 text-xs" style={{ background: 'var(--brand-error)', color: 'var(--brand-white)' }}>{unread}</span>}
            </button>
          ))}
        </div>
        {unread > 0 && (
          <button type="button" onClick={markAllRead} className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium" style={{ borderColor: t.border, color: t.text2 }}>
            <FontAwesomeIcon icon={faCheckDouble} className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <FontAwesomeIcon icon={faBell} className="mb-3 h-8 w-8" style={{ color: t.muted }} />
          <h2 className="text-lg font-semibold" style={{ color: t.text }}>{filter === 'unread' ? 'Nothing unread' : 'No notifications yet'}</h2>
          <p className="mt-1 text-sm" style={{ color: t.text2 }}>{filter === 'unread' ? 'You have read everything.' : 'New activity will show up here.'}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {shown.map((n) => (
            <li
              key={n.id}
              className="flex items-start gap-3 rounded-xl p-3 sm:p-4"
              style={{
                background: t.card,
                border: `1px solid ${t.border}`,
                borderLeft: `4px solid ${n.read ? t.border : 'var(--brand-teal)'}`,
              }}
            >
              <span
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: `color-mix(in srgb, ${TYPE_COLOR[n.type]} 14%, transparent)`, color: TYPE_COLOR[n.type] }}
              >
                <FontAwesomeIcon icon={TYPE_ICON[n.type]} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${n.read ? 'font-normal' : 'font-semibold'}`} style={{ color: t.text }}>
                  {n.title}
                  {!n.read && <span className="sr-only"> (unread)</span>}
                </p>
                <p className="mt-0.5 text-sm" style={{ color: t.text2 }}>{n.message}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: t.muted }}>
                  <time dateTime={n.date}>{timeAgo(n.date)}</time>
                  {n.link && (
                    <Link href={n.link} onClick={() => !n.read && setRead(n.id, true)} className="inline-flex items-center gap-1 font-medium" style={{ color: 'var(--brand-teal)' }}>
                      Open <FontAwesomeIcon icon={faChevronRight} className="h-2.5 w-2.5" />
                    </Link>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRead(n.id, !n.read)}
                aria-label={n.read ? 'Mark as unread' : 'Mark as read'}
                title={n.read ? 'Mark as unread' : 'Mark as read'}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:brightness-95"
                style={{ background: t.hover, color: t.text2 }}
              >
                <FontAwesomeIcon icon={n.read ? faEnvelope : faEnvelopeOpen} className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
