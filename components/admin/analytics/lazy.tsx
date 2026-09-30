'use client';

// Recharts is loaded on demand and only in the browser, so it never lands in the
// server render or in any bundle outside the analytics page.

import dynamic from 'next/dynamic';

import { ChartSkeleton, Skeleton } from './AnalyticsSkeleton';

export const Sparkline = dynamic(() => import('./charts').then((m) => m.Sparkline), {
  ssr: false,
  loading: () => <Skeleton className="h-11 w-full" />,
});

export const OverviewChart = dynamic(() => import('./charts').then((m) => m.OverviewChart), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export const WeekdayBars = dynamic(() => import('./charts').then((m) => m.WeekdayBars), {
  ssr: false,
  loading: () => <ChartSkeleton height={190} />,
});
