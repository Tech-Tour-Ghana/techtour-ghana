'use client';

// Shared building blocks for the admin pages. Everything reads the --adm-*
// tokens from app/globals.css (the same ones the Analytics dashboard uses), so
// bright and dim themes, radii, shadows and colours stay in one place.

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useEffect, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';

import { Skeleton } from '@/components/admin/analytics/AnalyticsSkeleton';
import { useTheme } from '@/context/ThemeContext';

export const BRAND = { teal: '#139EA2', orange: '#E6A64D', red: '#EF4444' };

/** Token-backed colours for pages that still style with inline objects. */
export function useAdminTheme() {
  const { isDimMode } = useTheme();
  return {
    isDimMode,
    cardBg: 'var(--adm-card)',
    textPrimary: 'var(--adm-text)',
    textSecondary: 'var(--adm-text-2)',
    textMuted: 'var(--adm-muted)',
    border: 'var(--adm-border)',
    inputBg: 'var(--adm-bg)',
    inputBorder: 'var(--adm-border)',
    chipBg: 'var(--adm-track)',
  };
}

export const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** Card surface: token radius, border and shadow. */
export function Surface({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`rounded-[var(--adm-radius-card)] ${className}`}
      style={{ background: 'var(--adm-card)', border: '1px solid var(--adm-border)', boxShadow: 'var(--adm-shadow)', color: 'var(--adm-text)', ...style }}
    >
      {children}
    </div>
  );
}

/** Pill tab group, the same control as the Analytics chart switcher. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-[var(--adm-radius-control)] p-1" style={{ background: 'var(--adm-track)' }} role="tablist">
      {tabs.map(({ key, label, count }) => {
        const active = key === value;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors"
            style={{
              background: active ? 'var(--adm-card)' : 'transparent',
              color: active ? 'var(--adm-primary)' : 'var(--adm-text-2)',
              boxShadow: active ? 'var(--adm-shadow)' : 'none',
            }}
          >
            {label}
            {count !== undefined && (
              <span className="rounded-full px-1.5 text-[10px] font-bold" style={{ background: 'var(--adm-track)', color: 'var(--adm-muted)' }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Empty state shared with the Analytics widgets' look. */
export function EmptyBlock({ title = 'Nothing here yet', body }: { title?: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'var(--adm-primary-soft)', color: 'var(--adm-primary)' }}>
        <FontAwesomeIcon icon={faInbox} className="h-4 w-4" />
      </span>
      <p className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>{title}</p>
      {body && <p className="mt-1 max-w-xs text-xs" style={{ color: 'var(--adm-muted)' }}>{body}</p>}
    </div>
  );
}

/** Skeleton rows while a list loads, in place of a lone spinner. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5" role="status" aria-label="Loading">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function TableCard({
  loading,
  empty,
  headers,
  children,
  emptyTitle,
  emptyBody,
}: {
  loading: boolean;
  empty: boolean;
  headers: string[];
  children: ReactNode;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  return (
    <Surface className="overflow-hidden">
      {loading ? (
        <ListSkeleton />
      ) : empty ? (
        <EmptyBlock title={emptyTitle} body={emptyBody} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--adm-border)' }}>
                {headers.map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </Surface>
  );
}

export const rowClass = 'border-b last:border-b-0 transition-colors hover:bg-black/[0.03]';

const controlStyle: CSSProperties = {
  background: 'var(--adm-bg)',
  border: '1px solid var(--adm-border)',
  color: 'var(--adm-text)',
  borderRadius: 'var(--adm-radius-control)',
};

export function StatusSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (next: T) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} className="px-2 py-1 text-xs capitalize" style={controlStyle}>
      {options.map((o) => (
        <option key={o} value={o}>{o.replace('_', ' ')}</option>
      ))}
    </select>
  );
}

export function IconButton({
  onClick,
  title,
  color = BRAND.teal,
  children,
  disabled,
}: {
  onClick: () => void;
  title: string;
  color?: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:opacity-80 disabled:opacity-40"
      style={{ background: `${color}22`, color }}
    >
      {children}
    </button>
  );
}

export function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={on ? { background: 'var(--adm-primary-soft)', color: 'var(--adm-primary)' } : { background: 'var(--adm-track)', color: 'var(--adm-muted)' }}
    >
      {label}
    </button>
  );
}

/** Primary, secondary and danger buttons with the analytics control radius. */
export function Button({
  variant = 'primary',
  className = '',
  style,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  const look: Record<string, CSSProperties> = {
    primary: { background: 'var(--adm-primary)', color: '#FFFFFF', border: '1px solid var(--adm-primary)' },
    secondary: { background: 'var(--adm-card)', color: 'var(--adm-text)', border: '1px solid var(--adm-border)' },
    danger: { background: 'var(--adm-error-soft)', color: 'var(--adm-error)', border: '1px solid transparent' },
  };
  return (
    <button
      {...props}
      className={`px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90 ${className}`}
      style={{ borderRadius: 'var(--adm-radius-control)', ...look[variant], ...style }}
    />
  );
}

/** Text input, select and textarea share this style. Spread onto the element's style prop. */
export const fieldStyle = controlStyle;

/** Modal on the design tokens. Closes on Escape and on backdrop click. */
export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidth = 'max-w-lg',
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--adm-overlay)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[90vh] w-full flex-col ${maxWidth}`}
        style={{ background: 'var(--adm-card)', border: '1px solid var(--adm-border)', borderRadius: 'var(--adm-radius-card)', boxShadow: 'var(--adm-shadow)', color: 'var(--adm-text)' }}
      >
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--adm-border)' }}>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold">{title}</h2>
            {subtitle && <p className="text-xs" style={{ color: 'var(--adm-text-2)' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'var(--adm-track)', color: 'var(--adm-text-2)' }}>
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t px-6 py-4" style={{ borderColor: 'var(--adm-border)' }}>{footer}</div>}
      </div>
    </div>
  );
}
