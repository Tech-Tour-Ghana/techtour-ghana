import type { Metadata } from 'next';
import Link from 'next/link';

import ContentShell, { cardStyle } from '@/components/content/ContentShell';
import RentalCard from '@/components/rentals/RentalCard';
import Button from '@/components/ui/Button';
import { getRentalListing } from '@/lib/rentals/load.server';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ type?: string; city?: string; q?: string; page?: string }>;

const description = 'Vacation rentals across Ghana: apartments, houses and villas for short stays. Browse, then enquire and we will arrange your stay.';

// Filtered, searched and paginated views canonicalise to the plain listing and stay out of the index.
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const sp = await searchParams;
  const variant = Object.values(sp).some((v) => v !== undefined && v !== '');
  return {
    title: 'Dream Vacations',
    description,
    alternates: { canonical: '/services/dream-vacations' },
    openGraph: { title: 'Dream Vacations', description, url: '/services/dream-vacations', type: 'website' },
    twitter: { card: 'summary', title: 'Dream Vacations', description },
    ...(variant ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function DreamVacationsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const { rentals, total, page, pages, types, cities, allCount, type, city, q } = await getRentalListing(sp);

  const href = (over: { type?: string | null; page?: number }) => {
    const params = new URLSearchParams();
    const t = over.type === undefined ? type : over.type;
    if (t) params.set('type', t);
    if (city) params.set('city', city);
    if (q) params.set('q', q);
    if (over.page && over.page > 1) params.set('page', String(over.page));
    const qs = params.toString();
    return qs ? `/services/dream-vacations?${qs}` : '/services/dream-vacations';
  };

  const chip = (active: boolean) => ({
    background: active ? 'var(--sp-primary)' : 'var(--sp-bg-card)',
    color: active ? 'var(--brand-white)' : 'var(--sp-text-secondary)',
    border: '1px solid var(--sp-border)',
  });
  const field = { background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', color: 'var(--sp-text-primary)' };
  const filtered = Boolean(type || city || q);

  return (
    <ContentShell wide title="Dream" titleAccent="Vacations" description="Rentals across Ghana for short stays. Choose a place, then send us an enquiry and we will arrange the rest.">
      {allCount === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={cardStyle}>
          <h2 className="mb-2 text-xl font-semibold">No rentals are listed yet</h2>
          <p className="mb-6" style={{ color: 'var(--sp-text-secondary)' }}>Our rentals are being added. In the meantime you can look at our guided tours, or get in touch and we will help you find a place to stay.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button href="/tours">Browse tours</Button>
            <Button href="/about/contact-us" variant="secondary">Contact us</Button>
          </div>
        </div>
      ) : (
        <>
          <nav aria-label="Property types" className="-mx-4 mb-5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="flex w-max gap-2 pb-1">
              <li><Link href={href({ type: null })} aria-current={!type ? 'page' : undefined} className="block whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium" style={chip(!type)}>All types</Link></li>
              {types.map((t) => (
                <li key={t.value}><Link href={href({ type: t.value })} aria-current={type === t.value ? 'page' : undefined} className="block whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium" style={chip(type === t.value)}>{t.label}</Link></li>
              ))}
            </ul>
          </nav>

          <form method="get" action="/services/dream-vacations" className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem_auto]">
            {type && <input type="hidden" name="type" value={type} />}
            <input type="search" name="q" defaultValue={q} placeholder="Search rentals or places" aria-label="Search rentals" className="min-h-[2.75rem] w-full rounded-full px-5 text-sm" style={field} />
            <select name="city" defaultValue={city ?? ''} aria-label="City" className="min-h-[2.75rem] w-full rounded-full px-4 text-sm" style={field}>
              <option value="">All cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button type="submit" variant="accent">Search</Button>
          </form>

          <p className="mb-4 text-sm" style={{ color: 'var(--sp-text-muted)' }} aria-live="polite">
            {total === 0 ? 'No rentals found' : `${total} rental${total === 1 ? '' : 's'}`}{city ? ` in ${city}` : ''}{q ? ` for "${q}"` : ''}
            {filtered && <> · <Link href="/services/dream-vacations" className="font-semibold underline">Clear filters</Link></>}
          </p>

          {rentals.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={cardStyle}>
              <h2 className="mb-2 text-xl font-semibold">No rentals match</h2>
              <p style={{ color: 'var(--sp-text-secondary)' }}>Try another property type, city or search.</p>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rentals.map((r) => <li key={r.id}><RentalCard rental={r} /></li>)}
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
        </>
      )}
    </ContentShell>
  );
}
