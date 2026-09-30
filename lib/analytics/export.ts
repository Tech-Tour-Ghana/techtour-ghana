// CSV export of exactly what the dashboard is showing: the selected range, the
// KPI values with their previous-period comparison, the four time series and the
// best sellers. Built from the aggregated data already in memory, nothing more
// is fetched and nothing is invented.

import type { Range } from './range';
import type { Kpis, SeriesMetric, SeriesPoint, TopProduct } from './types';

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (...cells: (string | number)[]) => cells.map(cell).join(',');

const KPI_LABELS: [keyof Omit<Kpis, 'period' | 'previousPeriod' | 'currency'>, string][] = [
  ['visitors', 'Visitors (unique sessions)'],
  ['page_views', 'Page views'],
  ['orders', 'Orders (successful checkouts)'],
  ['revenue', 'Revenue (GHS)'],
  ['conversion_rate', 'Conversion rate (%)'],
  ['average_order_value', 'Average order value (GHS)'],
  ['purchasing_customers', 'Purchasing customers'],
  ['new_customers', 'New customers'],
  ['returning_customers', 'Returning customers'],
  ['repeat_customer_rate', 'Repeat customer rate (%)'],
  ['new_registrations', 'New registrations'],
];

export interface ExportData {
  range: Range;
  kpis: Kpis | null;
  series: Partial<Record<SeriesMetric, SeriesPoint[]>>;
  products: TopProduct[] | null;
}

export function buildAnalyticsCsv({ range, kpis, series, products }: ExportData): string {
  const lines: string[] = [row('TechTour Ghana analytics'), row('Period', range.label), row('Compared with', range.previousLabel), ''];

  if (kpis) {
    lines.push(row('Metric', 'Current', 'Previous', 'Change %', 'State'));
    for (const [key, label] of KPI_LABELS) {
      const g = kpis[key];
      lines.push(row(label, g.current, g.previous, g.changePercent ?? 'n/a', g.changeState));
    }
    lines.push('');
  }

  const metrics = (Object.keys(series) as SeriesMetric[]).filter((m) => series[m]);
  const first = metrics[0] ? series[metrics[0]] : undefined;
  if (first && metrics.length > 0) {
    lines.push(row('Date', ...metrics));
    first.forEach((point, i) => {
      lines.push(row(point.date, ...metrics.map((m) => series[m]?.[i]?.value ?? '')));
    });
    lines.push('');
  }

  if (products) {
    lines.push(row('Product', 'Units sold', 'Revenue (GHS)', 'Checkouts'));
    for (const p of products) lines.push(row(p.title, p.units_sold, p.revenue, p.checkouts));
  }

  return lines.join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
