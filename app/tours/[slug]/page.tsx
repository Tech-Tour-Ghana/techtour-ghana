import Button from '@/components/ui/Button';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faClock, faLocationDot, faStar, faUsers, faXmark } from '@fortawesome/free-solid-svg-icons';

import { cardStyle } from '@/components/content/ContentShell';
import JsonLd from '@/components/seo/JsonLd';
import { ServiceTheme } from '@/components/ServiceTheme';
import { CrumbLabel } from '@/components/SiteBreadcrumbs';
import TourBooking from '@/components/tours/TourBooking';
import TourCard, { tourMoney } from '@/components/tours/TourCard';
import TourGallery from '@/components/tours/TourGallery';
import { formatPostDate, initials } from '@/lib/content/blog';
import { breadcrumbJsonLd, resolveSeo } from '@/lib/seo/resolve';
import { getSiteSeo, toMetadata } from '@/lib/seo/load.server';
import { seoFieldsFrom } from '@/lib/seo/site';
import { createClient } from '@/lib/supabase/server';
import { CARD_SELECT, toCard } from '@/lib/tours/load.server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

const lines = (text: string) => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

const getTour = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data: tour } = await supabase.from('tours').select('*, destinations(name, slug)').eq('slug', slug).eq('is_active', true).maybeSingle();
  if (!tour) return null;
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: schedules }, { data: reviews }, { data: related }] = await Promise.all([
    supabase.from('tour_schedules').select('id, start_date, end_date, available_spots, booked_spots, is_cancelled').eq('tour_id', tour.id).eq('is_cancelled', false).gte('start_date', today).order('start_date'),
    supabase.from('tour_reviews').select('id, user_name, rating, comment, created_at').eq('tour_id', tour.id).eq('status', 'approved').order('created_at', { ascending: false }).limit(10),
    (tour.destination_id
      ? supabase.from('tours').select(CARD_SELECT).eq('is_active', true).eq('destination_id', tour.destination_id).neq('id', tour.id).limit(3)
      : supabase.from('tours').select(CARD_SELECT).eq('is_active', true).neq('id', tour.id).order('rating', { ascending: false }).limit(3)),
  ]);
  return {
    tour,
    departures: (schedules ?? []).filter((s) => s.available_spots > s.booked_spots).map((s) => ({ id: s.id, start_date: s.start_date, end_date: s.end_date, spots_left: s.available_spots - s.booked_spots })),
    reviews: reviews ?? [],
    related: (related ?? []).map(toCard),
  };
});

