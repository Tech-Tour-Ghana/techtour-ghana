import type { Metadata } from 'next';

import ContentShell, { cardStyle } from '@/components/content/ContentShell';
import Button from '@/components/ui/Button';
import { LEVELS, deadlineLabel, getOpenScholarships, getStudyDestinations } from '@/lib/study/load.server';

export const metadata: Metadata = {
  title: 'Study Abroad',
  description: 'Study abroad with TechTour Ghana: pick a destination, see the costs and scholarships, and apply online.',
  alternates: { canonical: '/services/study-abroad' },
};

export const dynamic = 'force-dynamic';

const STEPS = [
  { n: '1', title: 'Choose a destination', body: 'Compare costs, language and tuition for each country.' },
  { n: '2', title: 'Send your application', body: 'Tell us about your studies and goals. It takes two minutes.' },
  { n: '3', title: 'We guide you through', body: 'Our team contacts you about programmes, scholarships and visas.' },
];

export default async function StudyAbroadPage() {
  const [destinations, scholarships] = await Promise.all([getStudyDestinations(), getOpenScholarships()]);
  const nameOf = (id: string) => destinations.find((d) => d.id === id)?.country_name ?? '';

  return (
    <ContentShell wide title="Study" titleAccent="Abroad" description="Pick a destination, see what it costs and which scholarships are open, then apply online.">
      <ol className="mb-12 grid gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="flex gap-4 rounded-3xl p-5" style={cardStyle}>
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: 'var(--sp-primary)' }}>{s.n}</span>
            <div>
              <h2 className="font-semibold">{s.title}</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section aria-labelledby="destinations-h">
        <h2 id="destinations-h" className="mb-5 text-2xl font-bold">Destinations</h2>
        {destinations.length === 0 ? (
          <div className="rounded-3xl p-10 text-center" style={cardStyle}>
            <h3 className="text-lg font-semibold">Destinations are being added</h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>Tell us where you want to study and we will help you plan it.</p>
            <div className="mt-5 flex justify-center"><Button href="/about/contact-us">Contact us</Button></div>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((d) => (
              <li key={d.id} className="flex flex-col overflow-hidden rounded-3xl" style={cardStyle}>
                {d.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.image_url} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-bold">{d.flag && <span aria-hidden className="mr-2">{d.flag}</span>}{d.country_name}</h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>{d.description}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    {d.average_tuition && <div><dt className="text-xs" style={{ color: 'var(--sp-text-muted)' }}>Average tuition</dt><dd className="font-semibold">{d.average_tuition}</dd></div>}
                    {d.language && <div><dt className="text-xs" style={{ color: 'var(--sp-text-muted)' }}>Language</dt><dd className="font-semibold">{d.language}</dd></div>}
                  </dl>
                  <div className="mt-5"><Button href={`/services/study-abroad/${d.slug}`} full>Explore {d.country_name}</Button></div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {scholarships.length > 0 && (
        <section aria-labelledby="scholarships-h" className="mt-14">
          <h2 id="scholarships-h" className="mb-5 text-2xl font-bold">Open scholarships</h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {scholarships.map((s) => {
              const dest = destinations.find((d) => d.id === s.destination_id);
              return (
                <li key={s.id} className="rounded-3xl p-5" style={cardStyle}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">{s.title}</h3>
                    <span className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-secondary)' }}>{LEVELS[s.level] ?? s.level}</span>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: 'var(--sp-text-muted)' }}>{nameOf(s.destination_id)} · Deadline: {deadlineLabel(s.deadline)}{s.amount ? ` · ${s.amount}` : ''}</p>
                  {s.description && <p className="mt-2 line-clamp-2 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>{s.description}</p>}
                  {dest && <div className="mt-4"><Button href={`/services/study-abroad/${dest.slug}#apply`} size="sm" variant="secondary">Apply for {dest.country_name}</Button></div>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </ContentShell>
  );
}
