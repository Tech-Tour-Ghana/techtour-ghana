// Date range handling for the analytics page. Ghana time is UTC+0 with no
// daylight saving, so UTC day boundaries are Ghana day boundaries and the SQL
// functions (which bucket in Africa/Accra) agree with what is computed here.

export type RangeKey = 'today' | '7d' | '30d' | '90d' | 'year' | 'custom';

export const RANGE_OPTIONS: { key: Exclude<RangeKey, 'custom'>; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'year', label: 'This year' },
];

export interface Range {
  key: RangeKey;
  /** Inclusive start, ISO timestamp, passed to the SQL functions as p_from. */
  from: string;
  /** Exclusive end, ISO timestamp, passed as p_to. */
  to: string;
  label: string;
  previousLabel: string;
  /** Inclusive YYYY-MM-DD bounds, for the custom picker inputs. */
  fromDate: string;
  toDate: string;
}

const DAY = 86_400_000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const startOfUtcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const fmt = (ms: number) =>
  new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function describe(fromMs: number, toMs: number): string {
  const lastDay = toMs - DAY;
  return lastDay <= fromMs ? fmt(fromMs) : `${fmt(fromMs)} to ${fmt(lastDay)}`;
}

function build(key: RangeKey, fromMs: number, toMs: number): Range {
  const span = toMs - fromMs;
  return {
    key,
    from: new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
    label: describe(fromMs, toMs),
    previousLabel: describe(fromMs - span, fromMs),
    fromDate: isoDate(fromMs),
    toDate: isoDate(toMs - DAY),
  };
}

export function resolveRange(
  params: { range?: string | null; from?: string | null; to?: string | null },
  now: Date = new Date(),
): Range {
  const tomorrow = startOfUtcDay(now) + DAY;
  const today = tomorrow - DAY;

  if (params.range === 'custom' && params.from && params.to && ISO_DATE.test(params.from) && ISO_DATE.test(params.to)) {
    const fromMs = Date.parse(`${params.from}T00:00:00Z`);
    const toMs = Date.parse(`${params.to}T00:00:00Z`) + DAY;
    if (!Number.isNaN(fromMs) && !Number.isNaN(toMs) && toMs > fromMs) return build('custom', fromMs, toMs);
  }

  switch (params.range) {
    case 'today':
      return build('today', today, tomorrow);
    case '7d':
      return build('7d', today - 6 * DAY, tomorrow);
    case '90d':
      return build('90d', today - 89 * DAY, tomorrow);
    case 'year':
      return build('year', Date.UTC(new Date(today).getUTCFullYear(), 0, 1), tomorrow);
    default:
      return build('30d', today - 29 * DAY, tomorrow);
  }
}

/** The query string that reproduces a range, so a view can be shared and survives a reload. */
export function rangeToSearch(range: Pick<Range, 'key' | 'fromDate' | 'toDate'>): string {
  return range.key === 'custom' ? `?range=custom&from=${range.fromDate}&to=${range.toDate}` : `?range=${range.key}`;
}
