import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faEnvelopeOpenText, faHandHoldingHeart, faMapLocationDot } from '@fortawesome/free-solid-svg-icons';

const REASONS = [
  { icon: faMapLocationDot, title: 'Local expertise', body: 'Our guides and artisans are from Ghana and know it first-hand.' },
  { icon: faCalendarCheck, title: 'Book online', body: 'Pick a dated departure and pay securely on the site.' },
  { icon: faHandHoldingHeart, title: 'Fair to communities', body: 'Our work supports local guides and artisans.' },
  { icon: faEnvelopeOpenText, title: 'Real people', body: 'Our team replies to every enquiry.' },
];

export default async function WhyUs() {
  return (
    <section aria-labelledby="home-why" className="py-12 md:py-16" style={{ background: 'var(--sp-bg-secondary)', color: 'var(--sp-text-primary)' }}>
      <div className="mx-auto w-full max-w-6xl px-4">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-primary)' }}>Why TechTour Ghana</p>
        <h2 id="home-why" className="mt-2 text-[clamp(1.5rem,1.2rem+1.5vw,2.25rem)] font-bold leading-tight">Travel with people who know the way</h2>
        <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((r) => (
            <li key={r.title}>
              <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', color: 'var(--sp-primary)' }}><FontAwesomeIcon icon={r.icon} className="h-5 w-5" /></span>
              <h3 className="mt-4 text-lg font-bold">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{r.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
