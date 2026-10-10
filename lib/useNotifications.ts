'use client';

// One source of truth for the bell and the notifications page. Reads the signed
// in user's rows, keeps them fresh (realtime, tab focus, a slow poll as the
// fallback) and tells every other instance on the page when something changes.

import { useCallback, useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { getNotifications, markNotificationsRead, type Notification } from '@/lib/api';

const CHANGED = 'notifications:changed';
const POLL_MS = 60_000;

export function useNotifications() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setItems(await getNotifications(true));
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onChanged = () => refresh();
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    window.addEventListener(CHANGED, onChanged);
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(onVisible, POLL_MS);

    const supabase = createBrowserClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id;
      if (!uid) return;
      channel = supabase
        .channel(`notifications:${uid}:${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` }, () => refresh())
        .subscribe();
    });

    return () => {
      window.removeEventListener(CHANGED, onChanged);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [refresh]);

  const announce = () => window.dispatchEvent(new Event(CHANGED));

  /** Marks one notification read or unread. Optimistic, rolls back if the write fails. */
  const setRead = useCallback(async (id: string, read: boolean) => {
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read } : n)));
    const ok = await markNotificationsRead(id, read);
    if (!ok) refresh();
    else announce();
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    const ok = await markNotificationsRead();
    if (!ok) refresh();
    else announce();
  }, [refresh]);

  const unread = items.filter((n) => !n.read).length;
  return { items, loading, failed, unread, refresh, setRead, markAllRead };
}
