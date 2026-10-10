import Link from 'next/link';

import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';

const cedi = (n: number) => `₵${n.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;

export default async function MarketSpotlight() {
  const supabase = await createClient();
  const [{ data: products }, { data: artisans }] = await Promise.all([
    supabase.from('market_products').select('id, slug, title, price, discount_price, image_url, artisans(name), product_gallery(image_url, is_primary, sort_order, is_active)').eq('is_active', true).order('is_featured', { ascending: false }).order('sort_order').limit(4),
    supabase.from('artisans').select('id, slug, name, craft_type, bio, profile_image_url').eq('is_active', true).order('is_featured', { ascending: false }).order('sort_order').limit(1),
  ]);
  if (!products?.length) return null;
  const artisan = artisans?.[0];

  const imageOf = (p: (typeof products)[number]) => {
    const g = (p.product_gallery ?? []).filter((x) => x.is_active && x.image_url).sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0];
    return g?.image_url || p.image_url || '';
  };

  return (
    <section aria-labelledby="home-market" className="py-12 md:py-16" style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-primary)' }}>
      <div className="mx-auto w-full max-w-6xl px-4">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-primary)' }}>The market</p>
        <h2 id="home-market" className="mt-2 text-[clamp(1.5rem,1.2rem+1.5vw,2.25rem)] font-bold leading-tight">Made by Ghanaian artisans</h2>
        <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products.map((p) => {
            const img = imageOf(p);
            const price = p.discount_price !== null && Number(p.discount_price) < Number(p.price) ? Number(p.discount_price) : Number(p.price);
            return (
              <li key={p.id}>
                <Link href={`/market/${p.slug}`} className="group block h-full overflow-hidden rounded-2xl" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' }}>
                  <div className="aspect-square overflow-hidden" style={{ background: 'var(--sp-border)' }}>
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <span aria-hidden className="flex h-full w-full items-center justify-center text-4xl font-bold" style={{ color: 'var(--sp-primary)' }}>{p.title.charAt(0)}</span>
                    )}
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="line-clamp-2 text-sm font-bold sm:text-base">{p.title}</h3>
                    {p.artisans?.name && <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--sp-text-muted)' }}>by {p.artisans.name}</p>}
                    <p className="mt-2 font-bold" style={{ color: 'var(--sp-primary)' }}>{cedi(price)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {artisan && (
          <Link href={`/market/artisans/${artisan.slug}`} className="mt-6 flex items-center gap-4 rounded-3xl p-5" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' }}>
            {artisan.profile_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={artisan.profile_image_url} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-16 w-16 flex-shrink-0 rounded-full object-cover" />
            ) : (
              <span aria-hidden className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold text-white" style={{ background: 'var(--sp-primary)' }}>{artisan.name.charAt(0)}</span>
            )}
            <span className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-primary)' }}>Artisan story</span>
              <span className="block font-bold">{artisan.name}{artisan.craft_type && `, ${artisan.craft_type}`}</span>
              {artisan.bio && <span className="mt-1 line-clamp-2 block text-sm" style={{ color: 'var(--sp-text-secondary)' }}>{artisan.bio}</span>}
            </span>
          </Link>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/market">Shop the market</Button>
          <Button href="/market/artisans" variant="secondary">Meet the artisans</Button>
        </div>
      </div>
    </section>
  );
}