const getResolved = cache(async (slug: string) => {
  const found = await getTour(slug);
  if (!found) return null;
  const site = await getSiteSeo();
  const resolved = resolveSeo({ path: `/tours/${slug}`, title: found.tour.title, excerpt: found.tour.short_description, imageUrl: found.tour.featured_image_url, seo: seoFieldsFrom(null), site });
  return { ...found, site, resolved };
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const found = await getResolved(slug);
  if (!found) return {};
  return toMetadata(found.resolved, { type: 'website', siteName: found.site.siteName });
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-6 border-b last:border-b-0" style={{ borderColor: 'var(--sp-border)' }}>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default async function TourPage({ params }: Params) {
  const { slug } = await params;
  const found = await getResolved(slug);
  if (!found) notFound();
  const { tour, departures, reviews, related, site, resolved } = found;

  const gallery = [tour.featured_image_url, ...lines(tour.gallery)].filter(Boolean);
  const highlights = lines(tour.highlights);
  const includes = lines(tour.includes);
  const excludes = lines(tour.excludes);
  const itinerary = lines(tour.itinerary);
  const place = [tour.location, tour.region].filter(Boolean).join(', ');
  const price = tour.discount_price !== null && Number(tour.discount_price) < Number(tour.price) ? Number(tour.discount_price) : Number(tour.price);
  const showRating = reviews.length > 0 && tour.review_count > 0;
  const muted = { color: 'var(--sp-text-muted)' };

  const facts = [
    { icon: faClock, label: 'Duration', value: `${tour.duration_days} ${tour.duration_days === 1 ? 'day' : 'days'}` },
    { icon: faUsers, label: 'Group size', value: `${tour.min_group_size} to ${tour.max_group_size} people` },
    ...(place ? [{ icon: faLocationDot, label: 'Location', value: place }] : []),
    ...(tour.meeting_point ? [{ icon: faLocationDot, label: 'Meeting point', value: tour.meeting_point }] : []),
  ];

  return (
    <ServiceTheme>
      <main className="pb-28 lg:pb-0" style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-primary)' }}>
        <CrumbLabel label={tour.title} />
        <JsonLd
          data={[
            {
              '@context': 'https://schema.org',
              '@type': 'TouristTrip',
              name: tour.title,
              description: tour.short_description || tour.description.slice(0, 300) || undefined,
              image: resolved.og.image || undefined,
              provider: { '@type': 'Organization', name: site.orgName },
              offers: { '@type': 'Offer', url: resolved.canonical, priceCurrency: tour.currency, price: price.toFixed(2), availability: departures.length ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut' },
              ...(showRating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(tour.rating), reviewCount: tour.review_count } } : {}),
            },
            breadcrumbJsonLd([{ name: 'Tours Listings', path: '/tours' }, { name: tour.title, path: `/tours/${slug}` }], site),
          ]}
        />

        <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12">
          <header className="mb-5">
            {tour.destinations && <Link href={`/tours?destination=${tour.destinations.slug}`} className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', color: 'var(--sp-primary)' }}>{tour.destinations.name}</Link>}
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{tour.title}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={muted}>
              {showRating ? <span className="inline-flex items-center gap-1 font-semibold" style={{ color: 'var(--sp-text-primary)' }}><FontAwesomeIcon icon={faStar} className="h-3.5 w-3.5" style={{ color: '#F59E0B' }} />{Number(tour.rating).toFixed(1)} <span className="font-normal" style={muted}>({tour.review_count} reviews)</span></span> : <span>New tour</span>}
              {place && <span className="inline-flex items-center gap-1"><FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />{place}</span>}
            </p>
          </header>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0">
              <TourGallery images={gallery} title={tour.title} />

              <ul className="mt-6 grid grid-cols-2 gap-3">
                {facts.map((f) => (
                  <li key={f.label} className="flex items-start gap-3 rounded-2xl p-4" style={cardStyle}>
                    <FontAwesomeIcon icon={f.icon} className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: 'var(--sp-primary)' }} />
                    <span className="min-w-0 text-sm"><span className="block text-xs" style={muted}>{f.label}</span><span className="block font-semibold">{f.value}</span></span>
                  </li>
                ))}
              </ul>

              <div className="mt-2">
                {tour.short_description && <p className="pt-4 text-base leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{tour.short_description}</p>}
                {highlights.length > 0 && (
                  <Block title="Highlights">
                    <ul className="space-y-2 text-sm">{highlights.map((h) => <li key={h} className="flex gap-3"><FontAwesomeIcon icon={faStar} className="mt-1 h-3 w-3 flex-shrink-0" style={{ color: '#F59E0B' }} /><span style={{ color: 'var(--sp-text-secondary)' }}>{h}</span></li>)}</ul>
                  </Block>
                )}
                {tour.description && <Block title="About this tour"><p className="whitespace-pre-line text-sm leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{tour.description}</p></Block>}
                {(includes.length > 0 || excludes.length > 0) && (
                  <Block title="What is included">
                    <div className="grid gap-6 sm:grid-cols-2">
                      {includes.length > 0 && <ul className="space-y-2 text-sm">{includes.map((i) => <li key={i} className="flex gap-3"><FontAwesomeIcon icon={faCheck} className="mt-1 h-3 w-3 flex-shrink-0" style={{ color: '#10B981' }} /><span style={{ color: 'var(--sp-text-secondary)' }}>{i}</span></li>)}</ul>}
                      {excludes.length > 0 && <ul className="space-y-2 text-sm">{excludes.map((i) => <li key={i} className="flex gap-3"><FontAwesomeIcon icon={faXmark} className="mt-1 h-3 w-3 flex-shrink-0" style={{ color: '#EF4444' }} /><span style={{ color: 'var(--sp-text-secondary)' }}>{i}</span></li>)}</ul>}
                    </div>
                  </Block>
                )}
                {itinerary.length > 0 && (
                  <Block title="Itinerary">
                    <ol className="relative space-y-4 border-l pl-6" style={{ borderColor: 'var(--sp-border)' }}>
                      {itinerary.map((step, i) => (
                        <li key={i} className="relative text-sm" style={{ color: 'var(--sp-text-secondary)' }}>
                          <span className="absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--sp-primary)' }}>{i + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </Block>
                )}
              </div>

              <section id="reserve-mobile" className="mt-6 lg:hidden" aria-label="Reserve">
                <TourBooking tour={tour} departures={departures} />
              </section>

              {reviews.length > 0 && (
                <Block title="Traveller reviews">
                  <ul className="space-y-4">
                    {reviews.map((r) => (
                      <li key={r.id} className="rounded-2xl p-4" style={cardStyle}>
                        <div className="flex items-center gap-3">
                          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'var(--sp-primary)' }}>{initials(r.user_name || 'Guest')}</span>
                          <div className="min-w-0 text-sm"><p className="font-semibold">{r.user_name || 'Guest'}</p><p className="text-xs" style={muted}>{formatPostDate(r.created_at)}</p></div>
                          <span className="ml-auto inline-flex gap-0.5" aria-label={`${r.rating} out of 5`}>{[1, 2, 3, 4, 5].map((n) => <FontAwesomeIcon key={n} icon={faStar} className="h-3 w-3" style={{ color: n <= r.rating ? '#F59E0B' : 'var(--sp-border)' }} />)}</span>
                        </div>
                        {r.comment && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{r.comment}</p>}
                      </li>
                    ))}
                  </ul>
                </Block>
              )}
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-24"><TourBooking tour={tour} departures={departures} /></div>
            </aside>
          </div>

          {related.length > 0 && (
            <section className="mt-12" aria-labelledby="more-tours">
              <div className="mb-5 flex items-end justify-between"><h2 id="more-tours" className="text-2xl font-bold">You might also like</h2><Link href="/tours" className="text-sm font-semibold" style={{ color: 'var(--sp-primary)' }}>All tours</Link></div>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((t) => <li key={t.id}><TourCard tour={t} /></li>)}</ul>
            </section>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t px-4 py-3 lg:hidden" style={{ background: 'var(--sp-bg-card)', borderColor: 'var(--sp-border)' }}>
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <p className="leading-tight"><span className="block text-xs" style={muted}>From</span><span className="text-lg font-bold" style={{ color: 'var(--sp-primary)' }}>{tourMoney(price, tour.currency)}</span> <span className="text-xs" style={muted}>per person</span></p>
            <Button href="#reserve-mobile">{departures.length ? 'Check dates' : 'Enquire'}</Button>
          </div>
        </div>
      </main>
    </ServiceTheme>
  );
}
