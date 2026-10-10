import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { cardStyle } from '@/components/content/ContentShell';
import { ServiceTheme } from '@/components/ServiceTheme';
import TourCard from '@/components/tours/TourCard';
import Button from '@/components/ui/Button';
import { CARD_SELECT, toCard } from '@/lib/tours/load.server';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, destinationJsonLd, resolveSeo } from '@/lib/seo/resolve';
import { getSeoFields, getSiteSeo, toMetadata } from '@/lib/seo/load.server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

const getDestination = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('destinations')
    .select('id, slug, name, tagline, description, highlights, image_url')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  return data;
});

const getResolved = cache(async (slug: string) => {
  const destination = await getDestination(slug);
  if (!destination) return null;
  const [site, seo] = await Promise.all([getSiteSeo(), getSeoFields('destination', destination.id)]);
  const resolved = resolveSeo({ path: `/destinations/${slug}`, title: destination.name, excerpt: destination.tagline, imageUrl: destination.image_url, seo, site });
  return { destination, site, resolved };
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const found = await getResolved(slug);
  if (!found) return {};
  return toMetadata(found.resolved, { type: 'website', siteName: found.site.siteName });
}

const HERO_BG = 'linear-gradient(135deg, var(--sp-hero-from, var(--brand-primary)), var(--sp-hero-to, var(--brand-primary-dark)))';
const CHIP = { background: 'rgba(var(--brand-white-rgb), 0.16)' } as const;

export default async function DestinationPage({ params }: Params) {
  const { slug } = await params;
  const found = await getResolved(slug);
  if (!found) notFound();
  const { destination, site, resolved } = found;

  const supabase = await createClient();
  const [{ data: tourRows }, { data: others }] = await Promise.all([
    supabase.from('tours').select(CARD_SELECT).eq('is_active', true).eq('destination_id', destination.id).order('is_featured', { ascending: false }).order('rating', { ascending: false }).limit(6),
    supabase.from('destinations').select('slug, name, tagline, image_url').eq('is_active', true).neq('id', destination.id).order('sort_order').limit(4),
  ]);
  const tours = (tourRows ?? []).map(toCard);
  const more = others ?? [];
  const highlights = destination.highlights.split('\n').map((h) => h.trim()).filter(Boolean);
  const paragraphs = destination.description.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <ServiceTheme>
      <div style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-primary)' }}>
        <JsonLd
          data={[
            destinationJsonLd({ resolved, name: destination.name }),
            breadcrumbJsonLd([{ name: 'Tours Listings', path: '/tours' }, { name: destination.name, path: `/destinations/${slug}` }], site),
          ]}
        />

        <header className="relative isolate overflow-hidden" style={{ background: HERO_BG }}>
          {destination.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={destination.image_url} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
          )}
          {destination.image_url && (
            <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(180deg, rgba(var(--brand-ink-rgb), 0.5) 0%, rgba(var(--brand-ink-rgb), 0.8) 100%)' }} />
          )}
          <div className="mx-auto flex min-h-[22rem] max-w-6xl flex-col justify-end px-4 pb-10 pt-16 md:min-h-[26rem] md:pb-14" style={{ color: 'var(--brand-white)' }}>
            <h1 className="max-w-3xl text-4xl font-bold md:text-5xl">{destination.name}</h1>
            <p className="mt-3 max-w-2xl text-lg" style={{ color: 'rgba(var(--brand-white-rgb), 0.92)' }}>{destination.tagline}</p>
            <ul className="mt-5 flex flex-wrap gap-2 text-sm">
              <li className="rounded-full px-3 py-1" style={CHIP}>{tours.length} {tours.length === 1 ? 'tour' : 'tours'}</li>
              {highlights.length > 0 && <li className="rounded-full px-3 py-1" style={CHIP}>{highlights.length} places to see</li>}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="#tours" variant="gold">See tours</Button>
              <Button href="/services/dream-vacations" variant="secondary" style={{ color: 'var(--brand-white)', borderColor: 'rgba(var(--brand-white-rgb), 0.6)' }}>Plan a custom trip</Button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-6xl px-4 py-12 md:py-16">
          <section aria-labelledby="dest-about" className="max-w-3xl">
            <h2 id="dest-about" className="mb-4 text-2xl font-bold md:text-3xl">About {destination.name}</h2>
            <div className="space-y-4 text-lg leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>

          {highlights.length > 0 && (
            <section aria-labelledby="dest-see" className="mt-12 md:mt-16">
              <h2 id="dest-see" className="mb-6 text-2xl font-bold md:text-3xl">Places to see in {destination.name}</h2>
              <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {highlights.map((h, i) => (
                  <li key={h} className="flex items-start gap-4 rounded-2xl p-5" style={cardStyle}>
                    <span aria-hidden="true" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: 'var(--sp-primary)', color: 'var(--sp-on-primary, var(--brand-on-primary))' }}>{i + 1}</span>
                    <h3 className="pt-1 font-semibold leading-snug">{h}</h3>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section id="tours" aria-labelledby="dest-tours" className="mt-12 scroll-mt-24 md:mt-16">
            <h2 id="dest-tours" className="mb-6 text-2xl font-bold md:text-3xl">Tours in {destination.name}</h2>
            {tours.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={cardStyle}>
                <p style={{ color: 'var(--sp-text-secondary)' }}>No tours are listed for {destination.name} yet. We can build a trip around it for you.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <Button href="/services/dream-vacations">Plan a custom trip</Button>
                  <Button href="/tours" variant="secondary">Browse all tours</Button>
                </div>
              </div>
            ) : (
              <>
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {tours.map((t) => <li key={t.id}><TourCard tour={t} /></li>)}
                </ul>
                <div className="mt-6 flex justify-center"><Button href={`/tours?destination=${destination.slug}`} variant="secondary">See all {destination.name} tours</Button></div>
              </>
            )}
          </section>

          {more.length > 0 && (
            <section aria-labelledby="dest-more" className="mt-12 md:mt-16">
              <h2 id="dest-more" className="mb-6 text-2xl font-bold md:text-3xl">Explore more of Ghana</h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {more.map((o) => (
                  <li key={o.slug}>
                    <Link href={`/destinations/${o.slug}`} className="group relative isolate flex h-48 flex-col justify-end overflow-hidden rounded-2xl p-4" style={{ background: HERO_BG, color: 'var(--brand-white)' }}>
                      {o.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.image_url} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      )}
                      <span className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(180deg, transparent 30%, rgba(var(--brand-ink-rgb), 0.82) 100%)' }} />
                      <span className="text-lg font-bold">{o.name}</span>
                      <span className="line-clamp-2 text-sm" style={{ color: 'rgba(var(--brand-white-rgb), 0.88)' }}>{o.tagline}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </ServiceTheme>
  );
}
