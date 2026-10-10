import Button from '@/components/ui/Button';
import { deadlineLabel, getOpenScholarships } from '@/lib/study/load.server';

const STEPS = [
  { title: 'Choose a destination and programme', body: 'See costs, requirements and what student life looks like.' },
  { title: 'Apply online', body: 'One form, and you can follow up with our team at any point.' },
  { title: 'We guide you through', body: 'From your application to your arrival in Ghana.' },
];

export default async function StudyBand() {
  const scholarships = (await getOpenScholarships()).slice(0, 2);

  return (
    <section aria-labelledby="home-study" className="py-12 md:py-16" style={{ background: 'var(--sp-bg-secondary)', color: 'var(--sp-text-primary)', borderTop: '1px solid var(--sp-border)', borderBottom: '1px solid var(--sp-border)' }}>
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-primary)' }}>Study abroad</p>
            <h2 id="home-study" className="mt-2 text-[clamp(1.5rem,1.2rem+1.5vw,2.25rem)] font-bold leading-tight">Study in Ghana, with a team behind your application</h2>
            <p className="mt-4 max-w-xl leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>Compare destinations, costs and scholarships, then apply online. Our team guides you from application to arrival.</p>
            <div className="mt-6"><Button href="/services/study-abroad">Start your application</Button></div>
          </div>
          <div>
            <ol className="grid gap-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-4 rounded-2xl p-5" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' }}>
                  <span aria-hidden className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: 'var(--sp-primary)' }}>{i + 1}</span>
                  <div>
                    <h3 className="font-bold">{step.title}</h3>
                    <p className="mt-1 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            {scholarships.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--sp-text-secondary)' }}>Open scholarships</h3>
                <ul className="mt-2 grid gap-2">
                  {scholarships.map((sc) => (
                    <li key={sc.id} className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)' }}>
                      <span className="font-semibold">{sc.title}</span>
                      <span style={{ color: 'var(--sp-text-secondary)' }}>
                        {sc.amount ? ` · ${sc.amount}` : ''} · Deadline: {deadlineLabel(sc.deadline)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
