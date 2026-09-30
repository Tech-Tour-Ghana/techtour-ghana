'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import { contentWarnings } from '@/lib/seo/score';
import type { HtmlStats } from '@/lib/seo/html';

/** Editorial guidance separate from the SEO score. Readability is a hint, not a grade. */
export default function ArticleQuality({ stats, hasFeatured }: { stats: HtmlStats; hasFeatured: boolean }) {
  const internal = stats.links.filter((l) => l.internal).length;
  const rows: [string, string | number][] = [
    ['Words', stats.wordCount],
    ['Reading time', `${stats.readingMinutes} min`],
    ['Paragraphs', stats.paragraphs.length],
    ['Headings', stats.headings.length],
    ['Images', stats.images.length],
    ['Internal links', internal],
    ['External links', stats.links.length - internal],
  ];
  const warnings = contentWarnings(stats, hasFeatured);
  return (
    <div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <dt style={{ color: 'var(--adm-muted)' }}>{k}</dt>
            <dd className="font-semibold" style={{ color: 'var(--adm-text)' }}>{v}</dd>
          </div>
        ))}
      </dl>
      {warnings.length > 0 && (
        <ul className="mt-3 space-y-1">
          {warnings.map((w) => (
            <li key={w} className="flex items-start gap-2 text-xs" style={{ color: 'var(--adm-text-2)' }}>
              <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 h-3 w-3 flex-shrink-0" style={{ color: '#B45309' }} />
              <span><span className="sr-only">Warning: </span>{w}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
