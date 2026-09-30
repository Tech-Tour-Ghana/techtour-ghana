'use client';

// All Recharts usage lives in this one file so it can be lazy-loaded as a
// single chunk (see lazy.ts) and only ever ships with the analytics page.

import { useReducedMotion } from 'framer-motion';
import { useId, useMemo } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatAxisDate, formatGHS, formatNumber, formatTooltipDate } from '@/lib/analytics/format';
import type { SeriesMetric, WeekdayRow } from '@/lib/analytics/types';

const TEAL = '#139EA2';

const tooltipBox: React.CSSProperties = {
  background: 'var(--adm-elevated)',
  border: '1px solid var(--adm-border)',
  borderRadius: 10,
  boxShadow: 'var(--adm-shadow)',
  padding: '8px 12px',
  fontSize: 12,
  color: 'var(--adm-text)',
};

export function Sparkline({ values }: { values: number[] }) {
  const reduce = useReducedMotion();
  const id = useId();
  const data = useMemo(() => values.map((v, i) => ({ i, v })), [values]);
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TEAL} stopOpacity={0.28} />
            <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={TEAL} strokeWidth={1.75} fill={`url(#${id})`} dot={false} isAnimationActive={!reduce} animationDuration={900} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export interface OverviewPoint {
  date: string;
  value: number;
  /** Successful checkouts on the same date, shown in the revenue tooltip. */
  orders?: number;
}

const METRIC_LABEL: Record<SeriesMetric, string> = {
  revenue: 'Revenue',
  orders: 'Orders',
  visitors: 'Visitors',
  page_views: 'Page views',
};

const formatMetric = (metric: SeriesMetric, v: number) => (metric === 'revenue' ? formatGHS(v) : formatNumber(v));

export function OverviewChart({ data, metric }: { data: OverviewPoint[]; metric: SeriesMetric }) {
  const reduce = useReducedMotion();
  const id = useId();
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TEAL} stopOpacity={0.25} />
            <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--adm-border)" strokeDasharray="3 4" />
        <XAxis
          dataKey="date"
          tickFormatter={formatAxisDate}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--adm-muted)', fontSize: 11 }}
          minTickGap={28}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={metric === 'revenue' ? 56 : 40}
          allowDecimals={false}
          tick={{ fill: 'var(--adm-muted)', fontSize: 11 }}
          tickFormatter={(v: number) => (metric === 'revenue' ? `₵${new Intl.NumberFormat('en-GB', { notation: 'compact' }).format(v)}` : new Intl.NumberFormat('en-GB', { notation: 'compact' }).format(v))}
        />
        <Tooltip
          cursor={{ stroke: 'var(--adm-muted)', strokeDasharray: '3 3' }}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as OverviewPoint | undefined;
            if (!active || !p) return null;
            return (
              <div style={tooltipBox}>
                <p style={{ color: 'var(--adm-muted)', marginBottom: 4 }}>{formatTooltipDate(p.date)}</p>
                <p style={{ fontWeight: 600 }}>{METRIC_LABEL[metric]}: {formatMetric(metric, p.value)}</p>
                {metric === 'revenue' && p.orders !== undefined && <p style={{ color: 'var(--adm-text-2)' }}>Orders: {formatNumber(p.orders)}</p>}
              </div>
            );
          }}
        />
        <Area type="monotone" dataKey="value" stroke={TEAL} strokeWidth={2.25} fill={`url(#${id})`} dot={false} activeDot={{ r: 4, fill: TEAL, stroke: 'var(--adm-card)', strokeWidth: 2 }} isAnimationActive={!reduce} animationDuration={1000} animationEasing="ease-out" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function WeekdayBars({ rows }: { rows: WeekdayRow[] }) {
  const reduce = useReducedMotion();
  const data = useMemo(() => rows.map((r) => ({ ...r, label: r.name.slice(0, 3) })), [rows]);
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="22%">
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--adm-muted)', fontSize: 11 }} />
        <Tooltip
          cursor={{ fill: 'transparent' }}
          content={({ active, payload }) => {
            const p = payload?.[0]?.payload as (WeekdayRow & { label: string }) | undefined;
            if (!active || !p) return null;
            return (
              <div style={tooltipBox}>
                <p style={{ color: 'var(--adm-muted)' }}>{p.name}</p>
                <p style={{ fontWeight: 600 }}>{formatNumber(p.page_views)} page views</p>
              </div>
            );
          }}
        />
        <Bar dataKey="page_views" radius={[6, 6, 6, 6]} isAnimationActive={!reduce} animationDuration={800} animationEasing="ease-out">
          {data.map((r) => (
            <Cell key={r.weekday} fill={r.is_peak ? TEAL : 'var(--adm-track)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
