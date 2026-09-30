'use client';

// Tours, categories, schedules, bookings and reviews. Replaces the old Django
// admin's tour management. Every table already has admin write policies (0003,
// 0011, 0012), so this page is only the UI. Bookings are created by customers
// and only their status is changed here, reviews are only moderated.

import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { notify } from '@/components/admin/toast';
import UrlWithPicker from '@/components/admin/UrlWithPicker';
import { BRAND, IconButton, StatusSelect, TableCard, Tabs, Toggle, fmtDate, rowClass, useAdminTheme, confirmAction } from '@/components/admin/ui';
import type { Database } from '@/types/database';

type Tab = 'tours' | 'categories' | 'schedules' | 'bookings' | 'reviews';
type Tour = Database['public']['Tables']['tours']['Row'];
type Category = Database['public']['Tables']['tour_categories']['Row'];
type Schedule = Database['public']['Tables']['tour_schedules']['Row'];
type BookingStatus = Database['public']['Enums']['booking_status'];
type ReviewStatus = Database['public']['Enums']['review_status'];
type Booking = Database['public']['Tables']['bookings']['Row'] & { tours: { title: string } | null };
type Review = Database['public']['Tables']['tour_reviews']['Row'] & { tours: { title: string } | null };

const BOOKING_STATUSES: readonly BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'completed'];
const REVIEW_STATUSES: readonly ReviewStatus[] = ['pending', 'approved', 'rejected'];

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function AdminToursPage() {
  const t = useAdminTheme();
  const supabase = createBrowserClient();
  const [tab, setTab] = useState<Tab>('tours');
  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState<Tour[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [tourForm, setTourForm] = useState({ title: '', category_id: '', location: '', region: '', price: '', duration_days: '1', short_description: '', featured_image_url: '' });
  const [catName, setCatName] = useState('');
  const [schedForm, setSchedForm] = useState({ tour_id: '', start_date: '', end_date: '', available_spots: '10' });

  const load = useCallback(async () => {
    const db = createBrowserClient();
    const [a, b, c, d, e] = await Promise.all([
      db.from('tours').select('*').order('created_at', { ascending: false }),
      db.from('tour_categories').select('*').order('sort_order'),
      db.from('tour_schedules').select('*').order('start_date', { ascending: false }),
      db.from('bookings').select('*, tours(title)').order('created_at', { ascending: false }),
      db.from('tour_reviews').select('*, tours(title)').order('created_at', { ascending: false }),
    ]);
    setTours(a.data ?? []);
    setCategories(b.data ?? []);
    setSchedules(c.data ?? []);
    setBookings((d.data as Booking[]) ?? []);
    setReviews((e.data as Review[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const tourTitle = (id: string) => tours.find((x) => x.id === id)?.title ?? '-';
  const fail = (msg: string) => notify(msg);

  async function toggleTour(tour: Tour, key: 'is_active' | 'is_featured') {
    const patch = key === 'is_active' ? { is_active: !tour.is_active } : { is_featured: !tour.is_featured };
    const { error } = await supabase.from('tours').update(patch).eq('id', tour.id);
    if (error) return fail(error.message);
    setTours((prev) => prev.map((x) => (x.id === tour.id ? { ...x, [key]: !tour[key] } : x)));
  }

  async function remove(table: 'tours' | 'tour_categories' | 'tour_schedules' | 'tour_reviews', id: string) {
    if (!(await confirmAction({ message: 'Delete this item? This cannot be undone.', danger: true }))) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) return fail(error.message);
    load();
  }

  async function addTour(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('tours').insert({
      title: tourForm.title.trim(),
      slug: slugify(tourForm.title),
      category_id: tourForm.category_id || null,
      location: tourForm.location.trim(),
      region: tourForm.region.trim(),
      price: Number(tourForm.price),
      duration_days: Number(tourForm.duration_days),
      short_description: tourForm.short_description.trim(),
      description: tourForm.short_description.trim(),
      featured_image_url: tourForm.featured_image_url.trim(),
    });
    if (error) return fail(error.message);
    setTourForm({ title: '', category_id: '', location: '', region: '', price: '', duration_days: '1', short_description: '', featured_image_url: '' });
    load();
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('tour_categories').insert({ name: catName.trim(), slug: slugify(catName), sort_order: categories.length });
    if (error) return fail(error.message);
    setCatName('');
    load();
  }

  async function toggleCategory(c: Category) {
    const { error } = await supabase.from('tour_categories').update({ is_active: !c.is_active }).eq('id', c.id);
    if (error) return fail(error.message);
    setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: !c.is_active } : x)));
  }

  async function addSchedule(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('tour_schedules').insert({
      tour_id: schedForm.tour_id,
      start_date: schedForm.start_date,
      end_date: schedForm.end_date,
      available_spots: Number(schedForm.available_spots),
    });
    if (error) return fail(error.message);
    setSchedForm({ tour_id: '', start_date: '', end_date: '', available_spots: '10' });
    load();
  }

  async function cancelSchedule(s: Schedule) {
    const { error } = await supabase.from('tour_schedules').update({ is_cancelled: !s.is_cancelled }).eq('id', s.id);
    if (error) return fail(error.message);
    setSchedules((prev) => prev.map((x) => (x.id === s.id ? { ...x, is_cancelled: !s.is_cancelled } : x)));
  }

  async function setBookingStatus(id: string, status: BookingStatus) {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) return fail(error.message);
    setBookings((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
  }

  async function setReviewStatus(id: string, status: ReviewStatus) {
    const { error } = await supabase.from('tour_reviews').update({ status }).eq('id', id);
    if (error) return fail(error.message);
    setReviews((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
  }

  const input = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textPrimary };
  const inputCls = 'px-3 py-2 rounded-lg text-sm';
  const submit = (label: string) => (
    <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: BRAND.teal }}>{label}</button>
  );
  const del = (table: Parameters<typeof remove>[0], id: string) => (
    <IconButton title="Delete" color={BRAND.red} onClick={() => remove(table, id)}>
      <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
    </IconButton>
  );
  const formCard = 'rounded-xl p-4 grid gap-3 md:grid-cols-4';
  const cardStyle = { background: t.cardBg, border: `1px solid ${t.border}` };

  return (
    <AdminLayout title="Tours" subtitle="Tours, schedules, bookings and reviews">
      <div className="space-y-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'tours' as const, label: 'Tours', count: tours.length },
            { key: 'categories' as const, label: 'Categories', count: categories.length },
            { key: 'schedules' as const, label: 'Schedules', count: schedules.length },
            { key: 'bookings' as const, label: 'Bookings', count: bookings.length },
            { key: 'reviews' as const, label: 'Reviews', count: reviews.length },
          ]}
        />

        {tab === 'tours' && (
          <>
            <form onSubmit={addTour} className={formCard} style={cardStyle}>
              <input required value={tourForm.title} onChange={(e) => setTourForm({ ...tourForm, title: e.target.value })} placeholder="Title" className={inputCls} style={input} />
              <select value={tourForm.category_id} onChange={(e) => setTourForm({ ...tourForm, category_id: e.target.value })} className={inputCls} style={input}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input value={tourForm.location} onChange={(e) => setTourForm({ ...tourForm, location: e.target.value })} placeholder="Location" className={inputCls} style={input} />
              <input value={tourForm.region} onChange={(e) => setTourForm({ ...tourForm, region: e.target.value })} placeholder="Region" className={inputCls} style={input} />
              <input required type="number" min="0" step="0.01" value={tourForm.price} onChange={(e) => setTourForm({ ...tourForm, price: e.target.value })} placeholder="Price (GHS)" className={inputCls} style={input} />
              <input required type="number" min="1" value={tourForm.duration_days} onChange={(e) => setTourForm({ ...tourForm, duration_days: e.target.value })} placeholder="Days" className={inputCls} style={input} />
              <UrlWithPicker inputStyle={input} placeholder="Image URL or choose from the Media Library" value={tourForm.featured_image_url} onChange={(v) => setTourForm({ ...tourForm, featured_image_url: v })} />
              {submit('Add tour')}
              <textarea value={tourForm.short_description} onChange={(e) => setTourForm({ ...tourForm, short_description: e.target.value })} placeholder="Short description" rows={2} className={`md:col-span-4 ${inputCls}`} style={input} />
            </form>
            <TableCard loading={loading} empty={tours.length === 0} headers={['Tour', 'Location', 'Price', 'Days', 'Active', 'Featured', '']}>
              {tours.map((x) => (
                <tr key={x.id} className={rowClass} style={{ borderColor: t.border }}>
                  <td className="px-4 py-3 font-medium" style={{ color: t.textPrimary }}>{x.title}</td>
                  <td className="px-4 py-3" style={{ color: t.textSecondary }}>{[x.location, x.region].filter(Boolean).join(', ') || '-'}</td>
                  <td className="px-4 py-3" style={{ color: t.textSecondary }}>{x.currency} {x.price.toFixed(2)}</td>
                  <td className="px-4 py-3" style={{ color: t.textSecondary }}>{x.duration_days}</td>
                  <td className="px-4 py-3"><Toggle on={x.is_active} label={x.is_active ? 'Active' : 'Hidden'} onClick={() => toggleTour(x, 'is_active')} /></td>
                  <td className="px-4 py-3"><Toggle on={x.is_featured} label={x.is_featured ? 'Featured' : 'Standard'} onClick={() => toggleTour(x, 'is_featured')} /></td>
                  <td className="px-4 py-3">{del('tours', x.id)}</td>
                </tr>
              ))}
            </TableCard>
          </>
        )}

        {tab === 'categories' && (
          <>
            <form onSubmit={addCategory} className="flex gap-3">
              <input required value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Category name" className={`${inputCls} flex-1`} style={input} />
              {submit('Add category')}
            </form>
            <TableCard loading={loading} empty={categories.length === 0} headers={['Name', 'Slug', 'Active', '']}>
              {categories.map((c) => (
                <tr key={c.id} className={rowClass} style={{ borderColor: t.border }}>
                  <td className="px-4 py-3 font-medium" style={{ color: t.textPrimary }}>{c.name}</td>
                  <td className="px-4 py-3" style={{ color: t.textSecondary }}>{c.slug}</td>
                  <td className="px-4 py-3"><Toggle on={c.is_active} label={c.is_active ? 'Active' : 'Hidden'} onClick={() => toggleCategory(c)} /></td>
                  <td className="px-4 py-3">{del('tour_categories', c.id)}</td>
                </tr>
              ))}
            </TableCard>
          </>
        )}

        {tab === 'schedules' && (
          <>
            <form onSubmit={addSchedule} className={formCard} style={cardStyle}>
              <select required value={schedForm.tour_id} onChange={(e) => setSchedForm({ ...schedForm, tour_id: e.target.value })} className={inputCls} style={input}>
                <option value="">Choose a tour</option>
                {tours.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
              </select>
              <input required type="date" value={schedForm.start_date} onChange={(e) => setSchedForm({ ...schedForm, start_date: e.target.value })} className={inputCls} style={input} />
              <input required type="date" value={schedForm.end_date} onChange={(e) => setSchedForm({ ...schedForm, end_date: e.target.value })} className={inputCls} style={input} />
              <div className="flex gap-3">
                <input required type="number" min="1" value={schedForm.available_spots} onChange={(e) => setSchedForm({ ...schedForm, available_spots: e.target.value })} className={`${inputCls} w-24`} style={input} />
                {submit('Add')}
              </div>
            </form>
            <TableCard loading={loading} empty={schedules.length === 0} headers={['Tour', 'Dates', 'Spots', 'Status', '']}>
              {schedules.map((s) => (
                <tr key={s.id} className={rowClass} style={{ borderColor: t.border }}>
                  <td className="px-4 py-3 font-medium" style={{ color: t.textPrimary }}>{tourTitle(s.tour_id)}</td>
                  <td className="px-4 py-3" style={{ color: t.textSecondary }}>{fmtDate(s.start_date)} to {fmtDate(s.end_date)}</td>
                  <td className="px-4 py-3" style={{ color: t.textSecondary }}>{s.booked_spots}/{s.available_spots}</td>
                  <td className="px-4 py-3"><Toggle on={!s.is_cancelled} label={s.is_cancelled ? 'Cancelled' : 'Open'} onClick={() => cancelSchedule(s)} /></td>
                  <td className="px-4 py-3">{del('tour_schedules', s.id)}</td>
                </tr>
              ))}
            </TableCard>
          </>
        )}

        {tab === 'bookings' && (
          <TableCard loading={loading} empty={bookings.length === 0} headers={['Reference', 'Tour', 'Contact', 'Guests', 'Total', 'Payment', 'Status', 'Date']}>
            {bookings.map((b) => (
              <tr key={b.id} className={rowClass} style={{ borderColor: t.border }}>
                <td className="px-4 py-3 font-medium" style={{ color: t.textPrimary }}>{b.booking_reference}</td>
                <td className="px-4 py-3" style={{ color: t.textSecondary }}>{b.tours?.title ?? '-'}</td>
                <td className="px-4 py-3" style={{ color: t.textSecondary }}>{b.email}{b.phone ? ` / ${b.phone}` : ''}</td>
                <td className="px-4 py-3" style={{ color: t.textSecondary }}>{b.participants}</td>
                <td className="px-4 py-3" style={{ color: t.textPrimary }}>{b.currency} {b.total_price.toFixed(2)}</td>
                <td className="px-4 py-3" style={{ color: t.textSecondary }}>{b.payment_status}</td>
                <td className="px-4 py-3"><StatusSelect value={b.status} options={BOOKING_STATUSES} onChange={(s) => setBookingStatus(b.id, s)} /></td>
                <td className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>{fmtDate(b.created_at)}</td>
              </tr>
            ))}
          </TableCard>
        )}

        {tab === 'reviews' && (
          <TableCard loading={loading} empty={reviews.length === 0} headers={['Tour', 'Reviewer', 'Rating', 'Comment', 'Status', 'Date', '']}>
            {reviews.map((r) => (
              <tr key={r.id} className={rowClass} style={{ borderColor: t.border }}>
                <td className="px-4 py-3 font-medium" style={{ color: t.textPrimary }}>{r.tours?.title ?? '-'}</td>
                <td className="px-4 py-3" style={{ color: t.textSecondary }}>{r.user_name}<br /><span className="text-xs" style={{ color: t.textMuted }}>{r.user_email}</span></td>
                <td className="px-4 py-3" style={{ color: t.textSecondary }}>{r.rating}/5</td>
                <td className="px-4 py-3 max-w-xs text-xs" style={{ color: t.textSecondary }}>{r.comment}</td>
                <td className="px-4 py-3"><StatusSelect value={r.status} options={REVIEW_STATUSES} onChange={(s) => setReviewStatus(r.id, s)} /></td>
                <td className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>{fmtDate(r.created_at)}</td>
                <td className="px-4 py-3">{del('tour_reviews', r.id)}</td>
              </tr>
            ))}
          </TableCard>
        )}
      </div>
    </AdminLayout>
  );
}
