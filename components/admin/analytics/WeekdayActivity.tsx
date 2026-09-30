'use client';

import { formatNumber } from '@/lib/analytics/format';
import type { AsyncState } from '@/lib/analytics/useAsync';
import type { WeekdayRow } from '@/lib/analytics/types';

import { PanelSkeleton } from './AnalyticsSkeleton';
import Card from './Card';
import { WeekdayBars } from './lazy';
import { EmptyState, ErrorState } from './WidgetState';

/** Page views by weekday for the selected range, peak day highlighted. Counts come from analytics_weekday_activity. */
export default function WeekdayActivity({ state }: { state: AsyncState<WeekdayRow[]> }) {
  if (state.loading && !state.data) return <PanelSkeleton height={190} />;

  const rows = state.data ?? [];
  const peak = rows.find((r) => r.is_peak);

  return (
    <Card className="p-5" lift={false}>
      <p className="text-sm font-semibold">Most Active Day</p>
      {state.error ? (
        <ErrorState message={state.error} onRetry={state.retry} />
      ) : !peak ? (
        <EmptyState title="No traffic in this period" body="Page views by weekday will appear once visitors arrive." />
      ) : (
        <>
          <p className="mt-1 text-xs" style={{ color: 'var(--adm-text-2)' }}>
            <span className="font-semibold" style={{ color: 'var(--adm-primary)' }}>{peak.name}</span>
            {' '}leads with {formatNumber(peak.page_views)} page views
          </p>
          <div className="mt-3">
            <WeekdayBars rows={rows} />
          </div>
        </>
      )}
    </Card>
  );
}
