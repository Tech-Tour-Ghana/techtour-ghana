import type { Metadata } from 'next';
import Link from 'next/link';

import ContentShell, { cardStyle } from '@/components/content/ContentShell';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Destinations',
  description: 'Explore Accra, Cape Coast, Kumasi, the Northern Region and the Volta Region with TechTour Ghana.',
  alternates: { canonical: '/destinations' },
};

export const dynamic = 'force-dynamic';

export default async function DestinationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('destinations')
    .select('slug, name, tagline, image_url')
    .eq('is_active', true)
    .order('sort_order');
  const destinations = data ?? [];

  return (
    <ContentShell
      title="Explore"
      titleAccent="Ghana"
      description="From the capital's coastline to the northern savannah, pick a destination and start planning."
    >
      {destinations.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={cardStyle}>
          <h2 className="text-xl font-semibold mb-2">Destinations are coming soon</h2>
          <p style={{ color: 'var(--sp-text-secondary)' }}>Please check back shortly.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <Link
              key={d.slug}
              href={`/destinations/${d.slug}`}
              className="rounded-2xl overflow-hidden flex flex-col transition hover:-translate-y-1"
              style={cardStyle}
            >
              {d.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.image_url} alt={d.name} className="w-full aspect-[16/9] object-cover" loading="lazy" />
              )}
              <div className="p-5">
                <h2 className="text-xl font-bold">{d.name}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--sp-text-secondary)' }}>{d.tagline}</p>
                <span className="inline-block mt-3 text-sm font-semibold" style={{ color: 'var(--sp-primary)' }}>Explore →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </ContentShell>
  );
}
