'use client';

// Tours, categories, departures, bookings and reviews in one place. Every table
// already has admin write policies (0003, 0011, 0012), so this page is only the
// UI. Bookings are created by customers and only their status changes here;
// reviews are only moderated.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { faCalendarDays, faClipboardList, faCommentDots, faMap } from '@fortawesome/free-solid-svg-icons';

import AdminLayout from '@/components/AdminLayout';
import BookingsPanel from '@/components/admin/tours/BookingsPanel';
import CategoriesPanel from '@/components/admin/tours/CategoriesPanel';
import ReviewsPanel from '@/components/admin/tours/ReviewsPanel';
import SchedulesPanel from '@/components/admin/tours/SchedulesPanel';
import ToursPanel from '@/components/admin/tours/ToursPanel';
import { Tabs, StatTile } from '@/components/admin/ui';
import type { Booking, Category, Review, Schedule, Tour } from '@/components/admin/tours/shared';
import { createBrowserClient } from '@/lib/supabase/client';

type Tab = 'tours' | 'categories' | 'schedules' | 'bookings' | 'reviews';

export default function AdminToursPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [tab, setTab] = useState<Tab>('tours');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tours, setTours] = useState<Tour[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [destinations, setDestinations] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    const [a, b, c, d, e, f] = await Promise.all([
      supabase.from('tours').select('*').order('created_at', { ascending: false }),
      supabase.from('tour_categories').select('*').order('sort_order'),
      supabase.from('tour_schedules').select('*').order('start_date', { ascending: false }),
      supabase.from('bookings').select('*, tours(title), tour_schedules(start_date, end_date)').order('created_at', { ascending: false }),
      supabase.rpc('admin_tour_reviews'),
      supabase.from('destinations').select('id, name').order('sort_order'),
    ]);
    if (a.error || b.error || c.error || d.error || e.error || f.error) setError('Some tour data could not be loaded. Please refresh.');
    else setError('');
    setTours(a.data ?? []);
    setCategories(b.data ?? []);
    setSchedules(c.data ?? []);
    setBookings((d.data as Booking[] | null) ?? []);
    setReviews((e.data as unknown as Review[] | null) ?? []);
    setDestinations(f.data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toISOString().slice(0, 10);
  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
  const pendingReviews = reviews.filter((r) => r.status === 'pending').length;
  const upcoming = schedules.filter((s) => !s.is_cancelled && s.end_date >= today).length;

  return (
    <AdminLayout title="Tours" subtitle="Tours, departures, bookings and reviews">
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={faMap} label="Active tours" value={tours.filter((t) => t.is_active).length} tone="info" />
        <StatTile icon={faCalendarDays} label="Upcoming departures" value={upcoming} tone="success" />
        <StatTile icon={faClipboardList} label="Pending bookings" value={pendingBookings} tone="warning" />
        <StatTile icon={faCommentDots} label="Reviews to moderate" value={pendingReviews} tone="warning" />
      </div>

      <div className="mb-4 overflow-x-auto">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'tours' as Tab, label: 'Tours', count: tours.length },
            { key: 'categories' as Tab, label: 'Categories', count: categories.length },
            { key: 'schedules' as Tab, label: 'Departures', count: schedules.length },
            { key: 'bookings' as Tab, label: 'Bookings', count: pendingBookings || bookings.length },
            { key: 'reviews' as Tab, label: 'Reviews', count: pendingReviews || reviews.length },
          ]}
        />
      </div>

      {error && <p role="alert" className="mb-4 rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>}

      {tab === 'tours' && <ToursPanel tours={tours} categories={categories} destinations={destinations} loading={loading} reload={load} />}
      {tab === 'categories' && <CategoriesPanel categories={categories} tours={tours} loading={loading} reload={load} />}
      {tab === 'schedules' && <SchedulesPanel schedules={schedules} tours={tours} loading={loading} reload={load} />}
      {tab === 'bookings' && <BookingsPanel bookings={bookings} loading={loading} reload={load} />}
      {tab === 'reviews' && <ReviewsPanel reviews={reviews} loading={loading} reload={load} />}
    </AdminLayout>
  );
}
