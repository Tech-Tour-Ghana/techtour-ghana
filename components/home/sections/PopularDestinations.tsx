import Link from 'next/link';

import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';

export default async function PopularDestinations() {
  const supabase = await createClient();
  const { data } = await supabase.from('destinations').select('id, slug, name, tagline, description, image_url').eq('is_active', true).order('sort_order').limit(6);
  if (!data?.length) return null;

  return (
    <section aria-labelledby="home-destinations" className="py-12 md:py-16" style={{ background: 'var(--sp-bg-secondary)', color: 'var(--sp-text-primary)' }}>
      <div className="mx-auto w-full max-w-6xl px-4">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-primary)' }}>Where to go</p>
        <h2 id="home-destinations" className="mt-2 text-[clamp(1.5rem,1.2rem+1.5vw,2.25rem)] font-bold leading-tight">Popular destinations</h2>
        <ul className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
          {data.map((d) => {
            const blurb = (d.tagline || d.description || '').slice(0, 110);
            return (
              <li key={d.id} className="w-[78%] flex-shrink-0 snap-start sm:w-[45%] lg:w-auto">
                <Link href={`/destinations/${d.slug}`} className="group block h-full overflow-hidden rounded-3xl" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' }}>
                  {d.image_url && (
                    <div className="aspect-[4/3] overflow-hidden" style={{ background: 'var(--sp-border)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={d.image_url} alt={`${d.name}, Ghana`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  )}
                  <div className="p-5" style={d.image_url ? undefined : { borderTop: '4px solid var(--sp-primary)' }}>
                    <h3 className="text-lg font-bold">{d.name}</h3>
                    {blurb && <p className="mt-1 line-clamp-2 text-sm leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{blurb}</p>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-8"><Button href="/tours">View all destinations</Button></div>
      </div>
    </section>
  );
}
