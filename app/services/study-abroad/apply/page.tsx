import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Breadcrumbs from '@/components/Breadcrumbs';
import { cardStyle } from '@/components/content/ContentShell';
import { ServiceTheme } from '@/components/ServiceTheme';
import ProgramApplyForm from '@/components/study/ProgramApplyForm';
import Button from '@/components/ui/Button';
import { formatTuition, getStudyProgram } from '@/lib/study/load.server';
import { levelLabel } from '@/lib/study/meta';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<{ program?: string }> };

// A form for one programme: noindex, the programme and country pages are what search should find.
export const metadata: Metadata = { title: 'Apply', robots: { index: false, follow: true } };

const NEXT = [
  'You submit your details, then upload the documents on your checklist.',
  'Our team reviews every document and tells you if anything needs fixing.',
  'We submit your application to the university and follow it up for you.',
  'You see each stage, and what we are waiting for, in your account.',
];

export default async function ApplyPage({ searchParams }: Props) {
  const { program: id } = await searchParams;
  const found = id ? await getStudyProgram(id) : null;
  if (!found) notFound();
  const { program: p, institution: i, destination: d } = found;
  const intakes = p.intakes.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
  const requirements = p.requirements.split(/\r?\n+/).map((x) => x.trim()).filter(Boolean);
  const tuition = formatTuition(p.tuition_amount, p.tuition_currency);

  return (
    <ServiceTheme>
      <div style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-primary)' }}>
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
          <div className="mb-6"><Breadcrumbs items={[{ label: 'Services' }, { label: 'Study Abroad', href: '/services/study-abroad' }, { label: d.country_name, href: `/services/study-abroad/${d.slug}` }, { label: 'Apply' }]} /></div>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--sp-primary)' }}>{levelLabel(p.level)} · {d.country_name}</p>
              <h1 className="mt-1 text-3xl font-extrabold leading-tight sm:text-4xl">{p.title}</h1>
              <p className="mt-2 text-lg" style={{ color: 'var(--sp-text-secondary)' }}>{i.name}{i.city ? `, ${i.city}` : ''}</p>

              <dl className="mt-6 grid grid-cols-2 gap-3">
                {[['Duration', p.duration], ['Tuition', tuition], ['Intakes', p.intakes], ['Field', p.field]].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="rounded-2xl p-4" style={cardStyle}>
                    <dt className="text-xs" style={{ color: 'var(--sp-text-muted)' }}>{k}</dt>
                    <dd className="mt-1 text-sm font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>

              {p.description && <p className="mt-6 leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{p.description}</p>}

              {requirements.length > 0 && (
                <section className="mt-6" aria-labelledby="req-h">
                  <h2 id="req-h" className="text-lg font-bold">Entry requirements</h2>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>{requirements.map((r) => <li key={r}>{r}</li>)}</ul>
                </section>
              )}

              <section className="mt-6 rounded-3xl p-5" style={cardStyle} aria-labelledby="next-h">
                <h2 id="next-h" className="text-lg font-bold">What happens after you apply</h2>
                <ol className="mt-3 space-y-2 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>
                  {NEXT.map((n, k) => <li key={n} className="flex gap-3"><span aria-hidden className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'var(--sp-primary)', color: 'var(--sp-on-primary, var(--brand-on-primary))' }}>{k + 1}</span><span>{n}</span></li>)}
                </ol>
              </section>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <ProgramApplyForm program={{ id: p.id, title: p.title }} institution={{ id: i.id, name: i.name }} destinationId={d.id} intakes={intakes} />
              <div className="mt-4 flex justify-center"><Button href={`/services/study-abroad/${d.slug}`} variant="secondary" arrow={false} size="sm">Back to {d.country_name}</Button></div>
            </div>
          </div>
        </div>
      </div>
    </ServiceTheme>
  );
}
