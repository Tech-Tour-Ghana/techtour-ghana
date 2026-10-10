import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass, faGraduationCap, faHouse, faStore } from '@fortawesome/free-solid-svg-icons';

import { createClient } from '@/lib/supabase/server';

const plural = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`;

export default async function Services() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const head = { count: 'exact', head: true } as const;
  const [tours, dests, schol, products] = await Promise.all([
    supabase.from('tours').select('id', head).eq('is_active', true),
    supabase.from('destinations').select('id', head).eq('is_active', true),
    supabase.from('scholarships').select('id', head).eq('is_active', true).gte('deadline', today),
    supabase.from('market_products').select('id', head).eq('is_active', true),
  ]);

  const nTours = tours.count ?? 0;
  const nDests = dests.count ?? 0;
  const cards = [
    { href: '/tours', icon: faCompass, title: 'Tours', body: 'Guided trips with dated departures across Ghana.', stat: nTours > 0 ? [plural(nTours, 'tour'), nDests > 0 ? plural(nDests, 'destination') : ''].filter(Boolean).join(' · ') : '' },
    { href: '/services/study-abroad', icon: faGraduationCap, title: 'Study abroad', body: 'Compare countries and scholarships, then apply online.', stat: (schol.count ?? 0) > 0 ? plural(schol.count ?? 0, 'open scholarship') : '' },
    { href: '/services/dream-vacations', icon: faHouse, title: 'Stays', body: 'Short-stay rentals across Ghana, arranged by our team.', stat: '' },
    { href: '/market', icon: faStore, title: 'Market', body: 'Crafts made by Ghanaian artisans, shipped to you.', stat: (products.count ?? 0) > 0 ? plural(products.count ?? 0, 'product') : '' },
  ];

  return (
    <section aria-labelledby="home-services" className="py-12 md:py-16" style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-primary)' }}>
      <div className="mx-auto w-full max-w-6xl px-4">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-primary)' }}>What we do</p>
        <h2 id="home-services" className="mt-2 text-[clamp(1.5rem,1.2rem+1.5vw,2.25rem)] font-bold leading-tight">Four ways to experience Ghana</h2>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {cards.map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="flex h-full min-h-[44px] flex-col rounded-3xl p-4 transition hover:shadow-lg sm:p-6" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' }}>
                <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: 'var(--sp-primary)' }}><FontAwesomeIcon icon={c.icon} className="h-5 w-5" /></span>
                <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{c.body}</p>
                {c.stat && <p className="mt-4 text-xs font-semibold" style={{ color: 'var(--sp-primary)' }}>{c.stat}</p>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
