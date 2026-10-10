import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Breadcrumbs from '@/components/Breadcrumbs';
import { cardStyle } from '@/components/content/ContentShell';
import JsonLd from '@/components/seo/JsonLd';
import { ServiceTheme } from '@/components/ServiceTheme';
import Button from '@/components/ui/Button';
import { getJobBySlug } from '@/lib/careers/load.server';

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

const EMPLOYMENT = { 'Full-time': 'FULL_TIME', 'Part-time': 'PART_TIME', Contract: 'CONTRACTOR', Internship: 'INTERN' } as const;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return { title: 'Careers' };
  const description = job.description.slice(0, 160) || `${job.title} at TechTour Ghana.`;
  return {
    title: `${job.title} (${job.type})`,
    description,
    alternates: { canonical: `/about/careers/${job.slug}` },
    openGraph: { title: `${job.title} at TechTour Ghana`, description, url: `/about/careers/${job.slug}`, type: 'website' },
  };
}

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold">{title}</h2>
      <ul className="mt-3 space-y-2" style={{ color: 'var(--sp-text-secondary)' }}>
        {items.map((i) => (
          <li key={i} className="flex gap-3"><span aria-hidden style={{ color: 'var(--sp-primary)' }}>&bull;</span><span>{i}</span></li>
        ))}
      </ul>
    </section>
  );
}

export default async function JobPage({ params }: Params) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) notFound();

  const apply = `mailto:careers@techtourghana.com?subject=${encodeURIComponent(`Application: ${job.title}`)}`;
  const closing = job.closingDate ? new Date(`${job.closingDate}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : null;

  return (
    <ServiceTheme>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'JobPosting',
          title: job.title,
          description: job.description,
          datePosted: job.postedAt,
          ...(job.closingDate ? { validThrough: job.closingDate } : {}),
          employmentType: EMPLOYMENT[job.type],
          hiringOrganization: { '@type': 'Organization', name: 'TechTour Ghana' },
          jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.location, addressCountry: 'GH' } },
        }}
      />
      <main style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-primary)' }}>
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
          <div className="mb-6"><Breadcrumbs items={[{ label: 'About', href: '/about' }, { label: 'Careers', href: '/about/careers' }, { label: job.title }]} /></div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <article>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full px-3 py-1" style={{ ...cardStyle, color: 'var(--sp-primary)' }}>{job.department}</span>
                <span className="rounded-full px-3 py-1" style={{ ...cardStyle, color: 'var(--sp-text-secondary)' }}>{job.type}</span>
                {job.level && <span className="rounded-full px-3 py-1" style={{ ...cardStyle, color: 'var(--sp-text-secondary)' }}>{job.level}</span>}
              </div>
              <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{job.title}</h1>
              <p className="mt-2 text-sm" style={{ color: 'var(--sp-text-muted)' }}>{job.location}{closing ? ` · Apply by ${closing}` : ''}</p>

              <section className="mt-8">
                <h2 className="text-lg font-bold">About the role</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{job.description}</p>
              </section>
              <List title="Responsibilities" items={job.responsibilities} />
              <List title="What we are looking for" items={job.requirements} />
              <List title="Benefits" items={job.benefits} />
              {job.tags.length > 0 && (
                <ul className="mt-8 flex flex-wrap gap-2">
                  {job.tags.map((t) => <li key={t} className="rounded-full px-3 py-1 text-xs" style={{ ...cardStyle, color: 'var(--sp-text-secondary)' }}>{t}</li>)}
                </ul>
              )}
            </article>

            <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Apply">
              <div className="rounded-3xl p-5" style={cardStyle}>
                <h2 className="font-bold">Interested?</h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>Email us your CV and a short note about why this role fits you.</p>
                <div className="mt-4"><Button href={apply} full>Apply by email</Button></div>
                <div className="mt-3"><Button href="/about/careers#roles" variant="secondary" arrow={false} full size="sm">All roles</Button></div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </ServiceTheme>
  );
}
