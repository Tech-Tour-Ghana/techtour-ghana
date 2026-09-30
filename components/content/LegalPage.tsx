import ContentShell, { cardStyle } from './ContentShell';

export interface LegalSection {
  heading: string;
  body: string[];
}

// Text-only policy page. Each string in `body` is one paragraph.
export default function LegalPage({
  title,
  titleAccent,
  description,
  updated,
  sections,
}: {
  title: string;
  titleAccent: string;
  description: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <ContentShell title={title} titleAccent={titleAccent} description={description}>
      <article className="rounded-2xl p-6 md:p-10 max-w-3xl mx-auto" style={cardStyle}>
        <p className="text-xs mb-6" style={{ color: 'var(--sp-text-muted)' }}>Last updated {updated}</p>
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-bold mb-2">{section.heading}</h2>
              <div className="space-y-3 leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>
                {section.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </ContentShell>
  );
}
