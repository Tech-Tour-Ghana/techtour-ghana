'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';

import { formatGHS, formatNumber } from '@/lib/analytics/format';
import type { AsyncState } from '@/lib/analytics/useAsync';
import type { TopProduct } from '@/lib/analytics/types';

import { TableSkeleton } from './AnalyticsSkeleton';
import Card from './Card';
import { EASE } from './motion';
import { EmptyState, ErrorState } from './WidgetState';

/**
 * Ranked by units sold from successful checkouts (analytics_top_products).
 * Ratings are deliberately absent: nothing calculates them yet.
 */
export default function BestSellingProducts({
  state,
  images,
}: {
  state: AsyncState<TopProduct[]>;
  images: Record<string, string>;
}) {
  const reduce = useReducedMotion();
  const products = state.data ?? [];

  return (
    <Card className="p-5" lift={false}>
      <p className="text-sm font-semibold">Best-Selling Products</p>
      <div className="mt-4">
        {state.loading && !state.data ? (
          <TableSkeleton />
        ) : state.error ? (
          <ErrorState message={state.error} onRetry={state.retry} />
        ) : products.length === 0 ? (
          <EmptyState icon={faBoxOpen} title="No sales in this period" body="Products appear here ranked by units sold once customers complete paid checkouts." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>
                  <th className="pb-3 pr-3 font-semibold">Product</th>
                  <th className="pb-3 pr-3 text-right font-semibold">Units sold</th>
                  <th className="pb-3 pr-3 text-right font-semibold">Revenue</th>
                  <th className="pb-3 text-right font-semibold">Checkouts</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <motion.tr
                    key={p.product_id}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE, delay: reduce ? 0 : 0.05 * i }}
                    className="border-t"
                    style={{ borderColor: 'var(--adm-border)' }}
                  >
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <span className="w-4 text-xs tabular-nums" style={{ color: 'var(--adm-muted)' }}>{i + 1}</span>
                        {images[p.product_id] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={images[p.product_id]} alt="" className="h-9 w-9 rounded-lg object-cover" loading="lazy" />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold" style={{ background: 'var(--adm-primary-soft)', color: 'var(--adm-primary)' }}>
                            {p.title.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="font-medium">{p.title}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums">{formatNumber(p.units_sold)}</td>
                    <td className="py-3 pr-3 text-right font-semibold tabular-nums" style={{ color: 'var(--adm-success)' }}>{formatGHS(p.revenue)}</td>
                    <td className="py-3 text-right tabular-nums" style={{ color: 'var(--adm-text-2)' }}>{formatNumber(p.checkouts)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
