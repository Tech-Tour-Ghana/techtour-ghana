'use client';

// Shared frame for the signed-in account pages: the dashboard chrome plus a
// section nav (real routes), a status banner and themed form helpers.

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import DashboardLayout from '@/components/DashboardLayout';

export const ACCOUNT_SECTIONS = [
  { label: 'Profile', href: '/auth/profile' },
  { label: 'Security', href: '/auth/security' },
  { label: 'Preferences', href: '/auth/settings' },
];

export type Status = { type: 'success' | 'error'; text: string } | null;

export function useAccountTheme() {
  const { isDimMode } = useTheme();
  return {
    isDimMode,
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    text: isDimMode ? '#FFFFFF' : '#111111',
    textSecondary: isDimMode ? '#B0B0B0' : '#4A4A4A',
    textMuted: isDimMode ? '#9CA3AF' : '#6B7280',
    border: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
    inputBg: isDimMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    inputBorder: isDimMode ? 'rgba(255,255,255,0.2)' : '#D1D5DB',
  };
}

export const inputClass =
  'w-full px-4 py-2.5 rounded-lg border text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 disabled:opacity-60';

export function StatusMessage({ status }: { status: Status }) {
  if (!status) return null;
  const ok = status.type === 'success';
  return (
    <div
      role={ok ? 'status' : 'alert'}
      className={`px-4 py-3 rounded-lg text-sm border ${
        ok
          ? 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
          : 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
      }`}
    >
      {status.text}
    </div>
  );
}

/** A titled card; `id` lets other pages deep link to the section. */
export function Section({ id, title, description, children }: { id?: string; title: string; description?: string; children: ReactNode }) {
  const t = useAccountTheme();
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="rounded-xl p-5 sm:p-6 scroll-mt-4" style={{ background: t.cardBg, border: `1px solid ${t.border}` }}>
      <h2 id={id ? `${id}-title` : undefined} className="text-base font-semibold" style={{ color: t.text }}>{title}</h2>
      {description && <p className="text-sm mt-1" style={{ color: t.textSecondary }}>{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function AccountShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const pathname = usePathname();
  const t = useAccountTheme();
  return (
    <DashboardLayout title={title} subtitle={subtitle}>
      <div className="max-w-4xl mx-auto lg:grid lg:grid-cols-[11rem_1fr] lg:gap-8">
        <nav aria-label="Account sections" className="mb-6 lg:mb-0">
          <ul className="flex lg:flex-col gap-1 overflow-x-auto">
            {ACCOUNT_SECTIONS.map((s) => {
              const active = pathname === s.href;
              return (
                <li key={s.href} className="flex-shrink-0">
                  <Link
                    href={s.href}
                    aria-current={active ? 'page' : undefined}
                    className="block px-3 py-2 text-sm font-medium rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
                    style={{ color: active ? '#0E7C80' : t.textSecondary, background: active ? 'rgba(19,158,162,0.12)' : 'transparent' }}
                  >
                    {s.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="space-y-6 min-w-0">{children}</div>
      </div>
    </DashboardLayout>
  );
}
