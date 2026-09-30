'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faPlus } from '@fortawesome/free-solid-svg-icons';

import type { Range } from '@/lib/analytics/range';

import DateRangePicker, { type RangeChange } from './DateRangePicker';

/**
 * Range selector, comparison period, Add Widget and Export. The page title
 * itself comes from AdminLayout's top bar. Export stays disabled, with the
 * reason on hover, until there is data to export.
 */
export default function AnalyticsHeader({
  range,
  onRangeChange,
  onAddWidget,
  onExport,
  canExport,
}: {
  range: Range;
  onRangeChange: (next: RangeChange) => void;
  onAddWidget: () => void;
  onExport: () => void;
  canExport: boolean;
}) {
  const secondary = {
    background: 'var(--adm-card)',
    border: '1px solid var(--adm-border)',
    borderRadius: 'var(--adm-radius-control)',
    color: 'var(--adm-text)',
  } as const;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs" style={{ color: 'var(--adm-text-2)' }}>
        Comparing with <span className="font-medium" style={{ color: 'var(--adm-text)' }}>{range.previousLabel}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <DateRangePicker range={range} onChange={onRangeChange} />
        <button onClick={onAddWidget} className="flex items-center gap-2 px-3 py-2 text-xs font-medium" style={secondary}>
          <FontAwesomeIcon icon={faPlus} className="h-3 w-3" style={{ color: 'var(--adm-primary)' }} />
          Add widget
        </button>
        <button
          onClick={onExport}
          disabled={!canExport}
          title={canExport ? 'Download the current period as CSV' : 'Export is available once the figures have loaded'}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: 'var(--adm-primary)', borderRadius: 'var(--adm-radius-control)' }}
        >
          <FontAwesomeIcon icon={faDownload} className="h-3 w-3" />
          Export
        </button>
      </div>
    </div>
  );
}
