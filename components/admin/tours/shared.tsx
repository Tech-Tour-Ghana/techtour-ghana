'use client';

import type { ReactNode } from 'react';

import type { Database } from '@/types/database';

export type Tour = Database['public']['Tables']['tours']['Row'];
export type Category = Database['public']['Tables']['tour_categories']['Row'];
export type Schedule = Database['public']['Tables']['tour_schedules']['Row'];
export type BookingStatus = Database['public']['Enums']['booking_status'];
export type ReviewStatus = Database['public']['Enums']['review_status'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type CurrencyCode = Database['public']['Enums']['currency_code'];
export type Booking = Database['public']['Tables']['bookings']['Row'] & {
  tours: { title: string } | null;
  tour_schedules: { start_date: string; end_date: string } | null;
};
export type Review = Database['public']['Tables']['tour_reviews']['Row'] & { tours: { title: string } | null };

export interface ToursData {
  tours: Tour[];
  categories: Category[];
  schedules: Schedule[];
  bookings: Booking[];
  reviews: Review[];
}

export const CURRENCY_CODES: readonly CurrencyCode[] = ['GHS', 'USD', 'EUR', 'GBP'];
export const BOOKING_STATUSES: readonly BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'completed'];
export const REVIEW_STATUSES: readonly ReviewStatus[] = ['pending', 'approved', 'rejected'];

export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const money = (amount: number, currency: string) => `${currency} ${Number(amount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px]" style={{ color: 'var(--adm-muted)' }}>{hint}</span>}
    </label>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h3 className="mb-3 border-b pb-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--adm-muted)', borderColor: 'var(--adm-border)' }}>{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export const inputCls = 'w-full px-3 py-2 text-sm';
