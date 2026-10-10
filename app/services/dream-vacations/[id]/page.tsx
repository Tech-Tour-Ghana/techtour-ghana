import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBath, faBed, faCheck, faHouse, faLocationDot, faUsers } from '@fortawesome/free-solid-svg-icons';

import Breadcrumbs from '@/components/Breadcrumbs';
import { cardStyle } from '@/components/content/ContentShell';
import JsonLd from '@/components/seo/JsonLd';
import { ServiceTheme } from '@/components/ServiceTheme';
import TourGallery from '@/components/tours/TourGallery';
import { tourMoney } from '@/components/tours/TourCard';
import Button from '@/components/ui/Button';
import { amenityList, getRental, rentalImages, typeLabel } from '@/lib/rentals/load.server';
import { getSiteSeo, toMetadata } from '@/lib/seo/load.server';
import { breadcrumbJsonLd, resolveSeo } from '@/lib/seo/resolve';
import { seoFieldsFrom } from '@/lib/seo/site';

export const dynamic = 'force-dynamic';

// The [id] segment holds the rental's slug.
type Params = { params: Promise<{ id: string }> };

const getResolved = cache(async (slug: string) => {
  const rental = await getRental(slug);
  if (!rental) return null;
  const site = await getSiteSeo();
  const resolved = resolveSeo({ path: `/services/dream-vacations/${slug}`, title: rental.title, excerpt: rental.description.slice(0, 300), imageUrl: rentalImages(rental)[0] ?? '', seo: seoFieldsFrom(null), site });
  return { rental, site, resolved };
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const found = await getResolved(id);
  if (!found) return {};
  return toMetadata(found.resolved, { type: 'website', siteName: found.site.siteName });
}

export default async function RentalPage({ params }: Params) {
  const { id } = await params;
  const found = await getResolved(id);
  if (!found) notFound();
  const { rental, site, resolved } = found;

  const gallery = rentalImages(rental);
  const amenities = amenityList(rental.amenities);
  const place = [rental.address, rental.city, rental.region, rental.country].filter(Boolean).join(', ') || rental.location;
  const price = Number(rental.price_per_night);
  const cleaning = Number(rental.cleaning_fee);
  const deposit = Number(rental.security_deposit);
  const muted = { color: 'var(--sp-text-muted)' };

  const facts = [
    { icon: faHouse, label: 'Property', value: typeLabel(rental.property_type) },
    { icon: faBed, label: 'Bedrooms', value: String(rental.bedrooms) },
    { icon: faBath, label: 'Bathrooms', value: String(rental.bathrooms) },
    { icon: faUsers, label: 'Guests', value: `Up to ${rental.max_guests}` },
  ];

  return (
    <ServiceTheme>
      <div style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-primary)' }}>
        <JsonLd
          data={[
            {
              '@context': 'https://schema.org',
              '@type': 'LodgingBusiness',
              name: rental.title,
              description: rental.description.slice(0, 300) || undefined,
              image: resolved.og.image || undefined,
              url: resolved.canonical,
              address: { '@type': 'PostalAddress', streetAddress: rental.address || undefined, addressLocality: rental.city || undefined, addressRegion: rental.region || undefined, addressCountry: rental.country || undefined },
              priceRange: `${rental.currency} ${price.toFixed(2)} per night`,
              amenityFeature: amenities.map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
            },
            breadcrumbJsonLd([{ name: 'Dream Vacations', path: '/services/dream-vacations' }, { name: rental.title, path: `/services/dream-vacations/${id}` }], site),
          ]}
        />

        <div className="border-b" style={{ borderColor: 'rgba(128,128,128,0.18)' }}>
          <div className="mx-auto w-full max-w-7xl px-4 py-2.5">
            <Breadcrumbs items={[{ label: 'Services' }, { label: 'Dream Vacations', href: '/services/dream-vacations' }, { label: rental.title }]} />
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12">
          <header className="mb-5">
            <span className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', color: 'var(--sp-primary)' }}>{typeLabel(rental.property_type)}</span>
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{rental.title}</h1>
            {place && <p className="mt-2 inline-flex items-center gap-1 text-sm" style={muted}><FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />{place}</p>}
          </header>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0">
              <TourGallery images={gallery} title={rental.title} />

              <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {facts.map((f) => (
                  <li key={f.label} className="flex items-start gap-3 rounded-2xl p-4" style={cardStyle}>
                    <FontAwesomeIcon icon={f.icon} className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: 'var(--sp-primary)' }} />
                    <span className="min-w-0 text-sm"><span className="block text-xs" style={muted}>{f.label}</span><span className="block font-semibold">{f.value}</span></span>
                  </li>
                ))}
              </ul>

              {rental.description && (
                <section className="border-b py-6" style={{ borderColor: 'var(--sp-border)' }}>
                  <h2 className="mb-3 text-lg font-bold">About this place</h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{rental.description}</p>
                </section>
              )}

              {amenities.length > 0 && (
                <section className="py-6">
                  <h2 className="mb-3 text-lg font-bold">Amenities</h2>
                  <ul className="grid gap-2 text-sm sm:grid-cols-2">
                    {amenities.map((a) => <li key={a} className="flex gap-3"><FontAwesomeIcon icon={faCheck} className="mt-1 h-3 w-3 flex-shrink-0" style={{ color: '#10B981' }} /><span style={{ color: 'var(--sp-text-secondary)' }}>{a}</span></li>)}
                  </ul>
                </section>
              )}
            </div>

            <aside>
              <div className="rounded-3xl p-5 lg:sticky lg:top-24" style={cardStyle}>
                <p className="leading-tight"><span className="text-2xl font-bold" style={{ color: 'var(--sp-primary)' }}>{tourMoney(price, rental.currency)}</span> <span className="text-sm" style={muted}>per night</span></p>
                {(cleaning > 0 || deposit > 0) && (
                  <dl className="mt-3 space-y-1 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>
                    {cleaning > 0 && <div className="flex justify-between gap-3"><dt>Cleaning fee</dt><dd className="font-semibold">{tourMoney(cleaning, rental.currency)}</dd></div>}
                    {deposit > 0 && <div className="flex justify-between gap-3"><dt>Security deposit</dt><dd className="font-semibold">{tourMoney(deposit, rental.currency)}</dd></div>}
                  </dl>
                )}
                {!rental.is_available && <p className="mt-3 text-sm font-semibold" style={{ color: '#C2410C' }}>Currently unavailable. Ask us about other dates.</p>}
                <div className="mt-5"><Button href="/about/contact-us" full>Enquire about this rental</Button></div>
                <p className="mt-3 text-xs" style={muted}>Send us your dates and number of guests and we will confirm availability and arrange your stay.</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </ServiceTheme>
  );
}
