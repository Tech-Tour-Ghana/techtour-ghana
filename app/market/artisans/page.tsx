import type { Metadata } from 'next';
import Link from 'next/link';

import ContentShell, { cardStyle } from '@/components/content/ContentShell';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Artisan Spotlight',
  description: 'Meet the Ghanaian craftspeople behind the pieces in the TechTour Market, and shop their work.',
  alternates: { canonical: '/market/artisans' },
};

export const revalidate = 60;

type SearchParams = Promise<{ craft?: string }>;

export default async function ArtisansPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('artisans')
    .select('id, name, slug, title, location, craft_type, profile_image_url, years_of_experience, market_products(id, is_active)')
    .eq('is_active', true)
    .order('sort_order')
    .order('name');
  if (error) throw new Error('Could not load artisans');

  const all = (data ?? []).map((a) => ({ ...a, products: (a.market_products ?? []).filter((p) => p.is_active).length }));
  const crafts = [...new Set(all.map((a) => a.craft_type).filter(Boolean))].sort();
  const craft = crafts.find((c) => c === sp.craft);
  const artisans = craft ? all.filter((a) => a.craft_type === craft) : all;

  const chipClass = 'block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium';
  const chip = (active: boolean) => ({
    background: active ? 'var(--sp-primary)' : 'var(--sp-bg-card)',
    color: active ? 'var(--brand-white)' : 'var(--sp-text-secondary)',
    border: '1px solid var(--sp-border)',
  });

  return (
    <ContentShell wide title="Meet the" titleAccent="artisans" description="The people behind the crafts in our market. Read their story, then shop their work.">
      {crafts.length > 1 && (
        <nav aria-label="Craft" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max gap-2">
            <li><Link href="/market/artisans" aria-current={!craft ? 'page' : undefined} className={chipClass} style={chip(!craft)}>All crafts</Link></li>
            {crafts.map((c) => (
              <li key={c}><Link href={`/market/artisans?craft=${encodeURIComponent(c)}`} aria-current={craft === c ? 'page' : undefined} className={chipClass} style={chip(craft === c)}>{c}</Link></li>
            ))}
          </ul>
        </nav>
      )}

      {artisans.length === 0 ? (
        <div className="mt-6 rounded-3xl p-8 text-center sm:p-10" style={cardStyle}>
          <h2 className="text-lg font-semibold">No artisans to show yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--sp-text-secondary)' }}>Artisan profiles will appear here soon. Meanwhile, browse the <Link href="/market" className="font-semibold underline" style={{ color: 'var(--sp-primary)' }}>market</Link>.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artisans.map((a) => (
            <li key={a.id}>
              <Link href={`/market/artisans/${a.slug}`} className="flex h-full gap-4 rounded-3xl p-5" style={cardStyle}>
                {a.profile_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.profile_image_url} alt="" className="h-16 w-16 flex-shrink-0 rounded-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                ) : (
                  <span aria-hidden className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold text-white" style={{ background: 'var(--sp-primary)' }}>{a.name.charAt(0)}</span>
                )}
                <span className="min-w-0">
                  <span className="block font-bold">{a.name}</span>
                  {a.craft_type && <span className="block text-sm" style={{ color: 'var(--sp-primary)' }}>{a.craft_type}</span>}
                  {a.location && <span className="block text-sm" style={{ color: 'var(--sp-text-muted)' }}>{a.location}</span>}
                  <span className="mt-2 block text-xs" style={{ color: 'var(--sp-text-secondary)' }}>{a.products === 0 ? 'No products listed' : `${a.products} ${a.products === 1 ? 'product' : 'products'}`}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ContentShell>
  );
}
