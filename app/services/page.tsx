import type { Metadata } from 'next';

import ContentShell, { cardStyle } from '@/components/content/ContentShell';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Beyond guided tours: study abroad with TechTour Ghana and short-stay rentals across Ghana.',
  alternates: { canonical: '/services' },
};

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const supabase = await createClient();
  const [{ count: countries }, { count: rentals }] = await Promise.all([
    supabase.from('study_destinations').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('vacation_rentals').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  const services = [
    {
      title: 'Study Abroad',
      href: '/services/study-abroad',
      body: 'Compare destinations, costs and scholarships, then apply online. Our team guides you from application to arrival.',
      stat: countries ? `${countries} destination${countries === 1 ? '' : 's'}` : 'Destinations coming soon',
      cta: 'Explore study abroad',
    },
    {
      title: 'Dream Vacations',
      href: '/services/dream-vacations',
      body: 'Short-stay rentals across Ghana. Pick a place, send an enquiry, and we arrange the rest.',
      stat: rentals ? `${rentals} rental${rentals === 1 ? '' : 's'}` : 'Rentals coming soon',
      cta: 'Browse rentals',
    },
  ];

  return (
    <ContentShell wide title="Our" titleAccent="Services" description="Looking for a guided trip instead? See our Tours Listings.">
      <ul className="grid gap-5 md:grid-cols-2">
        {services.map((s) => (
          <li key={s.href} className="flex flex-col rounded-3xl p-6 sm:p-8" style={cardStyle}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-primary)' }}>{s.stat}</p>
            <h2 className="mt-2 text-2xl font-bold">{s.title}</h2>
            <p className="mt-3 flex-1 leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{s.body}</p>
            <div className="mt-6"><Button href={s.href}>{s.cta}</Button></div>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>
        <span>Want a guided trip with set dates?</span>
        <Button href="/tours" variant="secondary" size="sm">Tours Listings</Button>
      </div>
    </ContentShell>
  );
}
