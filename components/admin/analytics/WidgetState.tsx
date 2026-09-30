import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartSimple, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

/** Designed empty state: says what is missing and why, never shows placeholder numbers. */
export function EmptyState({
  title,
  body,
  icon = faChartSimple,
  compact = false,
}: {
  title: string;
  body?: string;
  icon?: IconDefinition;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6' : 'py-10'}`}>
      <span
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
        style={{ background: 'var(--adm-primary-soft)', color: 'var(--adm-primary)' }}
      >
        <FontAwesomeIcon icon={icon} className="h-4 w-4" />
      </span>
      <p className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>{title}</p>
      {body && <p className="mt-1 max-w-xs text-xs" style={{ color: 'var(--adm-muted)' }}>{body}</p>}
    </div>
  );
}

/** Local failure for one widget. The rest of the page keeps working and the user can retry just this one. */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center" role="alert">
      <span
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
        style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}
      >
        <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4" />
      </span>
      <p className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>Could not load this widget</p>
      <p className="mt-1 max-w-xs text-xs" style={{ color: 'var(--adm-muted)' }}>{message}</p>
      <button
        onClick={onRetry}
        className="mt-3 rounded-[var(--adm-radius-control)] px-3 py-1.5 text-xs font-semibold text-white"
        style={{ background: 'var(--adm-primary)' }}
      >
        Try again
      </button>
    </div>
  );
}
