'use client';

import { useMemo, useState } from 'react';

import { formatGHS, formatGHSExact, formatNumber } from '@/lib/analytics/format';
import type { AsyncState } from '@/lib/analytics/useAsync';
import type { Kpis, SeriesMetric, SeriesPoint } from '@/lib/analytics/types';

import AnimatedNumber from './AnimatedNumber';
import { ChartSkeleton, Skeleton } from './AnalyticsSkeleton';
import Card from './Card';
import GrowthBadge from './GrowthBadge';
import { OverviewChart } from './lazy';
import { ErrorState, EmptyState } from './WidgetState';

const TABS: { key: SeriesMetric; label: string }[] = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'orders', label: 'Orders' },
  { key: 'visitors', label: 'Visitors' },
  { key: 'page_views', label: 'Page views' },
];

const EMPTY_COPY: Record<SeriesMetric, { title: string; body: string }> = {
  revenue: { title: 'No paid orders in this period', body: 'Revenue appears here once a customer completes a successful checkout.' },
  orders: { title: 'No paid orders in this period', body: 'Successful checkouts will be plotted here.' },
  visitors: { title: 'No traffic in this period', body: 'Visitors are unique valid browsing sessions.' },
  page_views: { title: 'No traffic in this period', body: 'Page views are valid page-view events.' },
};

/**
 * "Revenue Overview": headline revenue and change, orders and average order
 * value, and one chart that can switch between the four series the SQL layer
 * provides. All four series are loaded once per range, switching is local.
 */
export default function RevenueChart({
  kpis,
  series,
  previousLabel,
}: {
  kpis: AsyncState<Kpis>;
  series: Record<SeriesMetric, AsyncState<SeriesPoint[]>>;
  previousLabel: string;
}) {
  const [metric, setMetric] = useState<SeriesMetric>('revenue');
  const active = series[metric];
  const ordersByDate = useMemo(() => {
    const map = new Map<string, number>();
    series.orders.data?.forEach((p) => map.set(p.date, p.value));
    return map;
  }, [series.orders.data]);

  const chartData = useMemo(
    () => (active.data ?? []).map((p) => ({ date: p.date, value: p.value, orders: ordersByDate.get(p.date) })),
    [active.data, ordersByDate],
  );
  const allZero = chartData.length > 0 && chartData.every((p) => p.value === 0);

  return (
    <Card className="p-5" lift={false}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Revenue Overview</p>
          {kpis.loading && !kpis.data ? (
            <Skeleton className="mt-3 h-9 w-40" />
          ) : kpis.data ? (
            <>
              <p className="mt-2 text-[34px] font-bold leading-none tabular-nums">
                <AnimatedNumber value={kpis.data.revenue.current} format={formatGHS} />
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <GrowthBadge growth={kpis.data.revenue} />
                <span className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>vs. {previousLabel}</span>
              </div>
            </>
          ) : (
            <ErrorState message={kpis.error ?? 'No data returned'} onRetry={kpis.retry} />
          )}
        </div>

        <div className="flex gap-1 rounded-[var(--adm-radius-control)] p-1" style={{ background: 'var(--adm-track)' }} role="tablist" aria-label="Chart metric">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={metric === t.key}
              onClick={() => setMetric(t.key)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: metric === t.key ? 'var(--adm-card)' : 'transparent',
                color: metric === t.key ? 'var(--adm-primary)' : 'var(--adm-text-2)',
                boxShadow: metric === t.key ? 'var(--adm-shadow)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="rounded-xl p-3" style={{ background: 'var(--adm-track)' }}>
          <p className="text-[11px]" style={{ color: 'var(--adm-text-2)' }}>Successful orders</p>
          <p className="mt-1 text-lg font-bold tabular-nums">{kpis.data ? formatNumber(kpis.data.orders.current) : '-'}</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'var(--adm-track)' }}>
          <p className="text-[11px]" style={{ color: 'var(--adm-text-2)' }}>Average order value</p>
          <p className="mt-1 text-lg font-bold tabular-nums">{kpis.data ? formatGHSExact(kpis.data.average_order_value.current) : '-'}</p>
        </div>
      </div>

      <div className="mt-5">
        {active.loading && !active.data ? (
          <ChartSkeleton />
        ) : active.error ? (
          <ErrorState message={active.error} onRetry={active.retry} />
        ) : allZero ? (
          <div className="relative">
            <div className="pointer-events-none opacity-40"><OverviewChart data={chartData} metric={metric} /></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <EmptyState compact {...EMPTY_COPY[metric]} />
            </div>
          </div>
        ) : (
          <OverviewChart data={chartData} metric={metric} />
        )}
      </div>
    </Card>
  );
}
