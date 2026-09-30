'use client';

// Admin home. Every number is real: the headline KPIs come from the analytics
// SQL functions (last 7 days against the 7 before), the rest are small count and
// "latest few rows" queries under the admin's own session and RLS. Each block
// loads and fails on its own.

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faBell,
  faBoxOpen,
  faCheck,
  faClockRotateLeft,
  faEnvelope,
  faEye,
  faGraduationCap,
  faHammer,
  faMapLocationDot,
  faMoneyBillTrendUp,
  faNewspaper,
  faPaperPlane,
  faPlus,
  faQuoteLeft,
  faReceipt,
  faRoute,
  faUserPlus,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import MetricCard from '@/components/admin/analytics/MetricCard';
import { ErrorState } from '@/components/admin/analytics/WidgetState';
import { containerVariants, fadeVariants, panelVariants } from '@/components/admin/analytics/motion';
import { Button, EmptyBlock, ListSkeleton, Surface, fmtDate } from '@/components/admin/ui';
import { liveSource } from '@/lib/analytics/api';
import { formatGHS, formatNumber } from '@/lib/analytics/format';
import { resolveRange } from '@/lib/analytics/range';
import type { Growth, Kpis } from '@/lib/analytics/types';
import { useAsync, type AsyncState } from '@/lib/analytics/useAsync';
import { getAuthStatus } from '@/lib/api';
import { createBrowserClient } from '@/lib/supabase/client';

const range = () => resolveRange({ range: '7d' });

function pick(kpis: AsyncState<Kpis>, key: 'visitors' | 'page_views' | 'orders' | 'revenue' | 'new_registrations'): AsyncState<Growth> {
  return { data: kpis.data ? kpis.data[key] : null, error: kpis.error, loading: kpis.loading, retry: kpis.retry };
}

// One "head" count, or null when it fails so a single bad table never hides the rest.
const head = (q: PromiseLike<{ count: number | null; error: unknown }>) =>
  q.then((r) => (r.error ? null : r.count ?? 0), () => null);

/* ------------------------------------------------------------------ */

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div variants={reduce ? fadeVariants : panelVariants}>
      <Surface className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action && (
            <Link href={action.href} className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--adm-primary)' }}>
              {action.label}
              <FontAwesomeIcon icon={faArrowRight} className="h-2.5 w-2.5" />
            </Link>
          )}
        </div>
        {children}
      </Surface>
    </motion.div>
  );
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
      {children}
    </span>
  );
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'var(--adm-accent)',
  processing: 'var(--adm-primary)',
  shipped: 'var(--adm-primary)',
  delivered: 'var(--adm-success)',
  cancelled: 'var(--adm-error)',
  refunded: 'var(--adm-error)',
};

/* ------------------------------------------------------------------ */

interface Attention {
  label: string;
  href: string;
  icon: IconDefinition;
  count: number | null;
}

