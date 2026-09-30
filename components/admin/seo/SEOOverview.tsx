'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

import { Surface } from '@/components/admin/ui';
import type { AuditedItem, AuditReport } from '@/lib/seo/audit';

const KIND = { blog_post: 'Article', destination: 'Destination', blog_category: 'Category' } as const;

function Stat({ label, count, tone }: { label: string; count: number; tone: 'ok' | 'warn' | 'bad' | 'info' }) {
  const color = tone === 'ok' ? 'var(--adm-success)' : tone === 'bad' ? 'var(--adm-error)' : tone === 'warn' ? '#B45309' : 'var(--adm-text)';
  const word = tone === 'ok' ? 'Good' : tone === 'bad' ? 'Missing' : tone === 'warn' ? 'Needs improvement' : null;
  return (
    <Surface className="p-4">
      <p className="text-2xl font-bold" style={{ color }}>{count}</p>
      <p className="text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>{label}</p>
      {word && <p className="mt-0.5 text-[11px] font-semibold" style={{ color }}>{word}</p>}
    </Surface>
  );
}

function Issue({ title, items, detail }: { title: string; items: AuditedItem[]; detail?: (i: AuditedItem) => string }) {
  if (!items.length) return null;
  return (
    <Surface className="p-4">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--adm-text)' }}>
        <FontAwesomeIcon icon={faTriangleExclamation} className="h-3.5 w-3.5" style={{ color: '#B45309' }} />
        {title} <span className="text-xs font-normal" style={{ color: 'var(--adm-muted)' }}>({items.length})</span>
      </h3>
      <ul className="space-y-1">
        {items.slice(0, 8).map((i) => (
          <li key={`${i.kind}:${i.key}`} className="flex items-center justify-between gap-3 text-xs">
            <Link href={i.href} className="min-w-0 truncate font-medium hover:underline" style={{ color: 'var(--adm-primary)' }}>{i.name || 'Untitled'}</Link>
            <span className="flex-shrink-0" style={{ color: 'var(--adm-muted)' }}>{detail ? detail(i) : KIND[i.kind]}</span>
          </li>
        ))}
        {items.length > 8 && <li className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>and {items.length - 8} more</li>}
      </ul>
    </Surface>
  );
}

export default function SEOOverview({ report, draftCount }: { report: AuditReport; draftCount: number }) {
  const r = report;
  const problems = r.missingTitle.length + r.missingDescription.length + r.missingImage.length + r.missingAlt.length +
    r.duplicateTitles.length + r.duplicateDescriptions.length + r.badCanonical.length + r.needsImprovement.length;

  return (
    <div className="space-y-4">
      <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>
        This is an on-site audit of TechTour&apos;s own published content. It is not Google Search Console data and says nothing about rankings.
        {draftCount > 0 && ` ${draftCount} draft${draftCount > 1 ? 's are' : ' is'} not included because drafts are not public.`}
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="SEO-managed pages" count={r.live.length} tone="info" />
        <Stat label="Missing SEO titles" count={r.missingTitle.length} tone={r.missingTitle.length ? 'bad' : 'ok'} />
        <Stat label="Missing meta descriptions" count={r.missingDescription.length} tone={r.missingDescription.length ? 'bad' : 'ok'} />
        <Stat label="Missing featured images" count={r.missingImage.length} tone={r.missingImage.length ? 'bad' : 'ok'} />
        <Stat label="Images without alt text" count={r.missingAlt.length} tone={r.missingAlt.length ? 'warn' : 'ok'} />
        <Stat label="Duplicate SEO titles" count={r.duplicateTitles.length} tone={r.duplicateTitles.length ? 'warn' : 'ok'} />
        <Stat label="Duplicate descriptions" count={r.duplicateDescriptions.length} tone={r.duplicateDescriptions.length ? 'warn' : 'ok'} />
        <Stat label="Hidden from search (noindex)" count={r.noindex.length} tone="info" />
      </div>

      {r.live.length === 0 ? (
        <Surface className="p-8 text-center">
          <p className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>Nothing to audit yet</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--adm-muted)' }}>Publish an article or activate a destination and it will appear here.</p>
        </Surface>
      ) : problems === 0 ? (
        <Surface className="flex items-center gap-3 p-6">
          <FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5" style={{ color: 'var(--adm-success)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>No SEO issues found</p>
        </Surface>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Issue title="Articles and destinations needing improvement" items={r.needsImprovement} detail={(i) => `${i.analysis.score} / 100`} />
          <Issue title="Missing SEO title" items={r.missingTitle} />
          <Issue title="Missing meta description" items={r.missingDescription} />
          <Issue title="Missing featured image" items={r.missingImage} />
          <Issue title="Images without alt text" items={r.missingAlt} />
          <Issue title="Invalid canonical URL" items={r.badCanonical} />
          {r.duplicateTitles.map((g) => <Issue key={`t-${g.text}`} title={`Duplicate SEO title: “${g.text}”`} items={g.items} />)}
          {r.duplicateDescriptions.map((g) => <Issue key={`d-${g.text}`} title="Duplicate description" items={g.items} detail={() => g.text.slice(0, 40)} />)}
        </div>
      )}
    </div>
  );
}
