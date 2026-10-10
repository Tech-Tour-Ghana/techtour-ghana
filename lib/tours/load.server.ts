import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

export const TOURS_PER_PAGE = 12;

/** The order the destination categories appear in, as chosen for the site. */
export const DESTINATION_ORDER = ['accra', 'kumasi', 'cape-coast', 'volta', 'northern'];

export type TourSort = 'recommended' | 'price-asc' | 'price-desc' | 'rating' | 'duration';
export const DURATIONS = [
  { value: '1', label: '1 day', min: 1, max: 1 },
  { value: '2-3', label: '2 to 3 days', min: 2, max: 3 },
  { value: '4+', label: '4 days or more', min: 4, max: null },
] as const;

export const SORTS: { value: TourSort; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'duration', label: 'Shortest first' },
];

export interface TourCardData {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  featured_image_url: string;
  location: string;
  region: string;
  price: number;
  discount_price: number | null;
  currency: string;
  duration_days: number;
  rating: number;
  review_count: number;
  is_featured: boolean;
  destination: { name: string; slug: string } | null;
  next_departure: string | null;
  spots_left: number | null;
}

export const getDestinations = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from('destinations').select('id, slug, name').eq('is_active', true);
  const rank = (slug: string) => { const i = DESTINATION_ORDER.indexOf(slug); return i === -1 ? 99 : i; };
  return (data ?? []).sort((a, b) => rank(a.slug) - rank(b.slug));
});

const today = () => new Date().toISOString().slice(0, 10);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toCard(row: any): TourCardData {
  const upcoming = ((row.tour_schedules ?? []) as { start_date: string; is_cancelled: boolean; available_spots: number; booked_spots: number }[])
    .filter((s) => !s.is_cancelled && s.start_date >= today() && s.available_spots > s.booked_spots)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const next = upcoming[0];
  return {
    id: row.id, slug: row.slug, title: row.title, short_description: row.short_description, featured_image_url: row.featured_image_url,
    location: row.location, region: row.region, price: Number(row.price), discount_price: row.discount_price === null ? null : Number(row.discount_price),
    currency: row.currency, duration_days: row.duration_days, rating: Number(row.rating), review_count: row.review_count, is_featured: row.is_featured,
    destination: row.destinations ? { name: row.destinations.name, slug: row.destinations.slug } : null,
    next_departure: next?.start_date ?? null,
    spots_left: next ? next.available_spots - next.booked_spots : null,
  };
}

export const CARD_SELECT = 'id, slug, title, short_description, featured_image_url, location, region, price, discount_price, currency, duration_days, rating, review_count, is_featured, destinations(name, slug), tour_schedules(start_date, is_cancelled, available_spots, booked_spots)';

/** One page of active tours, optionally for one destination and/or matching a search. */
export async function getTourListing(opts: { destination?: string; q?: string; sort?: TourSort; page?: string; min?: string; max?: string; days?: string }) {
  const supabase = await createClient();
  const destinations = await getDestinations();
  const dest = destinations.find((d) => d.slug === opts.destination);

  const { data: counts } = await supabase.from('tours').select('destination_id').eq('is_active', true);
  const countBy: Record<string, number> = {};
  for (const r of counts ?? []) if (r.destination_id) countBy[r.destination_id] = (countBy[r.destination_id] ?? 0) + 1;

  const term = (opts.q ?? '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 60);
  const sort = opts.sort ?? 'recommended';
  const num = (v?: string) => { const n = Number.parseFloat(v ?? ''); return Number.isFinite(n) && n >= 0 ? n : undefined; };
  const min = num(opts.min);
  const max = num(opts.max);
  const duration = DURATIONS.find((d) => d.value === opts.days);

  const build = () => {
    let query = supabase.from('tours').select(CARD_SELECT, { count: 'exact' }).eq('is_active', true);
    if (dest) query = query.eq('destination_id', dest.id);
    if (min !== undefined) query = query.gte('price', min);
    if (max !== undefined) query = query.lte('price', max);
    if (duration) {
      query = query.gte('duration_days', duration.min);
      if (duration.max !== null) query = query.lte('duration_days', duration.max);
    }
    if (term) query = query.or(`title.ilike.%${term}%,location.ilike.%${term}%,region.ilike.%${term}%,short_description.ilike.%${term}%`);
    if (sort === 'price-asc') query = query.order('price', { ascending: true });
    else if (sort === 'price-desc') query = query.order('price', { ascending: false });
    else if (sort === 'rating') query = query.order('rating', { ascending: false });
    else if (sort === 'duration') query = query.order('duration_days', { ascending: true });
    else query = query.order('is_featured', { ascending: false }).order('rating', { ascending: false });
    return query.order('title', { ascending: true });
  };

  const first = await build().range(0, TOURS_PER_PAGE - 1);
  const total = first.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / TOURS_PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(opts.page ?? '1', 10) || 1));
  const rows = page === 1 ? first.data : (await build().range((page - 1) * TOURS_PER_PAGE, page * TOURS_PER_PAGE - 1)).data;

  return {
    tours: (rows ?? []).map(toCard),
    total, page, pages,
    destinations: destinations.map((d) => ({ slug: d.slug, name: d.name, count: countBy[d.id] ?? 0 })),
    allCount: Object.values(countBy).reduce((a, b) => a + b, 0) + ((counts ?? []).filter((r) => !r.destination_id).length),
    activeDestination: dest?.slug,
    q: term,
    sort,
    min: min === undefined ? '' : String(min),
    max: max === undefined ? '' : String(max),
    days: duration?.value ?? '',
  };
}
