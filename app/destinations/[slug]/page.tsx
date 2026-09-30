import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import ContentShell, { cardStyle } from '@/components/content/ContentShell';
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

export default async function DestinationPage({ params }: Params) {
  const { slug } = await params;
  const found = await getResolved(slug);
  if (!found) notFound();
  const { destination, site, resolved } = found;

  const highlights = destination.highlights.split('\n').map((h) => h.trim()).filter(Boolean);

  return (
    <ContentShell title={destination.name} titleAccent="" description={destination.tagline}>
      <JsonLd
        data={[
          destinationJsonLd({ resolved, name: destination.name }),
          breadcrumbJsonLd([{ name: 'Destinations', path: '/destinations' }, { name: destination.name, path: `/destinations/${slug}` }], site),
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl p-6 md:p-8" style={cardStyle}>
          {destination.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={destination.image_url} alt={destination.name} className="w-full rounded-xl mb-6 object-cover" />
          )}
          <h2 className="text-2xl font-bold mb-3">About {destination.name}</h2>
          <p className="leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{destination.description}</p>
        </section>

        <aside className="rounded-2xl p-6 md:p-8 h-fit" style={cardStyle}>
          <h2 className="text-lg font-bold mb-3">Highlights</h2>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>
            {highlights.map((h) => (
              <li key={h} className="flex gap-2">
                <span style={{ color: 'var(--sp-accent)' }}>•</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-2 text-sm font-semibold">
            <Link href="/services/onsite-tourism" style={{ color: 'var(--sp-primary)' }}>Onsite tourism →</Link>
            <Link href="/services/dream-vacations" style={{ color: 'var(--sp-primary)' }}>Dream vacations →</Link>
            <Link href="/destinations" style={{ color: 'var(--sp-primary)' }}>← All destinations</Link>
          </div>
        </aside>
      </div>
    </ContentShell>
  );
}
