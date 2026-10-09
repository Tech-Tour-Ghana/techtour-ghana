'use client';

import type { ReactNode } from 'react';

import { Surface } from '@/components/admin/ui';

export function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Surface className="p-5">
      <h2 className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>{title}</h2>
      <p className="mb-4 text-xs" style={{ color: 'var(--adm-muted)' }}>{description}</p>
      <div className="space-y-4">{children}</div>
    </Surface>
  );
}

export function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px]" style={{ color: 'var(--adm-muted)' }}>{hint}</p>}
    </div>
  );
}

export const textClass = 'w-full px-3 py-2 text-sm';
