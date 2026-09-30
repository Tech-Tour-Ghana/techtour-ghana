'use client';

import {
  faArrowsRotate,
  faEye,
  faMoneyBillTrendUp,
  faReceipt,
  faUserPlus,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { motion, useReducedMotion } from 'framer-motion';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { liveSource, type AnalyticsSource } from '@/lib/analytics/api';
import { buildAnalyticsCsv, downloadCsv } from '@/lib/analytics/export';
import { formatGHS, formatNumber } from '@/lib/analytics/format';
import { resolveRange, rangeToSearch } from '@/lib/analytics/range';
import type { Growth, Kpis, SeriesMetric } from '@/lib/analytics/types';
import { useAsync, type AsyncState } from '@/lib/analytics/useAsync';

import AnalyticsHeader from './AnalyticsHeader';
import BestSellingProducts from './BestSellingProducts';
import ConversionCard from './ConversionCard';
import type { RangeChange } from './DateRangePicker';
import MetricCard from './MetricCard';
import RepeatCustomerGauge from './RepeatCustomerGauge';
import RevenueChart from './RevenueChart';
import WeekdayActivity from './WeekdayActivity';
import WidgetDrawer from './WidgetDrawer';
import { containerVariants, fadeVariants, headerVariants } from './motion';
import { DEFAULT_WIDGETS, loadWidgets, saveWidgets, type WidgetId } from './widgets';

/** One field of the KPI result as its own async state, so a card shows the shared loading and error state. */
function pick(kpis: AsyncState<Kpis>, key: keyof Omit<Kpis, 'period' | 'previousPeriod' | 'currency'>): AsyncState<Growth> {
  return { data: kpis.data ? kpis.data[key] : null, error: kpis.error, loading: kpis.loading, retry: kpis.retry };
}

/**
 * The Analytics page body. Every figure comes from the analytics SQL
 * functions through `source`, aggregated in Postgres. The date range lives in
 * the URL so a view can be shared and survives a reload.
 */
export default function AnalyticsDashboard({ source = liveSource }: { source?: AnalyticsSource }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const reduce = useReducedMotion();

  const rangeParam = params.get('range');
  const fromParam = params.get('from');
  const toParam = params.get('to');
  const range = useMemo(
    () => resolveRange({ range: rangeParam, from: fromParam, to: toParam }),
    [rangeParam, fromParam, toParam],
  );
  const key = `${range.from}|${range.to}`;

  const kpis = useAsync(() => source.kpis(range), key);
  const revenue = useAsync(() => source.series(range, 'revenue'), key);
  const orders = useAsync(() => source.series(range, 'orders'), key);
  const visitors = useAsync(() => source.series(range, 'visitors'), key);
  const pageViews = useAsync(() => source.series(range, 'page_views'), key);
  const weekdays = useAsync(() => source.weekdays(range), key);
  const products = useAsync(() => source.products(range), key);
  const series: Record<SeriesMetric, AsyncState<import('@/lib/analytics/types').SeriesPoint[]>> = {
    revenue,
    orders,
    visitors,
    page_views: pageViews,
  };

  const [images, setImages] = useState<Record<string, string>>({});
  useEffect(() => {
    const ids = products.data?.map((p) => p.product_id) ?? [];
    if (ids.length === 0) return;
    let cancelled = false;
    source
      .productImages(ids)
      .then((map) => !cancelled && setImages(map))
      .catch(() => {
        // Thumbnails are decoration, rows fall back to an initial.
      });
    return () => {
      cancelled = true;
    };
  }, [products.data, source]);

  const [enabled, setEnabled] = useState<WidgetId[]>(DEFAULT_WIDGETS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => setEnabled(loadWidgets()), []);
  const toggleWidget = useCallback((id: WidgetId) => {
    setEnabled((prev) => {
      const next = prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id];
      saveWidgets(next);
      return next;
    });
  }, []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const has = (id: WidgetId) => enabled.includes(id);

  const onRangeChange = (next: RangeChange) => {
    const query =
      next.key === 'custom' && next.from && next.to
        ? rangeToSearch({ key: 'custom', fromDate: next.from, toDate: next.to })
        : rangeToSearch({ key: next.key, fromDate: '', toDate: '' });
    router.replace(`${pathname}${query}`, { scroll: false });
  };

  const onExport = () => {
    downloadCsv(
      `techtour-analytics-${range.fromDate}-to-${range.toDate}.csv`,
      buildAnalyticsCsv({
        range,
        kpis: kpis.data,
        series: {
          revenue: revenue.data ?? undefined,
          orders: orders.data ?? undefined,
          visitors: visitors.data ?? undefined,
          page_views: pageViews.data ?? undefined,
        },
        products: products.data,
      }),
    );
  };

  const kpiCards = [
    { id: 'visitors' as const, label: 'Visitors', icon: faUsers, format: formatNumber, series: visitors },
    { id: 'page_views' as const, label: 'Page Views', icon: faEye, format: formatNumber, series: pageViews },
    { id: 'orders' as const, label: 'Orders', icon: faReceipt, format: formatNumber, series: orders },
    { id: 'revenue' as const, label: 'Revenue', icon: faMoneyBillTrendUp, format: formatGHS, series: revenue },
  ].filter((c) => has(c.id));

  const left = has('revenue_overview') || has('best_sellers');
  const right = has('weekday') || has('repeat_rate') || has('conversion');
  const customerCards = [
    { id: 'new_customers' as const, label: 'New Customers', icon: faUserPlus },
    { id: 'returning_customers' as const, label: 'Returning Customers', icon: faArrowsRotate },
  ].filter((c) => has(c.id));

  return (
    <>
      <motion.div
        className="space-y-4"
        variants={reduce ? fadeVariants : containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={reduce ? fadeVariants : headerVariants}>
          <AnalyticsHeader
            range={range}
            onRangeChange={onRangeChange}
            onAddWidget={() => setDrawerOpen(true)}
            onExport={onExport}
            canExport={!!kpis.data}
          />
        </motion.div>

        {kpiCards.length > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {kpiCards.map((c) => (
              <MetricCard
                key={c.id}
                label={c.label}
                icon={c.icon}
                state={pick(kpis, c.id)}
                format={c.format}
                series={c.series}
                previousLabel={range.previousLabel}
              />
            ))}
          </div>
        )}

        {(left || right) && (
          <div className="grid gap-4 lg:grid-cols-3">
            {left && (
              // min-w-0 lets the column shrink below the table's minimum width, the table scrolls inside its card instead.
              <div className={`min-w-0 space-y-4 ${right ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                {has('revenue_overview') && <RevenueChart kpis={kpis} series={series} previousLabel={range.previousLabel} />}
                {has('best_sellers') && <BestSellingProducts state={products} images={images} />}
              </div>
            )}
            {right && (
              <div className={`min-w-0 space-y-4 ${left ? '' : 'lg:col-span-3 grid gap-4 md:grid-cols-3 md:space-y-0'}`}>
                {has('weekday') && <WeekdayActivity state={weekdays} />}
                {has('repeat_rate') && <RepeatCustomerGauge state={kpis} />}
                {has('conversion') && <ConversionCard state={kpis} />}
              </div>
            )}
          </div>
        )}

        {customerCards.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {customerCards.map((c) => (
              <MetricCard
                key={c.id}
                label={c.label}
                icon={c.icon}
                state={pick(kpis, c.id)}
                format={formatNumber}
                previousLabel={range.previousLabel}
              />
            ))}
          </div>
        )}

        {!kpiCards.length && !left && !right && !customerCards.length && (
          <p className="py-12 text-center text-sm" style={{ color: 'var(--adm-text-2)' }}>
            No widgets selected. Use Add widget to choose what to show.
          </p>
        )}
      </motion.div>

      <WidgetDrawer open={drawerOpen} enabled={enabled} onToggle={toggleWidget} onClose={closeDrawer} />
    </>
  );
}
