'use client';

// Shared building blocks for the admin pages. Everything reads the --adm-*
// tokens from app/globals.css (the same ones the Analytics dashboard uses), so
// bright and dim themes, radii, shadows and colours stay in one place.

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faInbox, faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';

import { notify } from '@/components/admin/toast';
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
                {headers.map((h, i) => (
                  <th key={`${i}-${h}`} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>
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
const modalStack: object[] = [];

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
  const dialog = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  // Escape and Tab only act on the topmost dialog, so a picker opened from
  // another dialog closes on its own. Focus moves in and returns on close.
  useEffect(() => {
    const token = {};
    modalStack.push(token);
    const opener = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(dialog.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? []).filter((el) => !el.closest('[aria-hidden="true"]') && el.offsetParent !== null);
    const list = focusables();
    (list.find((el) => el.hasAttribute('autofocus')) ?? list[1] ?? list[0] ?? dialog.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== token) return;
      if (e.key === 'Escape') { closeRef.current(); return; }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      modalStack.splice(modalStack.indexOf(token), 1);
      opener?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--adm-overlay)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialog}
        tabIndex={-1}
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

/** Plain-language version of the usual database errors. */
function friendly(e: { message: string; code?: string }): string {
  const m = e.message;
  if (e.code === '23503' || /foreign key/i.test(m)) {
    if (/bookings/i.test(m)) return 'it has bookings. Deactivate it instead of deleting it.';
    return 'something else still depends on it. Remove or reassign the linked items first.';
  }
  if (e.code === '23505' || /duplicate key|unique constraint/i.test(m)) return 'that value (usually the slug, name or email) is already used. Pick a different one.';
  if (e.code === '23502' || /null value in column/i.test(m)) {
    const col = /column "([^"]+)"/.exec(m)?.[1];
    return col ? `"${col.replace(/_/g, ' ')}" is required.` : 'a required field is empty.';
  }
  if (e.code === '23514' || /check constraint/i.test(m)) {
    const rule = /constraint "([^"]+)"/.exec(m)?.[1];
    return rule ? `a value is out of range (${rule.replace(/_/g, ' ')}).` : 'a value is out of range.';
  }
  if (e.code === '22P02' || /invalid input syntax/i.test(m)) return 'a field has a value in the wrong format (date, number or id).';
  if (e.code === '42501' || /row-level security|permission denied/i.test(m)) return 'you do not have permission, or the item is hidden from your account.';
  return m;
}

/** Tell the admin when a write failed. Returns true on failure so the caller can keep the form open. */
export function reportError(error: { message: string; code?: string } | null | undefined): boolean {
  if (error) notify(`That didn't save: ${friendly(error)}`);
  return !!error;
}

/** Search box used by every list page: same look, clear button, accessible label. */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  label = 'Search',
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2" style={{ color: 'var(--adm-muted)' }} />
      <input
        type="search"
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-2 pl-8 pr-8 text-sm"
        style={controlStyle}
      />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--adm-muted)' }}>
          <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

const TONES = {
  success: { bg: 'var(--adm-success-soft)', color: 'var(--adm-success)' },
  danger: { bg: 'var(--adm-error-soft)', color: 'var(--adm-error)' },
  warning: { bg: 'rgba(245, 158, 11, 0.15)', color: '#B45309' },
  info: { bg: 'var(--adm-primary-soft)', color: 'var(--adm-primary)' },
  neutral: { bg: 'var(--adm-track)', color: 'var(--adm-text-2)' },
} as const;

export type Tone = keyof typeof TONES;

/** Small status label. Always carries text (and optionally an icon), never colour alone. */
export function StatusPill({ tone = 'neutral', icon, children }: { tone?: Tone; icon?: IconDefinition; children: ReactNode }) {
  const t = TONES[tone];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: t.bg, color: t.color }}>
      {icon && <FontAwesomeIcon icon={icon} className="h-2.5 w-2.5" />}
      {children}
    </span>
  );
}

/** Round avatar: the photo when there is one, otherwise initials on a brand tint. */
export function Avatar({ name, src, size = 32 }: { name: string; src?: string | null; size?: number }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?';
  return (
    <span className="inline-flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full font-bold" style={{ width: size, height: size, fontSize: size * 0.38, background: 'var(--adm-primary-soft)', color: 'var(--adm-primary)' }}>
      {src
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={src} alt="" className="h-full w-full object-cover" />
        : initials}
    </span>
  );
}

/** Row above a list: search and filters on the left, the primary action on the right. */
export function Toolbar({ children, actions }: { children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {children}
      {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  /** Destructive actions get the red button. */
  danger?: boolean;
}

const CONFIRM_EVENT = 'admin:confirm';

/**
 * Replacement for window.confirm that works from any handler, no hook needed:
 *   if (!(await confirmAction({ message: 'Delete this?', danger: true }))) return;
 * <ConfirmHost /> is mounted once in AdminLayout.
 */
export function confirmAction(options: ConfirmOptions | string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    const detail = { ...(typeof options === 'string' ? { message: options } : options), resolve };
    window.dispatchEvent(new CustomEvent(CONFIRM_EVENT, { detail }));
  });
}

export function ConfirmHost() {
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);

  useEffect(() => {
    const onAsk = (e: Event) => setPending((e as CustomEvent).detail);
    window.addEventListener(CONFIRM_EVENT, onAsk);
    return () => window.removeEventListener(CONFIRM_EVENT, onAsk);
  }, []);

  if (!pending) return null;
  const close = (ok: boolean) => {
    pending.resolve(ok);
    setPending(null);
  };
  return (
    <Modal
      title={pending.title ?? (pending.danger ? 'Are you sure?' : 'Please confirm')}
      maxWidth="max-w-sm"
      onClose={() => close(false)}
      footer={
        <>
          <Button variant="secondary" onClick={() => close(false)}>Cancel</Button>
          <Button variant={pending.danger ? 'danger' : 'primary'} onClick={() => close(true)}>{pending.confirmLabel ?? (pending.danger ? 'Delete' : 'Confirm')}</Button>
        </>
      }
    >
      <p className="text-sm" style={{ color: 'var(--adm-text-2)' }}>{pending.message}</p>
    </Modal>
  );
}

/** Small headline number with a label, used above lists. */
export function StatTile({ icon, label, value, tone = 'info' }: { icon: IconDefinition; label: string; value: number | string; tone?: Tone }) {
  const t = TONES[tone];
  return (
    <Surface className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: t.bg, color: t.color }}>
        <FontAwesomeIcon icon={icon} className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xl font-bold leading-tight" style={{ color: 'var(--adm-text)' }}>{value}</p>
        <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>{label}</p>
      </div>
    </Surface>
  );
}

/** Download rows as a CSV file, quoting every cell so commas and quotes survive. */
export function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const body = [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
