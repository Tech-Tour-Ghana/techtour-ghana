'use client';

import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

import { SEVERITY, severityOf } from '@/components/notices/NoticeCard';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Notice = Database['public']['Tables']['notices']['Row'];

const KEY = 'tt-dismissed-notices';
const RANK: Record<string, number> = { critical: 0, warning: 1 };

function dismissedIds(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]; } catch { return []; }
}

/**
 * Rendered at the top of <main>, which sits below the fixed navbar (body
 * padding-top is --nav-height), so it is in normal flow and never overlaps it.
 */
export default function NoticeBanner() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    supabase.from('notices').select('*').eq('show_banner', true).order('starts_at', { ascending: false }).limit(20)
      .then(({ data }) => {
        const gone = dismissedIds();
        const best = (data ?? []).filter((n) => !gone.includes(n.id)).sort((a, b) => (RANK[a.severity] ?? 2) - (RANK[b.severity] ?? 2))[0];
        setNotice(best ?? null);
      });
  }, [supabase]);

  if (!notice) return null;
  const sev = SEVERITY[severityOf(notice.severity)];
  const id = notice.id;

  function dismiss() {
    try { localStorage.setItem(KEY, JSON.stringify([...dismissedIds(), id])); } catch { /* storage blocked */ }
    setNotice(null);
  }

  return (
    <div role="status" className="flex items-start gap-3 px-4 py-2 text-sm" style={{ background: `color-mix(in srgb, ${sev.color} 14%, var(--brand-card))`, borderBottom: `2px solid ${sev.color}`, color: 'var(--brand-text)' }}>
      <FontAwesomeIcon icon={sev.icon} className="mt-3 h-3.5 w-3.5 flex-shrink-0" style={{ color: sev.color }} aria-hidden />
      <p className="min-w-0 flex-1 break-words py-1.5">
        <span className="font-bold">{sev.label}: {notice.title}</span>
        {notice.body && <span style={{ color: 'var(--brand-text-2)' }}>{' '}{notice.body.length > 160 ? `${notice.body.slice(0, 157)}...` : notice.body}</span>}
      </p>
      <button type="button" onClick={dismiss} aria-label="Dismiss notice" className="-my-1 -mr-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full" style={{ color: 'var(--brand-text-2)' }}>
        <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
      </button>
    </div>
  );
}
