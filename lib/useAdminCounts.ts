'use client';

// Numbers shown beside admin sidebar items: things waiting for a person. One RPC
// returns all of them. Refreshed every minute, when the tab regains focus, and
// when a page announces a change with announceAdminCounts().

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

export type AdminCounts = Partial<Record<'trash' | 'helpdesk' | 'contacts' | 'orders' | 'tours' | 'rentals' | 'applications' | 'feedback' | 'emails' | 'notifications', number>>;

const CHANGED = 'admin:counts-changed';

/** Call after something that changes a count (restore from trash, resolve a ticket, and so on). */
export const announceAdminCounts = () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGED)); };

export function useAdminCounts(): AdminCounts {
  const [counts, setCounts] = useState<AdminCounts>({});
  const pathname = usePathname();

  const load = useCallback(async () => {
    const { data, error } = await createBrowserClient().rpc('admin_sidebar_counts');
    if (!error && data && typeof data === 'object' && !Array.isArray(data)) setCounts(data as AdminCounts);
  }, []);

  // Also refreshes on every page change, so a count drops as soon as you have dealt with the thing.
  useEffect(() => { load(); }, [load, pathname]);

  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && load();
    window.addEventListener(CHANGED, load);
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(onVisible, 60_000);
    return () => {
      window.removeEventListener(CHANGED, load);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [load]);

  return counts;
}
