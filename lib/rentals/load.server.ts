import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

export const RENTALS_PER_PAGE = 12;

export type RentalRow = Database['public']['Tables']['vacation_rentals']['Row'];
export type PropertyType = Database['public']['Enums']['rental_property_type'];

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'cottage', label: 'Cottage' },
  { value: 'studio', label: 'Studio' },
  { value: 'other', label: 'Other' },
];

export const typeLabel = (t: string) => PROPERTY_TYPES.find((p) => p.value === t)?.label ?? t;

/** Photos for a rental: the main image first, then the images array (strings or {url}), without repeats. */
export function rentalImages(r: Pick<RentalRow, 'main_image_url' | 'images'>): string[] {
  const extra = Array.isArray(r.images)
    ? r.images.map((i) => (typeof i === 'string' ? i : i && typeof i === 'object' && !Array.isArray(i) && typeof i.url === 'string' ? i.url : ''))
    : [];
  return [...new Set([r.main_image_url, ...extra].map((s) => s.trim()).filter(Boolean))];
}

/** Amenities are stored as one text field, split on new lines or commas. */
export const amenityList = (text: string) => text.split(/[\r\n,]+/).map((a) => a.trim()).filter(Boolean);

export const CARD_SELECT = 'id, slug, title, property_type, city, region, location, bedrooms, bathrooms, max_guests, price_per_night, currency, main_image_url, images, is_featured, is_available';
export type RentalCard = Pick<RentalRow, 'id' | 'slug' | 'title' | 'property_type' | 'city' | 'region' | 'location' | 'bedrooms' | 'bathrooms' | 'max_guests' | 'price_per_night' | 'currency' | 'main_image_url' | 'images' | 'is_featured' | 'is_available'>;

export const getRental = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from('vacation_rentals').select('*').eq('slug', slug).eq('is_active', true).maybeSingle();
  return data;
});

/** One page of active rentals, optionally for one property type and/or city and/or matching a search. */
export async function getRentalListing(opts: { type?: string; city?: string; q?: string; page?: string }) {
  const supabase = await createClient();
  const { data: facets } = await supabase.from('vacation_rentals').select('city, property_type').eq('is_active', true);
  const all = facets ?? [];
  const cities = [...new Set(all.map((r) => r.city.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const types = PROPERTY_TYPES.filter((p) => all.some((r) => r.property_type === p.value));
  const type = types.find((p) => p.value === opts.type)?.value;
  const city = cities.find((c) => c === opts.city);
  const term = (opts.q ?? '').replace(/[,()%*\\]/g, ' ').trim().slice(0, 60);

  const build = () => {
    let query = supabase.from('vacation_rentals').select(CARD_SELECT, { count: 'exact' }).eq('is_active', true);
    if (type) query = query.eq('property_type', type);
    if (city) query = query.eq('city', city);
    if (term) query = query.or(`title.ilike.%${term}%,location.ilike.%${term}%,city.ilike.%${term}%,region.ilike.%${term}%,description.ilike.%${term}%`);
    return query.order('is_featured', { ascending: false }).order('sort_order', { ascending: true }).order('title', { ascending: true });
  };

  const first = await build().range(0, RENTALS_PER_PAGE - 1);
  const total = first.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / RENTALS_PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(opts.page ?? '1', 10) || 1));
  const rows = page === 1 ? first.data : (await build().range((page - 1) * RENTALS_PER_PAGE, page * RENTALS_PER_PAGE - 1)).data;

  return { rentals: (rows ?? []) as RentalCard[], total, page, pages, types, cities, allCount: all.length, type, city, q: term };
}
