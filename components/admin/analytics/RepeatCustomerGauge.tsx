'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

import { faUserCheck } from '@fortawesome/free-solid-svg-icons';

import { formatNumber, formatPercent } from '@/lib/analytics/format';
import type { AsyncState } from '@/lib/analytics/useAsync';
import type { Kpis } from '@/lib/analytics/types';

import AnimatedNumber from './AnimatedNumber';
import { PanelSkeleton } from './AnalyticsSkeleton';
import Card from './Card';
import GrowthBadge from './GrowthBadge';
import { EASE } from './motion';
import { EmptyState, ErrorState } from './WidgetState';

const SEGMENTS = 36;
const CX = 110;
const CY = 105;
const R_OUTER = 92;
const R_INNER = 74;

/**
 * Semicircular segmented gauge. Segments light up left to right, in step with
 * the number counting up. The arc itself never rotates. There is no target
 * line because TechTour has not defined one.
 */
function Gauge({ percent }: { percent: number }) {
  const reduce = useReducedMotion();
  const lit = Math.round((Math.min(Math.max(percent, 0), 100) / 100) * SEGMENTS);
  const segments = useMemo(
    () =>
      Array.from({ length: SEGMENTS }, (_, i) => {
        const theta = Math.PI - ((i + 0.5) / SEGMENTS) * Math.PI;
        return {
          i,
          x1: CX + R_INNER * Math.cos(theta),
          y1: CY - R_INNER * Math.sin(theta),
          x2: CX + R_OUTER * Math.cos(theta),
          y2: CY - R_OUTER * Math.sin(theta),
        };
      }),
    [],
  );

  return (
    <svg viewBox="0 0 220 120" className="mx-auto w-full max-w-[260px]" role="img" aria-label={`Repeat customer rate ${formatPercent(percent)}`}>
      {segments.map((s) => {
        const on = s.i < lit;
        return (
          <motion.line
            key={s.i}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            strokeWidth={4.5}
            strokeLinecap="round"
            initial={{ stroke: 'var(--adm-track)' }}
            animate={{ stroke: on ? '#139EA2' : 'var(--adm-track)' }}
            transition={reduce ? { duration: 0 } : { duration: 0.25, ease: EASE, delay: on ? 0.25 + (s.i / SEGMENTS) * 0.8 : 0 }}
          />
        );
      })}
    </svg>
  );
}

/** Repeat customer rate: returning purchasing customers / purchasing customers, from analytics_kpis. */
export default function RepeatCustomerGauge({ state }: { state: AsyncState<Kpis> }) {
  if (state.loading && !state.data) return <PanelSkeleton height={170} />;

  const k = state.data;
  const purchasers = k?.purchasing_customers.current ?? 0;

  return (
    <Card className="p-5" lift={false}>
      <p className="text-sm font-semibold">Repeat Customer Rate</p>
      {state.error || !k ? (
        <ErrorState message={state.error ?? 'No data returned'} onRetry={state.retry} />
      ) : purchasers === 0 ? (
        <EmptyState icon={faUserCheck} title="No customer purchase data yet" body="The rate appears once customers complete paid checkouts." />
      ) : (
        <>
          <div className="relative mt-2">
            <Gauge percent={k.repeat_customer_rate.current} />
            <div className="absolute inset-x-0 bottom-1 text-center">
              <p className="text-3xl font-bold tabular-nums">
                <AnimatedNumber value={k.repeat_customer_rate.current} format={formatPercent} />
              </p>
            </div>
          </div>
          <p className="mt-3 text-center text-xs" style={{ color: 'var(--adm-text-2)' }}>
            {formatNumber(k.returning_customers.current)} of {formatNumber(purchasers)} purchasing customers are returning
          </p>
          <div className="mt-2 flex justify-center">
            <GrowthBadge growth={k.repeat_customer_rate} />
          </div>
        </>
      )}
    </Card>
  );
}
