import type { Metadata } from 'next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faGraduationCap, faHouse, faRoute, type IconDefinition } from '@fortawesome/free-solid-svg-icons';

import ContentShell, { cardStyle } from '@/components/content/ContentShell';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Guided tours, short-stay rentals and study abroad with TechTour Ghana. Choose, send a request and we confirm by email.',
  alternates: { canonical: '/services' },
};

export const dynamic = 'force-dynamic';

const count = (n: number | null, one: string, many: string, none: string) => (n ? `${n} ${n === 1 ? one : many}` : none);

export default async function ServicesPage() {
  const supabase = await createClient();
  const [{ count: tours }, { count: rentals }, { count: countries }] = await Promise.all([
    supabase.from('tours').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('vacation_rentals').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('study_destinations').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  const services: { title: string; href: string; icon: IconDefinition; stat: string; body: string; points: string[]; cta: string }[] = [
    {
      title: 'Guided Tours',
      href: '/tours',
      icon: faRoute,
      stat: count(tours, 'tour', 'tours', 'Tours coming soon'),
      body: 'Set-date trips across Ghana with a guide, from Accra to the Northern Region.',
      points: ['Filter by destination, price and duration', 'Pick a departure date on a calendar', 'Reserve online, we confirm by email'],
      cta: 'Browse tours',
    },
    {
      title: 'Dream Vacations',
      href: '/services/dream-vacations',
      icon: faHouse,
      stat: count(rentals, 'rental', 'rentals', 'Rentals coming soon'),
      body: 'Apartments, houses and villas for short stays, booked by the night.',
      points: ['Choose your dates and see the total', 'Dates already taken are shown', 'We confirm availability by email'],
      cta: 'Find a place to stay',
    },
    {
      title: 'Study Abroad',
      href: '/services/study-abroad',
      icon: faGraduationCap,
      stat: count(countries, 'destination', 'destinations', 'Destinations coming soon'),
      body: 'Compare destinations, costs and scholarships, then apply online.',
      points: ['Destination guides and costs', 'Scholarships listed in one place', 'Our team guides you from application to arrival'],
      cta: 'Explore study abroad',
    },
  ];

  const steps = [
    { title: 'Choose', body: 'Pick a tour, a place to stay or a study destination.' },
    { title: 'Send your request', body: 'Select your dates and details. Nothing is charged at this stage.' },
    { title: 'We confirm', body: 'Our team replies by email to confirm and arrange payment.' },
  ];

  return (
    <ContentShell wide title="Our" titleAccent="Services" description="Guided tours, short stays and study abroad, arranged by one team in Ghana.">
      <ul className="grid gap-5 lg:grid-cols-3">
        {services.map((s) => (
          <li key={s.href} className="flex flex-col rounded-3xl p-6 sm:p-7" style={cardStyle}>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(var(--brand-primary-rgb), 0.12)', color: 'var(--sp-primary)' }}>
              <FontAwesomeIcon icon={s.icon} className="h-5 w-5" />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-primary)' }}>{s.stat}</p>
            <h2 className="mt-1 text-2xl font-bold">{s.title}</h2>
            <p className="mt-3 leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{s.body}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>
              {s.points.map((p) => (
                <li key={p} className="flex gap-3"><FontAwesomeIcon icon={faCheck} className="mt-1 h-3 w-3 flex-shrink-0" style={{ color: 'var(--brand-success)' }} /><span>{p}</span></li>
              ))}
            </ul>
            <div className="mt-6"><Button href={s.href}>{s.cta}</Button></div>
          </li>
        ))}
      </ul>

      <section aria-labelledby="how-it-works" className="mt-14">
        <h2 id="how-it-works" className="mb-6 text-2xl font-bold md:text-3xl">How it works</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-4 rounded-2xl p-5" style={cardStyle}>
              <span aria-hidden="true" className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: 'var(--sp-primary)', color: 'var(--sp-on-primary, var(--brand-on-primary))' }}>{i + 1}</span>
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="services-help" className="mt-14 rounded-3xl p-8 text-center" style={cardStyle}>
        <h2 id="services-help" className="text-xl font-bold md:text-2xl">Not sure where to start?</h2>
        <p className="mx-auto mt-2 max-w-xl" style={{ color: 'var(--sp-text-secondary)' }}>Tell us what you have in mind and we will point you to the right option.</p>
        <div className="mt-5 flex justify-center"><Button href="/about/contact-us">Talk to us</Button></div>
      </section>
    </ContentShell>
  );
}
