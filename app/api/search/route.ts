// Live site search. Public data only: every query goes through the visitor's
// RLS-checked client, so inactive and unpublished rows never match.

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const LIMIT = 4;

export async function GET(request: Request) {
  const raw = (new URL(request.url).searchParams.get('q') ?? '').trim().slice(0, 60);
  if (raw.length < 2) return NextResponse.json({ groups: [] });
  // Strip characters that mean something to LIKE.
  const q = `%${raw.replace(/[%_\\]/g, ' ')}%`;

  const supabase = await createClient();
  const [tours, destinations, posts, products, artisans, rentals] = await Promise.all([
    supabase.from('tours').select('title, slug').eq('is_active', true).ilike('title', q).limit(LIMIT),
    supabase.from('destinations').select('name, slug').eq('is_active', true).ilike('name', q).limit(LIMIT),
    supabase.from('blog_posts').select('title, slug, category').eq('is_published', true).ilike('title', q).limit(LIMIT),
    supabase.from('market_products').select('title, slug').eq('is_active', true).ilike('title', q).limit(LIMIT),
    supabase.from('artisans').select('name, slug').eq('is_active', true).ilike('name', q).limit(LIMIT),
    supabase.from('vacation_rentals').select('title, slug').eq('is_active', true).ilike('title', q).limit(LIMIT),
  ]);

  const groups = [
    { title: 'Tours', items: (tours.data ?? []).map((r) => ({ label: r.title, href: `/tours/${r.slug}` })) },
    { title: 'Destinations', items: (destinations.data ?? []).map((r) => ({ label: r.name, href: `/destinations/${r.slug}` })) },
    { title: 'Articles', items: (posts.data ?? []).map((r) => ({ label: r.title, href: `/blog/${r.category}/${r.slug}` })) },
    { title: 'Market', items: (products.data ?? []).map((r) => ({ label: r.title, href: `/market/${r.slug}` })) },
    { title: 'Artisans', items: (artisans.data ?? []).map((r) => ({ label: r.name, href: `/market/artisans/${r.slug}` })) },
    { title: 'Stays', items: (rentals.data ?? []).map((r) => ({ label: r.title, href: `/services/dream-vacations/${r.slug}` })) },
  ].filter((g) => g.items.length > 0);

  return NextResponse.json({ groups });
}
