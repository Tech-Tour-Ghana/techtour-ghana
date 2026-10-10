import Button from '@/components/ui/Button';
import { deadlineLabel, getOpenScholarships } from '@/lib/study/load.server';

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
          {scholarships.length > 0 && (
            <ul className="grid gap-3">
              {scholarships.map((s) => (
                <li key={s.id} className="rounded-2xl p-5" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' }}>
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>
                    {s.amount && <span className="font-semibold" style={{ color: 'var(--sp-primary)' }}>{s.amount}</span>}
                    {s.amount && ' · '}Deadline: {deadlineLabel(s.deadline)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
