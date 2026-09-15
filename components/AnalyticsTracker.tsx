'use client';

// Records page views for the admin analytics dashboard. Earlier versions of
// this component posted to a Django endpoint that no longer exists, which
// left every page view logging a 404 in the console.
//
// Page views go through app/api/analytics/events, which validates the event
// with Zod before writing (design.md B: parse, don't validate). Opening a
// session writes straight to analytics_sessions instead: RLS already pins
// what an anonymous insert may write there (0013), and a second Route
// Handler for one insert this shape would just repeat that policy in code.

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

function getSessionId(): string {
  const key = 'analytics_session_id';
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPageRef = useRef<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supabase = createBrowserClient();
    const sessionId = getSessionId();

    supabase.auth.getUser().then(({ data }) => {
      supabase
        .from('analytics_sessions')
        .insert({ session_id: sessionId, user_id: data.user?.id ?? null })
        .then(({ error }) => {
          // 23505: this session_id was already opened, by this tab or an
          // earlier one. Not a failure, the row already exists.
          if (error && error.code !== '23505') {
            console.warn('Analytics session tracking failed:', error.message);
          }
        });
    });
  }, []);

  useEffect(() => {
    if (!pathname) return;

    const currentPage = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    if (currentPage === lastPageRef.current) return;
    lastPageRef.current = currentPage;

    const timer = setTimeout(() => {
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'view',
          page: currentPage,
          sessionId: getSessionId(),
        }),
      }).catch(() => {
        // Silent: telemetry must never surface an error to the visitor.
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}
