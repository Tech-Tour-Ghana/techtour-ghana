import Link from 'next/link';

import Button from '@/components/ui/Button';
import ContentShell, { cardStyle } from './ContentShell';

export interface LegalSection {
  heading: string;
  body: string[];
}

const POLICIES = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/refund', label: 'Refund Policy' },
  { href: '/cookies', label: 'Cookie Policy' },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Text-only policy page. Each string in `body` is one paragraph. Sections are
// numbered and listed in a contents column so a long policy is easy to scan.
export default function LegalPage({
  title,
  titleAccent,
  description,
  updated,
  sections,
  path,
}: {
  title: string;
  titleAccent: string;
  description: string;
  updated: string;
  sections: LegalSection[];
  path: string;
}) {
  const others = POLICIES.filter((p) => p.href !== path);
  return (
    <ContentShell wide title={title} titleAccent={titleAccent} description={description}>
      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <details className="rounded-2xl p-4 lg:hidden" style={cardStyle}>
            <summary className="cursor-pointer text-sm font-semibold">On this page</summary>
            <ol className="mt-3 space-y-2 text-sm">
              {sections.map((s, i) => <li key={s.heading}><a href={`#${slug(s.heading)}`} style={{ color: 'var(--sp-text-secondary)' }}>{i + 1}. {s.heading}</a></li>)}
            </ol>
          </details>
          <nav aria-label="On this page" className="hidden lg:block">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--sp-text-muted)' }}>On this page</h2>
            <ol className="space-y-2 border-l text-sm" style={{ borderColor: 'var(--sp-border)' }}>
              {sections.map((s, i) => (
                <li key={s.heading} className="pl-3"><a href={`#${slug(s.heading)}`} className="hover:underline" style={{ color: 'var(--sp-text-secondary)' }}>{i + 1}. {s.heading}</a></li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="min-w-0">
          <article className="rounded-2xl p-6 md:p-10" style={cardStyle}>
            <p className="mb-6 text-sm" style={{ color: 'var(--sp-text-muted)' }}>Last updated <time>{updated}</time></p>
            <div className="space-y-10">
              {sections.map((section, i) => (
                <section key={section.heading} id={slug(section.heading)} className="scroll-mt-28" aria-labelledby={`${slug(section.heading)}-h`}>
                  <h2 id={`${slug(section.heading)}-h`} className="mb-3 text-xl font-bold md:text-2xl">{i + 1}. {section.heading}</h2>
                  <div className="space-y-3 leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>
                    {section.body.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <nav aria-label="Other policies" className="rounded-2xl p-6" style={cardStyle}>
              <h2 className="font-bold">Other policies</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {others.map((p) => <li key={p.href}><Link href={p.href} className="font-semibold underline" style={{ color: 'var(--sp-primary)' }}>{p.label}</Link></li>)}
              </ul>
            </nav>
            <div className="rounded-2xl p-6" style={cardStyle}>
              <h2 className="font-bold">Questions about this policy?</h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--sp-text-secondary)' }}>Send us a message and the team will reply by email.</p>
              <div className="mt-4"><Button href="/about/contact-us" variant="secondary" size="sm">Contact us</Button></div>
            </div>
          </div>
        </div>
      </div>
    </ContentShell>
  );
}
