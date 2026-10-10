import type { Metadata } from 'next';
import Link from 'next/link';

import ContentShell, { cardStyle } from '@/components/content/ContentShell';
import Button from '@/components/ui/Button';
import { getJobs } from '@/lib/careers/load.server';

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Open roles at TechTour Ghana. Join a team using technology to celebrate Ghanaian culture and support local communities.',
  alternates: { canonical: '/about/careers' },
};

export const revalidate = 60;

type SearchParams = Promise<{ department?: string; type?: string }>;

const SPONTANEOUS = 'mailto:careers@techtourghana.com?subject=Spontaneous%20application';

const REASONS = [
  { title: 'Work that matters here', body: 'Your work supports local guides, artisans and students in Ghana.' },
  { title: 'A small, focused team', body: 'You will see the result of what you build, quickly.' },
  { title: 'Room to grow', body: 'We back people who take ownership and learn fast.' },
];

export default async function CareersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const all = await getJobs();
  const departments = [...new Set(all.map((j) => j.department))].sort();
  const types = [...new Set(all.map((j) => j.type))];
  const department = departments.find((d) => d === sp.department);
  const type = types.find((t) => t === sp.type);
  const jobs = all.filter((j) => (!department || j.department === department) && (!type || j.type === type));

  const href = (over: { department?: string | null; type?: string | null }) => {
    const params = new URLSearchParams();
    const d = over.department === undefined ? department : over.department;
    const t = over.type === undefined ? type : over.type;
    if (d) params.set('department', d);
    if (t) params.set('type', t);
    const qs = params.toString();
    return qs ? `/about/careers?${qs}#roles` : '/about/careers#roles';
  };
  const chip = (active: boolean) => ({
    background: active ? 'var(--sp-primary)' : 'var(--sp-bg-card)',
    color: active ? 'var(--brand-white)' : 'var(--sp-text-secondary)',
    border: '1px solid var(--sp-border)',
  });
  const chipClass = 'block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium';
  const scroller = '-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

  return (
    <ContentShell wide title="Build the future of" titleAccent="African tourism" description="Join a mission-driven team using technology to celebrate Ghana's culture and support the people who make it.">
      <section aria-labelledby="why-h">
        <h2 id="why-h" className="sr-only">Why join us</h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {REASONS.map((r) => (
            <li key={r.title} className="rounded-2xl p-5" style={cardStyle}>
              <h3 className="font-semibold">{r.title}</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>{r.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="roles" className="mt-14 scroll-mt-28" aria-labelledby="roles-h">
        <h2 id="roles-h" className="text-2xl font-bold sm:text-3xl">Open roles</h2>

        {(departments.length > 1 || types.length > 1) && (
          <div className="mt-5 space-y-3">
            {departments.length > 1 && (
              <nav aria-label="Departments" className={scroller}>
                <ul className="flex w-max gap-2">
                  <li><Link href={href({ department: null })} aria-current={!department ? 'page' : undefined} className={chipClass} style={chip(!department)}>All departments</Link></li>
                  {departments.map((d) => (
                    <li key={d}><Link href={href({ department: d })} aria-current={department === d ? 'page' : undefined} className={chipClass} style={chip(department === d)}>{d}</Link></li>
                  ))}
                </ul>
              </nav>
            )}
            {types.length > 1 && (
              <nav aria-label="Job types" className={scroller}>
                <ul className="flex w-max gap-2">
                  <li><Link href={href({ type: null })} aria-current={!type ? 'page' : undefined} className={chipClass} style={chip(!type)}>Any type</Link></li>
                  {types.map((t) => (
                    <li key={t}><Link href={href({ type: t })} aria-current={type === t ? 'page' : undefined} className={chipClass} style={chip(type === t)}>{t}</Link></li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="mt-6 rounded-3xl p-8 text-center sm:p-10" style={cardStyle}>
            <h3 className="text-lg font-semibold">{all.length === 0 ? 'There are no open roles right now' : 'No roles match those filters'}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--sp-text-secondary)' }}>
              {all.length === 0 ? 'Check back soon, or send us a note about what you would love to work on.' : 'Try another department or type.'}
            </p>
            <div className="mt-5 flex justify-center">
              {all.length === 0 ? <Button href={SPONTANEOUS}>Send a spontaneous application</Button> : <Button href="/about/careers#roles" variant="secondary" arrow={false}>Clear filters</Button>}
            </div>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {jobs.map((j) => (
              <li key={j.id} className="flex flex-col rounded-3xl p-5 sm:p-6" style={cardStyle}>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full px-3 py-1" style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-primary)' }}>{j.department}</span>
                  <span className="rounded-full px-3 py-1" style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-secondary)' }}>{j.type}</span>
                  {j.level && <span className="rounded-full px-3 py-1" style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-secondary)' }}>{j.level}</span>}
                </div>
                <h3 className="mt-3 text-xl font-bold">{j.title}</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--sp-text-muted)' }}>{j.location}</p>
                <p className="mt-3 line-clamp-3 flex-1 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>{j.description}</p>
                <div className="mt-5"><Button href={`/about/careers/${j.slug}`} full>View role</Button></div>
              </li>
            ))}
          </ul>
        )}

        {jobs.length > 0 && (
          <p className="mt-8 text-center text-sm" style={{ color: 'var(--sp-text-secondary)' }}>
            Do not see the right role? <a href={SPONTANEOUS} className="font-semibold underline" style={{ color: 'var(--sp-primary)' }}>Send a spontaneous application</a>.
          </p>
        )}
      </section>
    </ContentShell>
  );
}
