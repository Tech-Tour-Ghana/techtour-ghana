// Thin wrappers over the analytics SQL functions (migration 0019). Nothing here
// aggregates: every number comes back from Postgres already computed, under the
// caller's own session, so RLS and the functions' admin check stay in force.

import { createBrowserClient } from '@/lib/supabase/client';

import type { Kpis, SeriesMetric, SeriesPoint, TopProduct, WeekdayRow } from './types';
import type { Range } from './range';

async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  // The generated Functions map does not model jsonb or setof results in a way
  // worth spelling out for each call, so the result is narrowed by the wrappers
  // below instead.
  const { data, error } = await createBrowserClient().rpc(fn as never, args as never);
  if (error) throw new Error(error.message);
  return data as T;
}

export const fetchKpis = (range: Range) =>
  call<Kpis>('analytics_kpis', { p_from: range.from, p_to: range.to });

export async function fetchSeries(range: Range, metric: SeriesMetric): Promise<SeriesPoint[]> {
  const rows = await call<{ date: string; value: number | string }[]>('analytics_timeseries', {
    p_from: range.from,
    p_to: range.to,
    p_metric: metric,
  });
  return rows.map((r) => ({ date: r.date, value: Number(r.value) }));
}

export async function fetchWeekdays(range: Range): Promise<WeekdayRow[]> {
  const rows = await call<WeekdayRow[]>('analytics_weekday_activity', { p_from: range.from, p_to: range.to });
  return rows.map((r) => ({ ...r, page_views: Number(r.page_views) }));
}

/** Thumbnails for the best-seller rows. Products are public content, this is not analytics data. */
export async function fetchProductImages(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data } = await createBrowserClient().from('market_products').select('id, image_url').in('id', ids);
  const out: Record<string, string> = {};
  for (const row of data ?? []) if (row.image_url) out[row.id] = row.image_url;
  return out;
}

/** Everything the dashboard reads. The default is the live Supabase functions, the type exists so a preview can swap the source. */
export interface AnalyticsSource {
  kpis: (range: Range) => Promise<Kpis>;
  series: (range: Range, metric: SeriesMetric) => Promise<SeriesPoint[]>;
  weekdays: (range: Range) => Promise<WeekdayRow[]>;
  products: (range: Range) => Promise<TopProduct[]>;
  productImages: (ids: string[]) => Promise<Record<string, string>>;
}

export const liveSource: AnalyticsSource = {
  kpis: fetchKpis,
  series: fetchSeries,
  weekdays: fetchWeekdays,
  products: (range) => fetchTopProducts(range, 10),
  productImages: fetchProductImages,
};

export async function fetchTopProducts(range: Range, limit = 10): Promise<TopProduct[]> {
  const rows = await call<TopProduct[]>('analytics_top_products', {
    p_from: range.from,
    p_to: range.to,
    p_limit: limit,
  });
  return rows.map((r) => ({
    ...r,
    units_sold: Number(r.units_sold),
    revenue: Number(r.revenue),
    checkouts: Number(r.checkouts),
  }));
}
