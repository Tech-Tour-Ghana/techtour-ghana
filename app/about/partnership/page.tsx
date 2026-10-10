import type { Metadata } from 'next';

import ContentShell, { cardStyle } from '@/components/content/ContentShell';
import PartnershipForm from '@/components/partnership/PartnershipForm';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Partnerships',
  description: 'Partner with TechTour Ghana: hotels, tour operators, artisans, schools, NGOs and travel agencies working together for Ghanaian tourism.',
  alternates: { canonical: '/about/partnership' },
};

type SearchParams = Promise<{ type?: string }>;

const TYPES = [
  { slug: 'hotels', title: 'Hotels and resorts', body: 'Places to stay for travelers on our tours and for our short-stay rentals.' },
  { slug: 'tour-operators', title: 'Tour operators and guides', body: 'Local experts who run or guide experiences across Ghana.' },
  { slug: 'artisans', title: 'Artisans and creators', body: 'Craftspeople who want to sell through our marketplace.' },
  { slug: 'educational', title: 'Educational institutions', body: 'Schools and universities for study abroad, exchange and research.' },
  { slug: 'ngos', title: 'NGOs and community organizations', body: 'Groups working on community-led and sustainable tourism.' },
  { slug: 'travel-agencies', title: 'Travel agencies', body: 'Agencies that want to offer TechTour Ghana experiences to their clients.' },
];

const STEPS = [
  { n: '1', title: 'Tell us about you', body: 'Use the form below with a few lines about your organization.' },
  { n: '2', title: 'We reply', body: 'Our team reads every enquiry and writes back to discuss fit.' },
  { n: '3', title: 'We agree how to work together', body: 'Terms depend on the type of partner, and we set them out in writing.' },
];

export default async function PartnershipPage({ searchParams }: { searchParams: SearchParams }) {
  const { type } = await searchParams;

  return (
    <ContentShell wide title="Partner with" titleAccent="TechTour Ghana" description="We work with people and organizations who care about Ghanaian tourism and the communities behind it.">
      <section aria-labelledby="types-h">
        <h2 id="types-h" className="text-2xl font-bold sm:text-3xl">Who we work with</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TYPES.map((t) => (
            <li key={t.slug} className="flex flex-col rounded-3xl p-5" style={cardStyle}>
              <h3 className="font-semibold">{t.title}</h3>
              <p className="mt-1 flex-1 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>{t.body}</p>
              <div className="mt-4"><Button href={`/about/partnership?type=${t.slug}#apply`} variant="secondary" size="sm">Enquire</Button></div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="how-h">
        <h2 id="how-h" className="text-2xl font-bold sm:text-3xl">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-4 rounded-2xl p-5" style={cardStyle}>
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: 'var(--sp-primary)' }}>{s.n}</span>
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="apply" className="mt-14 scroll-mt-28" aria-labelledby="apply-h">
        <h2 id="apply-h" className="text-2xl font-bold sm:text-3xl">Start a conversation</h2>
        <p className="mt-2 max-w-2xl" style={{ color: 'var(--sp-text-secondary)' }}>Not sure which type fits? Choose &quot;Something else&quot; and tell us what you have in mind.</p>
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <PartnershipForm key={type ?? 'none'} defaultType={type} />
          <aside className="rounded-3xl p-6" style={cardStyle} aria-label="Other ways to reach us">
            <h3 className="font-bold">Prefer to talk?</h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>Write to our partnerships team directly, or use the contact page for phone numbers and our address.</p>
            <p className="mt-4 text-sm font-semibold"><a href="mailto:partners@techtourghana.com" className="underline" style={{ color: 'var(--sp-primary)' }}>partners@techtourghana.com</a></p>
            <div className="mt-5"><Button href="/about/contact-us" variant="secondary" size="sm">Contact page</Button></div>
          </aside>
        </div>
      </section>
    </ContentShell>
  );
}
