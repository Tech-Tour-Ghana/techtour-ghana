import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import ContentShell, { cardStyle } from '@/components/content/ContentShell';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

const getDestination = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('destinations')
    .select('slug, name, tagline, description, highlights, image_url')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  return data;
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getDestination(slug);
  if (!destination) return {};
  return {
    title: destination.name,
    description: destination.tagline,
    alternates: { canonical: `/destinations/${slug}` },
    openGraph: { title: destination.name, description: destination.tagline, images: destination.image_url ? [destination.image_url] : undefined },
  };
}

export default async function DestinationPage({ params }: Params) {
  const { slug } = await params;
  const destination = await getDestination(slug);
  if (!destination) notFound();

  const highlights = destination.highlights.split('\n').map((h) => h.trim()).filter(Boolean);

  return (
    <ContentShell title={destination.name} titleAccent="" description={destination.tagline}>
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
