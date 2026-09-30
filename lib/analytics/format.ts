import type { Growth } from './types';

const nf = (max: number, min = 0) => new Intl.NumberFormat('en-GB', { minimumFractionDigits: min, maximumFractionDigits: max });

export const formatNumber = (n: number) => nf(0).format(n);

/** GH₵24,850 for whole amounts, GH₵1,284.50 when there are pesewas (never a lone .5). */
export const formatGHS = (n: number) => `GH₵${Number.isInteger(n) ? nf(0).format(n) : nf(2, 2).format(n)}`;

/** Always two decimals, for average order value. */
export const formatGHSExact = (n: number) => `GH₵${nf(2, 2).format(n)}`;

export const formatPercent = (n: number) => `${nf(1).format(n)}%`;

/** "+15.5%", "-10.5%", "0%", or "New" when there was nothing to compare against. */
export function formatChange(g: Growth): string {
  if (g.changeState === 'new') return 'New';
  const pct = g.changePercent ?? 0;
  if (pct === 0) return '0%';
  return `${pct > 0 ? '+' : ''}${nf(1).format(pct)}%`;
}

export function formatAxisDate(date: string): string {
  const d = new Date(date.length > 10 ? `${date}:00Z` : `${date}T00:00:00Z`);
  return date.length > 10
    ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export function formatTooltipDate(date: string): string {
  const d = new Date(date.length > 10 ? `${date}:00Z` : `${date}T00:00:00Z`);
  return date.length > 10
    ? d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
