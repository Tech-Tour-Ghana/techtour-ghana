'use client';

// Small shared pieces for the admin list pages. Matches the look of the
// existing contacts and newsletter pages (same tokens, same table styling).

import type { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '@/context/ThemeContext';

export const BRAND = { teal: '#139EA2', orange: '#E6A64D', red: '#EF4444' };

export function useAdminTheme() {
  const { isDimMode } = useTheme();
  return {
    isDimMode,
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#111827',
    textSecondary: isDimMode ? '#B0B0B0' : '#4B5563',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    inputBg: isDimMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    inputBorder: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
    chipBg: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
  };
}

export const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (key: T) => void;
}) {
  const t = useAdminTheme();
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tabs.map(({ key, label, count }) => {
        const active = key === value;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition"
            style={{ background: active ? BRAND.teal : t.chipBg, color: active ? '#FFFFFF' : t.textSecondary }}
          >
            {label}
            {count !== undefined && <span className="text-[10px] font-bold opacity-70">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function TableCard({
  loading,
  empty,
  headers,
  children,
}: {
  loading: boolean;
  empty: boolean;
  headers: string[];
  children: ReactNode;
}) {
  const t = useAdminTheme();
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: t.cardBg, border: `1px solid ${t.border}` }}>
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 animate-spin" style={{ color: BRAND.teal }} />
        </div>
      ) : empty ? (
        <p className="p-6 text-sm text-center" style={{ color: t.textMuted }}>Nothing here yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: t.border }}>
                {headers.map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: t.textMuted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const rowClass = 'border-b last:border-b-0 transition hover:bg-black/5';

export function StatusSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (next: T) => void;
}) {
  const t = useAdminTheme();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="px-2 py-1 rounded-lg text-xs"
      style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textPrimary }}
    >
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
      disabled={disabled}
      className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80 disabled:opacity-40"
      style={{ background: `${color}22`, color }}
    >
      {children}
    </button>
  );
}

export function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  const t = useAdminTheme();
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={on ? { background: `${BRAND.teal}22`, color: BRAND.teal } : { background: t.chipBg, color: t.textMuted }}
    >
      {label}
    </button>
  );
}
