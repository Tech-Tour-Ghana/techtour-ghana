import type { Metadata } from 'next';
import Link from 'next/link';

import ContentShell, { cardStyle } from '@/components/content/ContentShell';
import Button from '@/components/ui/Button';
import TourCard from '@/components/tours/TourCard';
import { SORTS, getTourListing, type TourSort } from '@/lib/tours/load.server';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ destination?: string; q?: string; sort?: string; page?: string }>;

const description = 'Guided tours across Ghana: Accra, Kumasi, Cape Coast, the Volta Region and the Northern Region. Pick a date and reserve your place.';

// Filtered, searched, sorted and paginated views canonicalise to /tours and stay out of the index.
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const sp = await searchParams;
  const variant = Object.values(sp).some((v) => v !== undefined && v !== '');
  return {
    title: 'Tours Listings',
    description,
    alternates: { canonical: '/tours' },
    openGraph: { title: 'Tours Listings', description, url: '/tours', type: 'website' },
    twitter: { card: 'summary', title: 'Tours Listings', description },
    ...(variant ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ToursPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const sort = (SORTS.some((s) => s.value === sp.sort) ? sp.sort : 'recommended') as TourSort;
  const { tours, total, page, pages, destinations, allCount, activeDestination, q } = await getTourListing({ destination: sp.destination, q: sp.q, sort, page: sp.page });

  const href = (over: { destination?: string | null; page?: number }) => {
    const params = new URLSearchParams();
    const dest = over.destination === undefined ? activeDestination : over.destination;
    if (dest) params.set('destination', dest);
    if (q) params.set('q', q);
    if (sort !== 'recommended') params.set('sort', sort);
    if (over.page && over.page > 1) params.set('page', String(over.page));
    const qs = params.toString();
    return qs ? `/tours?${qs}` : '/tours';
  };

  const chip = (active: boolean) => ({
    background: active ? 'var(--sp-primary)' : 'var(--sp-bg-card)',
    color: active ? '#FFFFFF' : 'var(--sp-text-secondary)',
    border: '1px solid var(--sp-border)',
  });
  const field = { background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', color: 'var(--sp-text-primary)' };

  return (
    <ContentShell wide title="Tours" titleAccent="Listings" description="Guided tours across Ghana. Pick a destination, choose a date and reserve your place.">
      <nav aria-label="Destinations" className="-mx-4 mb-5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max gap-2 pb-1">
          <li><Link href={href({ destination: null })} aria-current={!activeDestination ? 'page' : undefined} className="block whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium" style={chip(!activeDestination)}>All Destinations <span>({allCount})</span></Link></li>
          {destinations.map((d) => (
            <li key={d.slug}>
              <Link href={href({ destination: d.slug })} aria-current={activeDestination === d.slug ? 'page' : undefined} className="block whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium" style={chip(activeDestination === d.slug)}>
                {d.name} <span>({d.count})</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <form method="get" action="/tours" className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem_auto]">
        {activeDestination && <input type="hidden" name="destination" value={activeDestination} />}
        <input type="search" name="q" defaultValue={q} placeholder="Search tours, places or activities" aria-label="Search tours" className="min-h-[2.75rem] w-full rounded-full px-5 text-sm" style={field} />
        <select name="sort" defaultValue={sort} aria-label="Sort tours" className="min-h-[2.75rem] w-full rounded-full px-4 text-sm" style={field}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <Button type="submit" variant="accent">Search</Button>
      </form>

      <p className="mb-4 text-sm" style={{ color: 'var(--sp-text-muted)' }} aria-live="polite">
        {total === 0 ? 'No tours found' : `${total} tour${total === 1 ? '' : 's'}`}{activeDestination ? ` in ${destinations.find((d) => d.slug === activeDestination)?.name}` : ''}{q ? ` for "${q}"` : ''}
        {(q || activeDestination) && <> · <Link href="/tours" className="font-semibold underline">Clear filters</Link></>}
      </p>

      {tours.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={cardStyle}>
          <h2 className="mb-2 text-xl font-semibold">No tours match</h2>
          <p style={{ color: 'var(--sp-text-secondary)' }}>Try another destination or a different search.</p>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((t) => <li key={t.id}><TourCard tour={t} /></li>)}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {page > 1 && <Link href={href({ page: page - 1 })} rel="prev" className="rounded-full px-4 py-2 text-sm font-medium" style={chip(false)}>Previous</Link>}
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={href({ page: n })} aria-current={n === page ? 'page' : undefined} className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium" style={chip(n === page)}>{n}</Link>
          ))}
          {page < pages && <Link href={href({ page: page + 1 })} rel="next" className="rounded-full px-4 py-2 text-sm font-medium" style={chip(false)}>Next</Link>}
        </nav>
      )}
    </ContentShell>
  );
}
