import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { cardStyle } from '@/components/content/ContentShell';
import { ServiceTheme } from '@/components/ServiceTheme';
import { CrumbLabel } from '@/components/SiteBreadcrumbs';
import StudyApplicationForm from '@/components/study/StudyApplicationForm';
import Button from '@/components/ui/Button';
import { LEVELS, deadlineLabel, getStudyDestination } from '@/lib/study/load.server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

// The route segment is called [id] for history; the value is the destination slug.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const found = await getStudyDestination(id);
  if (!found) return { title: 'Study Abroad' };
  const { destination: d } = found;
  const description = d.description.slice(0, 160) || `Study in ${d.country_name} with TechTour Ghana.`;
  return {
    title: `Study in ${d.country_name}`,
    description,
    alternates: { canonical: `/services/study-abroad/${d.slug}` },
    openGraph: { title: `Study in ${d.country_name}`, description, url: `/services/study-abroad/${d.slug}`, type: 'website', ...(d.image_url ? { images: [d.image_url] } : {}) },
  };
}

export default async function StudyDestinationPage({ params }: Params) {
  const { id } = await params;
  const found = await getStudyDestination(id);
  if (!found) notFound();
  const { destination: d, scholarships } = found;

  const facts = [
    { label: 'Average tuition', value: d.average_tuition },
    { label: 'Cost of living', value: d.cost_of_living },
    { label: 'Language', value: d.language },
    { label: 'Currency', value: d.currency_name },
  ].filter((f) => f.value);

  return (
    <ServiceTheme>
      <CrumbLabel label={d.country_name} />
      <main style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-primary)' }}>
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-10">
            <div>
              {d.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.image_url} alt={`Studying in ${d.country_name}`} className="mb-6 aspect-[16/9] w-full rounded-3xl object-cover" />
              )}
              <h1 className="text-3xl font-extrabold sm:text-4xl">{d.flag && <span aria-hidden className="mr-3">{d.flag}</span>}Study in {d.country_name}</h1>
              {d.description && <p className="mt-4 text-base leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{d.description}</p>}

              {facts.length > 0 && (
                <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {facts.map((f) => (
                    <div key={f.label} className="rounded-2xl p-4" style={cardStyle}>
                      <dt className="text-xs" style={{ color: 'var(--sp-text-muted)' }}>{f.label}</dt>
                      <dd className="mt-1 text-sm font-semibold">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {d.why_study && (
                <section className="mt-10">
                  <h2 className="text-xl font-bold">Why study in {d.country_name}</h2>
                  <div className="mt-3 space-y-3 leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>
                    {d.why_study.split(/\r?\n+/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                </section>
              )}

              <section className="mt-10" aria-labelledby="sch-h">
                <h2 id="sch-h" className="text-xl font-bold">Scholarships</h2>
                {scholarships.length === 0 ? (
                  <p className="mt-3 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>No scholarships are open for {d.country_name} right now. Apply anyway and we will tell you when one opens.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {scholarships.map((s) => (
                      <li key={s.id} className="rounded-2xl p-4" style={cardStyle}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-semibold">{s.title}</h3>
                          <span className="text-xs font-semibold" style={{ color: 'var(--sp-text-muted)' }}>{LEVELS[s.level] ?? s.level} · {deadlineLabel(s.deadline)}</span>
                        </div>
                        {s.amount && <p className="mt-1 text-sm font-medium" style={{ color: 'var(--sp-primary)' }}>{s.amount}</p>}
                        {s.description && <p className="mt-1 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>{s.description}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <aside id="apply" className="lg:sticky lg:top-24 lg:self-start" aria-label="Apply">
              <StudyApplicationForm destination={{ id: d.id, country_name: d.country_name }} scholarships={scholarships.map((s) => ({ id: s.id, title: s.title }))} />
              <div className="mt-4 flex justify-center"><Button href="/services/study-abroad" variant="secondary" arrow={false} size="sm">All destinations</Button></div>
            </aside>
          </div>
        </div>
      </main>
    </ServiceTheme>
  );
}
