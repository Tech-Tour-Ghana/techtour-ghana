import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowsRotate,
  faBoxOpen,
  faCalendarDay,
  faChartLine,
  faEye,
  faFilter,
  faMoneyBillTrendUp,
  faReceipt,
  faUserPlus,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';

export type WidgetId =
  | 'visitors'
  | 'page_views'
  | 'orders'
  | 'revenue'
  | 'revenue_overview'
  | 'weekday'
  | 'repeat_rate'
  | 'conversion'
  | 'best_sellers'
  | 'new_customers'
  | 'returning_customers';

export interface WidgetDef {
  id: WidgetId;
  name: string;
  description: string;
  tag: string;
  icon: IconDefinition;
  defaultOn: boolean;
}

// Only widgets backed by real, aggregated data are listed. Profit, clicks,
// ratings, customer segmentation and locations are intentionally absent until
// the data behind them exists.
export const WIDGETS: WidgetDef[] = [
  { id: 'visitors', name: 'Visitors', description: 'Unique valid browsing sessions in the selected period.', tag: 'Audience', icon: faUsers, defaultOn: true },
  { id: 'page_views', name: 'Page Views', description: 'Total valid page views, repeat views in a session included.', tag: 'Audience', icon: faEye, defaultOn: true },
  { id: 'orders', name: 'Orders', description: 'Successful checkouts, one per paid transaction.', tag: 'Sales', icon: faReceipt, defaultOn: true },
  { id: 'revenue', name: 'Revenue', description: 'Gross successfully paid value in GH₵.', tag: 'Sales', icon: faMoneyBillTrendUp, defaultOn: true },
  { id: 'revenue_overview', name: 'Revenue Overview', description: 'Revenue, orders and average order value over time, switchable to visitors and page views.', tag: 'Performance', icon: faChartLine, defaultOn: true },
  { id: 'weekday', name: 'Most Active Day', description: 'Page views by weekday with the busiest day highlighted.', tag: 'Audience', icon: faCalendarDay, defaultOn: true },
  { id: 'repeat_rate', name: 'Repeat Customer Rate', description: 'Share of purchasing customers who have bought before.', tag: 'Customers', icon: faArrowsRotate, defaultOn: true },
  { id: 'conversion', name: 'Conversion Rate', description: 'Successful checkouts divided by visitors.', tag: 'Performance', icon: faFilter, defaultOn: true },
  { id: 'best_sellers', name: 'Best-Selling Products', description: 'Products ranked by units sold, with revenue and checkouts.', tag: 'Products', icon: faBoxOpen, defaultOn: true },
  { id: 'new_customers', name: 'New Customers', description: 'Customers whose first paid checkout falls in the period.', tag: 'Customers', icon: faUserPlus, defaultOn: false },
  { id: 'returning_customers', name: 'Returning Customers', description: 'Customers who bought in the period and had bought before.', tag: 'Customers', icon: faArrowsRotate, defaultOn: false },
];

export const DEFAULT_WIDGETS: WidgetId[] = WIDGETS.filter((w) => w.defaultOn).map((w) => w.id);

const STORAGE_KEY = 'admin_analytics_widgets';
const VALID = new Set<string>(WIDGETS.map((w) => w.id));

/** Widget choice is a per-browser convenience, kept in localStorage. It never fails the page. */
export function loadWidgets(): WidgetId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WIDGETS;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const ids = parsed.filter((id): id is WidgetId => typeof id === 'string' && VALID.has(id));
      return ids.length > 0 ? ids : DEFAULT_WIDGETS;
    }
  } catch {
    // Storage blocked or corrupt, fall back to the defaults.
  }
  return DEFAULT_WIDGETS;
}

export function saveWidgets(ids: WidgetId[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Not persisted, the choice still applies for this visit.
  }
}
