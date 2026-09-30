// Loading placeholders shaped like the widgets they stand in for, so the page
// does not jump when data arrives and is never a lone centred spinner.

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`adm-skeleton ${className}`} style={style} aria-hidden />;
}

const surface = {
  background: 'var(--adm-card)',
  border: '1px solid var(--adm-border)',
  boxShadow: 'var(--adm-shadow)',
  borderRadius: 'var(--adm-radius-card)',
} as const;

export function KpiSkeleton() {
  return (
    <div className="p-5" style={surface} role="status" aria-label="Loading">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-8 w-32" />
      <Skeleton className="mt-3 h-3 w-40" />
    </div>
  );
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="flex items-end gap-2" style={{ height }} role="status" aria-label="Loading chart">
      {[40, 65, 50, 80, 60, 90, 70, 55, 85, 60, 75, 95].map((h, i) => (
        <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export function PanelSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="p-5" style={surface} role="status" aria-label="Loading">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="mt-5 w-full" style={{ height }} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading table">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

/** Whole-page fallback for Suspense before the dashboard mounts. */
export default function AnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <KpiSkeleton key={i} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="p-5 lg:col-span-2" style={surface}><ChartSkeleton /></div>
        <PanelSkeleton />
      </div>
    </div>
  );
}
