'use client';

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import type { AsyncState } from '@/lib/analytics/useAsync';
import type { Growth, SeriesPoint } from '@/lib/analytics/types';

import AnimatedNumber from './AnimatedNumber';
import { KpiSkeleton } from './AnalyticsSkeleton';
import Card from './Card';
import GrowthBadge from './GrowthBadge';
import { Sparkline } from './lazy';
import { kpiVariants } from './motion';
import { ErrorState } from './WidgetState';

/**
 * One KPI: label, animated value, change against the previous period and, when
 * the matching time series is available, a sparkline. The value and the change
 * come straight from analytics_kpis, nothing is recomputed here.
 */
export default function MetricCard({
  label,
  icon,
  state,
  format,
  series,
  previousLabel,
}: {
  label: string;
  icon: IconDefinition;
  state: AsyncState<Growth>;
  format: (n: number) => string;
  series?: AsyncState<SeriesPoint[]>;
  previousLabel: string;
}) {
  if (state.loading && !state.data) return <KpiSkeleton />;
  if (state.error || !state.data) {
    return (
      <Card variants={kpiVariants} lift={false} className="p-5">
        <p className="text-sm font-medium" style={{ color: 'var(--adm-text-2)' }}>{label}</p>
        <ErrorState message={state.error ?? 'No data returned'} onRetry={state.retry} />
      </Card>
    );
  }

  const growth = state.data;
  const values = series?.data?.map((p) => p.value) ?? [];
  const hasTrend = values.length > 1 && values.some((v) => v > 0);

  return (
    <Card variants={kpiVariants} className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium" style={{ color: 'var(--adm-text-2)' }}>{label}</p>
        <span style={{ color: 'var(--adm-primary)' }}>
          <FontAwesomeIcon icon={icon} className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-[28px] font-bold leading-none tabular-nums">
        <AnimatedNumber value={growth.current} format={format} />
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <GrowthBadge growth={growth} />
        <span className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>vs. {previousLabel}</span>
      </div>
      {hasTrend && (
        <div className="mt-3 -mx-1">
          <Sparkline values={values} />
        </div>
      )}
    </Card>
  );
}
