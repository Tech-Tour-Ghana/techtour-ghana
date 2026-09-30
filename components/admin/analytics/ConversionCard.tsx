'use client';

import { faFilter } from '@fortawesome/free-solid-svg-icons';

import { formatNumber, formatPercent } from '@/lib/analytics/format';
import type { AsyncState } from '@/lib/analytics/useAsync';
import type { Kpis } from '@/lib/analytics/types';

import AnimatedNumber from './AnimatedNumber';
import { PanelSkeleton } from './AnalyticsSkeleton';
import Card from './Card';
import GrowthBadge from './GrowthBadge';
import { EmptyState, ErrorState } from './WidgetState';

/**
 * Site-level conversion: successful checkouts divided by visitors. This is the
 * only conversion TechTour can compute, there are no cart or checkout-start
 * events yet, so no funnel steps are shown.
 */
export default function ConversionCard({ state }: { state: AsyncState<Kpis> }) {
  if (state.loading && !state.data) return <PanelSkeleton height={120} />;

  const k = state.data;

  return (
    <Card className="p-5">
      <p className="text-sm font-semibold">Conversion Rate</p>
      {state.error || !k ? (
        <ErrorState message={state.error ?? 'No data returned'} onRetry={state.retry} />
      ) : k.visitors.current === 0 ? (
        <EmptyState icon={faFilter} compact title="No visitor traffic in this period" body="Conversion needs at least one visitor to divide by." />
      ) : (
        <>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-[34px] font-bold leading-none tabular-nums">
              <AnimatedNumber value={k.conversion_rate.current} format={formatPercent} />
            </p>
            <GrowthBadge growth={k.conversion_rate} />
          </div>
          <p className="mt-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>
            {formatNumber(k.orders.current)} successful checkouts from {formatNumber(k.visitors.current)} visitors
          </p>
        </>
      )}
    </Card>
  );
}
