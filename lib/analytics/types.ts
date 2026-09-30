// Shapes returned by the analytics SQL functions in migration 0019. The
// dashboard only ever handles these already-aggregated values.

export type ChangeState = 'increase' | 'decrease' | 'flat' | 'new';

/** One metric for the selected period and the immediately preceding period of equal length. */
export interface Growth {
  current: number;
  previous: number;
  /** null when the previous period was 0 and the current one is not, show "New". */
  changePercent: number | null;
  changeState: ChangeState;
}

export interface Kpis {
  visitors: Growth;
  page_views: Growth;
  orders: Growth;
  revenue: Growth;
  conversion_rate: Growth;
  average_order_value: Growth;
  purchasing_customers: Growth;
  new_customers: Growth;
  returning_customers: Growth;
  repeat_customer_rate: Growth;
  new_registrations: Growth;
  period: { from: string; to: string };
  previousPeriod: { from: string; to: string };
  currency: 'GHS';
}

export type SeriesMetric = 'revenue' | 'orders' | 'visitors' | 'page_views';

export interface SeriesPoint {
  /** YYYY-MM-DD, or YYYY-MM-DDTHH:00 for windows of 48 hours or less. */
  date: string;
  value: number;
}

export interface WeekdayRow {
  weekday: number;
  name: string;
  page_views: number;
  is_peak: boolean;
}

export interface TopProduct {
  product_id: string;
  title: string;
  units_sold: number;
  revenue: number;
  checkouts: number;
}
