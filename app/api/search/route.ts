// Live site search. Public data only: every query goes through the visitor's
// RLS-checked client, so inactive and unpublished rows never match.

import { NextResponse } from 'next/server';

import { BLOG_CATEGORIES } from '@/lib/content/blog';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const LIMIT = 5;

type Item = { label: string; sub: string; image: string; href: string };

// Static pages people look for by name or by what they want to do.
const PAGES = [
  { label: 'About us', href: '/about', words: 'about story mission team who we are values technology' },
  { label: 'Careers', href: '/about/careers', words: 'careers jobs work hiring roles' },
  { label: 'Partnerships', href: '/about/partnership', words: 'partner partnerships hotel operator agency ngo school' },
  { label: 'Contact us', href: '/about/contact-us', words: 'contact phone email address support help' },
  { label: 'FAQ', href: '/faq', words: 'faq questions help answers' },
  { label: 'Study abroad', href: '/services/study-abroad', words: 'study abroad university scholarship apply student' },
  { label: 'Dream vacations', href: '/services/dream-vacations', words: 'vacation rental stay accommodation' },
  { label: 'Refund policy', href: '/refund', words: 'refund cancel cancellation money back' },
  { label: 'Privacy policy', href: '/privacy', words: 'privacy data' },
  { label: 'Terms of service', href: '/terms', words: 'terms conditions' },
];

const cedi = (n: number) => `₵${Number(n).toLocaleString('en-GH', { maximumFractionDigits: 0 })}`;
const clip = (s: string, n = 80) => (s.length > n ? `${s.slice(0, n).trimEnd()}...` : s);

export async function GET(request: Request) {
  const raw = (new URL(request.url).searchParams.get('q') ?? '').trim().slice(0, 60);
  if (raw.length < 2) return NextResponse.json({ groups: [] });
  // LIKE wildcards and the characters that structure a PostgREST or() filter.
  const term = raw.replace(/[%_\\,()"]/g, ' ').replace(/\s+/g, ' ').trim();
  if (term.length < 2) return NextResponse.json({ groups: [] });
  const q = `%${term}%`;
  const lower = term.toLowerCase();
  const match = (cols: string[]) => cols.map((c) => `${c}.ilike.${q}`).join(',');

  const supabase = await createClient();
  const [tours, destinations, posts, products, artisans, rentals] = await Promise.all([
    supabase.from('tours').select('title, slug, short_description, location, region, price, featured_image_url').eq('is_active', true).or(match(['title', 'short_description', 'location', 'region'])).limit(LIMIT),
    supabase.from('destinations').select('name, slug, description, image_url').eq('is_active', true).or(match(['name', 'description'])).limit(LIMIT),
    supabase.from('blog_posts').select('title, slug, category, excerpt, image_url').eq('is_published', true).or(match(['title', 'excerpt'])).limit(LIMIT),
    supabase.from('market_products').select('title, slug, price, discount_price, image_url, artisans(name)').eq('is_active', true).or(match(['title', 'description'])).limit(LIMIT),
    supabase.from('artisans').select('name, slug, craft_type, location, profile_image_url').eq('is_active', true).or(match(['name', 'craft_type', 'location', 'specialties'])).limit(LIMIT),
    supabase.from('vacation_rentals').select('title, slug, location, price_per_night, main_image_url').eq('is_active', true).or(match(['title', 'location', 'region', 'description'])).limit(LIMIT),
  ]);

  // Titles that match come before rows that only match in the description.
  const byTitle = (a: Item, b: Item) => Number(b.label.toLowerCase().includes(lower)) - Number(a.label.toLowerCase().includes(lower));
  const join = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' · ');

  const groups = [
    {
      title: 'Tours',
      items: (tours.data ?? []).map((r): Item => ({ label: r.title, sub: join(r.location || r.region, r.price > 0 && `from ${cedi(r.price)}`) || clip(r.short_description), image: r.featured_image_url, href: `/tours/${r.slug}` })),
    },
    {
      title: 'Destinations',
      items: (destinations.data ?? []).map((r): Item => ({ label: r.name, sub: clip(r.description), image: r.image_url, href: `/destinations/${r.slug}` })),
    },
    {
      title: 'Stays',
      items: (rentals.data ?? []).map((r): Item => ({ label: r.title, sub: join(r.location, r.price_per_night > 0 && `${cedi(r.price_per_night)} a night`), image: r.main_image_url, href: `/services/dream-vacations/${r.slug}` })),
    },
    {
      title: 'Market',
      items: (products.data ?? []).map((r): Item => {
        const price = r.discount_price !== null && r.discount_price < r.price ? r.discount_price : r.price;
        return { label: r.title, sub: join(r.artisans?.name && `by ${r.artisans.name}`, cedi(price)), image: r.image_url, href: `/market/${r.slug}` };
      }),
    },
    {
      title: 'Artisans',
      items: (artisans.data ?? []).map((r): Item => ({ label: r.name, sub: join(r.craft_type, r.location), image: r.profile_image_url, href: `/market/artisans/${r.slug}` })),
    },
    {
      title: 'Articles',
      items: (posts.data ?? []).map((r): Item => ({ label: r.title, sub: join(BLOG_CATEGORIES[r.category as keyof typeof BLOG_CATEGORIES]?.label ?? r.category, clip(r.excerpt, 60)), image: r.image_url, href: `/blog/${r.category}/${r.slug}` })),
    },
    {
      title: 'Pages',
      items: PAGES.filter((p) => `${p.label} ${p.words}`.toLowerCase().includes(lower)).slice(0, 4).map((p): Item => ({ label: p.label, sub: '', image: '', href: p.href })),
    },
  ]
    .map((g) => ({ ...g, items: g.items.sort(byTitle) }))
    .filter((g) => g.items.length > 0);

  return NextResponse.json({ groups });
}
