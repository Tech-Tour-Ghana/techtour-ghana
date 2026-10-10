'use client';

import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullhorn } from '@fortawesome/free-solid-svg-icons';

import NoticeCard from '@/components/notices/NoticeCard';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Notice = Database['public']['Tables']['notices']['Row'];

export default function NoticeBoard() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [notices, setNotices] = useState<Notice[] | null>(null);

  useEffect(() => {
    // Public RLS already limits this to active notices inside their window.
    supabase.from('notices').select('*').order('is_pinned', { ascending: false }).order('starts_at', { ascending: false }).limit(20)
      .then(({ data }) => setNotices(data ?? []));
  }, [supabase]);

  return (
    <section className="mb-6" aria-labelledby="notice-board-heading">
      <h3 id="notice-board-heading" className="mb-3 text-lg font-bold" style={{ color: 'var(--brand-text)' }}>
        <FontAwesomeIcon icon={faBullhorn} className="mr-2" style={{ color: 'var(--brand-teal)' }} aria-hidden />
        Notice board
      </h3>
      {notices === null ? (
        <div className="h-20 animate-pulse rounded-2xl" style={{ background: 'var(--brand-subtle)' }} role="status" aria-label="Loading notices" />
      ) : notices.length === 0 ? (
        <p className="rounded-2xl p-4 text-sm" style={{ background: 'var(--brand-card)', border: '1px solid var(--brand-line)', color: 'var(--brand-text-2)' }}>No notices right now</p>
      ) : (
        <div className="space-y-3">{notices.map((n) => <NoticeCard key={n.id} notice={n} />)}</div>
      )}
    </section>
  );
}
