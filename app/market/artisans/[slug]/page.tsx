import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import Breadcrumbs from '@/components/Breadcrumbs';
import { cardStyle } from '@/components/content/ContentShell';
import JsonLd from '@/components/seo/JsonLd';
import { ServiceTheme } from '@/components/ServiceTheme';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

const getArtisan = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('artisans')
    .select('id, name, slug, title, bio, location, craft_type, specialties, years_of_experience, profile_image_url, market_products(id, title, slug, price, discount_price, image_url, is_in_stock, is_active, sort_order)')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (!data) return null;
  const products = (data.market_products ?? []).filter((p) => p.is_active).sort((a, b) => a.sort_order - b.sort_order);
  return { ...data, products };
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArtisan(slug);
  if (!a) return { title: 'Artisan Spotlight' };
  const description = a.bio.slice(0, 160) || `${a.name}${a.craft_type ? `, ${a.craft_type}` : ''}, on the TechTour Market.`;
  return {
    title: `${a.name}${a.craft_type ? `: ${a.craft_type}` : ''}`,
    description,
    alternates: { canonical: `/market/artisans/${a.slug}` },
    openGraph: { title: a.name, description, url: `/market/artisans/${a.slug}`, type: 'profile', images: a.profile_image_url ? [a.profile_image_url] : undefined },
  };
}

const cedi = (n: number) => `₵${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function ArtisanPage({ params }: Params) {
  const { slug } = await params;
  const a = await getArtisan(slug);
  if (!a) notFound();
  const specialties = a.specialties.split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <ServiceTheme>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: a.name,
          description: a.bio || undefined,
          jobTitle: a.craft_type || a.title || undefined,
          image: a.profile_image_url || undefined,
          address: a.location ? { '@type': 'PostalAddress', addressLocality: a.location, addressCountry: 'GH' } : undefined,
        }}
      />
      <main style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-primary)' }}>
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
          <div className="mb-6"><Breadcrumbs items={[{ label: 'Market', href: '/market' }, { label: 'Artisan Spotlight', href: '/market/artisans' }, { label: a.name }]} /></div>

          <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            {a.profile_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.profile_image_url} alt={a.name} className="h-28 w-28 flex-shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span aria-hidden className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full text-4xl font-bold text-white" style={{ background: 'var(--sp-primary)' }}>{a.name.charAt(0)}</span>
            )}
            <div>
              <h1 className="text-3xl font-extrabold sm:text-4xl">{a.name}</h1>
              {a.craft_type && <p className="mt-1 font-semibold" style={{ color: 'var(--sp-primary)' }}>{a.craft_type}</p>}
              <p className="mt-1 text-sm" style={{ color: 'var(--sp-text-muted)' }}>
                {[a.location, a.years_of_experience > 0 ? `${a.years_of_experience} years of experience` : ''].filter(Boolean).join(' · ')}
              </p>
            </div>
          </header>

          {a.bio && (
            <section className="mt-8" aria-labelledby="story-h">
              <h2 id="story-h" className="text-lg font-bold">Story</h2>
              <p className="mt-3 max-w-3xl whitespace-pre-line leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{a.bio}</p>
              {specialties.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {specialties.map((s) => <li key={s} className="rounded-full px-3 py-1 text-xs" style={{ ...cardStyle, color: 'var(--sp-text-secondary)' }}>{s}</li>)}
                </ul>
              )}
            </section>
          )}

          <section className="mt-12" aria-labelledby="work-h">
            <h2 id="work-h" className="text-2xl font-bold">Work by {a.name}</h2>
            {a.products.length === 0 ? (
              <p className="mt-3 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>No products listed yet. Browse the <Link href="/market" className="font-semibold underline" style={{ color: 'var(--sp-primary)' }}>market</Link> for more.</p>
            ) : (
              <ul className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
                {a.products.map((p) => {
                  const sale = p.discount_price !== null && Number(p.discount_price) < Number(p.price);
                  return (
                    <li key={p.id}>
                      <Link href={`/market/${p.slug}`} className="block overflow-hidden rounded-2xl" style={cardStyle}>
                        <div className="aspect-square" style={{ background: 'var(--sp-bg-primary)' }}>
                          {p.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="line-clamp-2 text-sm font-semibold">{p.title}</p>
                          <p className="mt-1 text-sm">
                            <span className="font-bold" style={{ color: 'var(--sp-primary)' }}>{cedi(Number(sale ? p.discount_price : p.price))}</span>
                            {sale && <span className="ml-2 text-xs line-through" style={{ color: 'var(--sp-text-muted)' }}>{cedi(Number(p.price))}</span>}
                          </p>
                          {!p.is_in_stock && <p className="mt-1 text-xs" style={{ color: 'var(--sp-text-muted)' }}>Out of stock</p>}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </ServiceTheme>
  );
}