function NeedsAttention() {
  const state = useAsync<Attention[]>(async () => {
    const db = createBrowserClient();
    const c = { count: 'exact' as const, head: true };
    const [messages, orders, reviews, suggestions, issues, applications, bookings] = await Promise.all([
      head(db.from('contact_messages').select('id', c).eq('is_read', false)),
      head(db.from('orders').select('id', c).eq('order_status', 'pending')),
      head(db.from('tour_reviews').select('id', c).eq('status', 'pending')),
      head(db.from('suggestions').select('id', c).eq('is_read', false)),
      head(db.from('issue_reports').select('id', c).eq('status', 'new')),
      head(db.from('study_applications').select('id', c).eq('status', 'pending')),
      head(db.from('bookings').select('id', c).eq('status', 'pending')),
    ]);
    return [
      { label: 'Unread contact messages', href: '/admin/contacts', icon: faEnvelope, count: messages },
      { label: 'Orders awaiting fulfilment', href: '/admin/orders', icon: faReceipt, count: orders },
      { label: 'Tour bookings to confirm', href: '/admin/tours', icon: faRoute, count: bookings },
      { label: 'Tour reviews to moderate', href: '/admin/tours', icon: faCheck, count: reviews },
      { label: 'New issue reports', href: '/admin/feedback', icon: faBell, count: issues },
      { label: 'Unread suggestions', href: '/admin/feedback', icon: faPaperPlane, count: suggestions },
      { label: 'Study applications pending', href: '/admin/applications', icon: faGraduationCap, count: applications },
    ];
  }, 'attention');

  const items = state.data ?? [];
  const open = items.filter((i) => (i.count ?? 0) > 0);

  return (
    <SectionCard title="Needs attention">
      {state.loading && !state.data ? (
        <ListSkeleton rows={4} />
      ) : state.error ? (
        <ErrorState message={state.error} onRetry={state.retry} />
      ) : open.length === 0 ? (
        <EmptyBlock title="You're all caught up" body="Nothing is waiting on staff right now." />
      ) : (
        <ul className="space-y-1">
          {open.map((i) => (
            <li key={i.label}>
              <Link href={i.href} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-black/[0.04]">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--adm-primary-soft)', color: 'var(--adm-primary)' }}>
                  <FontAwesomeIcon icon={i.icon} className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1 text-sm">{i.label}</span>
                <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: 'var(--adm-accent)' }}>{i.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */

interface RecentOrder {
  id: string;
  order_number: string;
  total_price: number;
  order_status: string;
  created_at: string;
  market_products: { title: string } | null;
}

function RecentOrders() {
  const state = useAsync<RecentOrder[]>(async () => {
    const { data, error } = await createBrowserClient()
      .from('orders')
      .select('id, order_number, total_price, order_status, created_at, market_products(title)')
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) throw new Error(error.message);
    return (data as unknown as RecentOrder[]) ?? [];
  }, 'recent-orders');

  return (
    <SectionCard title="Recent orders" action={{ label: 'All orders', href: '/admin/orders' }}>
      {state.loading && !state.data ? (
        <ListSkeleton rows={4} />
      ) : state.error ? (
        <ErrorState message={state.error} onRetry={state.retry} />
      ) : (state.data ?? []).length === 0 ? (
        <EmptyBlock title="No orders yet" body="Paid orders appear here as customers check out." />
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
          {(state.data ?? []).map((o) => (
            <li key={o.id} className="flex items-center gap-3 py-3" style={{ borderColor: 'var(--adm-border)' }}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{o.market_products?.title ?? o.order_number}</p>
                <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>{o.order_number} · {fmtDate(o.created_at)}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums">{formatGHS(o.total_price)}</span>
              <Pill color={STATUS_COLOR[o.order_status] ?? 'var(--adm-text-2)'}>{o.order_status}</Pill>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */

interface RecentMessage {
  id: string;
  name: string;
  subject: string;
  is_read: boolean;
  created_at: string;
}

function RecentMessages() {
  const state = useAsync<RecentMessage[]>(async () => {
    const { data, error } = await createBrowserClient()
      .from('contact_messages')
      .select('id, name, subject, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) throw new Error(error.message);
    return data ?? [];
  }, 'recent-messages');

  return (
    <SectionCard title="Latest messages" action={{ label: 'Inbox', href: '/admin/contacts' }}>
      {state.loading && !state.data ? (
        <ListSkeleton rows={4} />
      ) : state.error ? (
        <ErrorState message={state.error} onRetry={state.retry} />
      ) : (state.data ?? []).length === 0 ? (
        <EmptyBlock title="No messages yet" body="Contact form submissions arrive here." />
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--adm-border)' }}>
          {(state.data ?? []).map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-3" style={{ borderColor: 'var(--adm-border)' }}>
              <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: m.is_read ? 'var(--adm-track)' : 'var(--adm-accent)' }} aria-label={m.is_read ? 'Read' : 'Unread'} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.subject}</p>
                <p className="truncate text-xs" style={{ color: 'var(--adm-muted)' }}>{m.name} · {fmtDate(m.created_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */

interface ActivityRow {
  id: string;
  action: 'insert' | 'update' | 'delete';
  table_name: string;
  summary: string;
  created_at: string;
  profiles: { email: string } | null;
}

const ACTION_VERB = { insert: 'added', update: 'edited', delete: 'removed' } as const;

function RecentActivity() {
  const state = useAsync<ActivityRow[]>(async () => {
    const { data, error } = await createBrowserClient()
      .from('audit_log')
      .select('id, action, table_name, summary, created_at, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(8);
    if (error) throw new Error(error.message);
    return (data as unknown as ActivityRow[]) ?? [];
  }, 'activity');

  return (
    <SectionCard title="Recent admin activity" action={{ label: 'Audit log', href: '/admin/audit' }}>
      {state.loading && !state.data ? (
        <ListSkeleton rows={4} />
      ) : state.error ? (
        <ErrorState message={state.error} onRetry={state.retry} />
      ) : (state.data ?? []).length === 0 ? (
        <EmptyBlock title="No admin changes yet" body="Edits made in the admin are recorded here." />
      ) : (
        <ul className="space-y-3">
          {(state.data ?? []).map((a) => (
            <li key={a.id} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--adm-primary-soft)', color: 'var(--adm-primary)' }}>
                <FontAwesomeIcon icon={faClockRotateLeft} className="h-3 w-3" />
              </span>
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{a.profiles?.email?.split('@')[0] ?? 'Someone'}</span> {ACTION_VERB[a.action]}{' '}
                  <span className="font-medium">{a.summary || a.table_name.replace(/_/g, ' ')}</span>
                </p>
                <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>{a.table_name.replace(/_/g, ' ')} · {fmtDate(a.created_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */

const CONTENT: { label: string; href: string; icon: IconDefinition; table: string; filter?: [string, boolean | string] }[] = [
  { label: 'Products', href: '/admin/market', icon: faBoxOpen, table: 'market_products' },
  { label: 'Artisans', href: '/admin/artisans', icon: faHammer, table: 'artisans' },
  { label: 'Tours', href: '/admin/tours', icon: faRoute, table: 'tours' },
  { label: 'Destinations', href: '/admin/destinations', icon: faMapLocationDot, table: 'destinations' },
  { label: 'Blog posts', href: '/admin/blog', icon: faNewspaper, table: 'blog_posts', filter: ['is_published', true] },
  { label: 'Testimonials', href: '/admin/testimonials', icon: faQuoteLeft, table: 'testimonials' },
  { label: 'Subscribers', href: '/admin/newsletter', icon: faEnvelope, table: 'newsletter_subscribers' },
  { label: 'Customers', href: '/admin/users', icon: faUsers, table: 'profiles', filter: ['is_admin', false] },
];

function ContentAtAGlance() {
  const state = useAsync<(number | null)[]>(async () => {
    const db = createBrowserClient();
    return Promise.all(
      CONTENT.map((c) => {
        // The table name is data, so the typed builder is narrowed by hand here.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q: any = (db as any).from(c.table).select('id', { count: 'exact', head: true });
        if (c.filter) q = q.eq(c.filter[0], c.filter[1]);
        return head(q);
      }),
    );
  }, 'content');

  return (
    <SectionCard title="Content at a glance">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CONTENT.map((c, i) => (
          <Link
            key={c.label}
            href={c.href}
            className="group rounded-xl p-3 transition-colors"
            style={{ background: 'var(--adm-bg)', border: '1px solid var(--adm-border)' }}
          >
            <span style={{ color: 'var(--adm-primary)' }}>
              <FontAwesomeIcon icon={c.icon} className="h-4 w-4" />
            </span>
            <p className="mt-2 text-xl font-bold tabular-nums">
              {state.loading && !state.data ? <span className="adm-skeleton inline-block h-6 w-10 align-middle" /> : state.data?.[i] === null || state.data === null ? '-' : formatNumber(state.data?.[i] ?? 0)}
            </p>
            <p className="text-xs" style={{ color: 'var(--adm-text-2)' }}>{c.label}</p>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */

const QUICK: { label: string; href: string; icon: IconDefinition }[] = [
  { label: 'Add product', href: '/admin/market', icon: faPlus },
  { label: 'Write a post', href: '/admin/blog', icon: faNewspaper },
  { label: 'Add a tour', href: '/admin/tours', icon: faRoute },
  { label: 'Send a notification', href: '/admin/send-notifications', icon: faBell },
];

export default function DashboardOverview() {
  const reduce = useReducedMotion();
  const r = range();
  const key = `${r.from}|${r.to}`;
  const kpis = useAsync(() => liveSource.kpis(r), key);
  const visitors = useAsync(() => liveSource.series(r, 'visitors'), key);
  const orders = useAsync(() => liveSource.series(r, 'orders'), key);
  const revenue = useAsync(() => liveSource.series(r, 'revenue'), key);

  const [name, setName] = useState('');
  useEffect(() => {
    getAuthStatus().then((s) => {
      const display = s.user?.display_name ?? '';
      setName(display.split(' ')[0] ?? '');
    });
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div className="space-y-4" variants={reduce ? fadeVariants : containerVariants} initial="hidden" animate="show">
      <motion.div variants={reduce ? fadeVariants : panelVariants} className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{greeting}{name ? `, ${name}` : ''}</h2>
          <p className="text-xs" style={{ color: 'var(--adm-text-2)' }}>
            Last 7 days ({r.label}), compared with {r.previousLabel}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <Link key={q.label} href={q.href}>
              <Button variant="secondary" className="flex items-center gap-2" tabIndex={-1}>
                <FontAwesomeIcon icon={q.icon} className="h-3 w-3" style={{ color: 'var(--adm-primary)' }} />
                {q.label}
              </Button>
            </Link>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <MetricCard label="Visitors" icon={faEye} state={pick(kpis, 'visitors')} format={formatNumber} series={visitors} previousLabel="previous 7 days" />
        <MetricCard label="Orders" icon={faReceipt} state={pick(kpis, 'orders')} format={formatNumber} series={orders} previousLabel="previous 7 days" />
        <MetricCard label="Revenue" icon={faMoneyBillTrendUp} state={pick(kpis, 'revenue')} format={formatGHS} series={revenue} previousLabel="previous 7 days" />
        <MetricCard label="New sign-ups" icon={faUserPlus} state={pick(kpis, 'new_registrations')} format={formatNumber} previousLabel="previous 7 days" />
      </div>
      <p className="text-right text-xs">
        <Link href="/admin/analytics" className="font-medium" style={{ color: 'var(--adm-primary)' }}>
          Open full analytics <FontAwesomeIcon icon={faArrowRight} className="h-2.5 w-2.5" />
        </Link>
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <RecentOrders />
          <RecentMessages />
        </div>
        <div className="min-w-0 space-y-4">
          <NeedsAttention />
          <RecentActivity />
        </div>
      </div>

      <ContentAtAGlance />
    </motion.div>
  );
}
