'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import type { SeoAnalysis, SeoCheck } from '@/lib/seo/score';

const LOOK = {
  'Needs Work': { color: 'var(--adm-error)', bg: 'var(--adm-error-soft)' },
  Fair: { color: '#B45309', bg: 'rgba(245, 158, 11, 0.15)' },
  Good: { color: 'var(--adm-primary)', bg: 'var(--adm-primary-soft)' },
  Excellent: { color: 'var(--adm-success)', bg: 'var(--adm-success-soft)' },
} as const;

const GROUPS: { status: SeoCheck['status']; title: string; icon: typeof faCircleCheck; color: string }[] = [
  { status: 'critical', title: 'Critical', icon: faCircleXmark, color: 'var(--adm-error)' },
  { status: 'improve', title: 'Improve', icon: faTriangleExclamation, color: '#B45309' },
  { status: 'pass', title: 'Passed', icon: faCircleCheck, color: 'var(--adm-success)' },
];

/** Score plus the reasons behind it. Status is shown with an icon and a word, never colour alone. */
export default function SEOScore({ analysis, compact = false }: { analysis: SeoAnalysis; compact?: boolean }) {
  const look = LOOK[analysis.label];
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-full" style={{ background: look.bg, color: look.color, border: `2px solid ${look.color}` }} role="img" aria-label={`SEO score ${analysis.score} out of 100, ${analysis.label}`}>
          <span className="text-xl font-bold leading-none">{analysis.score}</span>
          <span className="text-[9px] font-semibold">/ 100</span>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: look.color }}>{analysis.label}</p>
          <p className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>On-site checks only. This is not a Google score.</p>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 space-y-3">
          {GROUPS.map((g) => {
            const items = analysis.checks.filter((c) => c.status === g.status);
            if (!items.length) return null;
            const list = (
              <ul className="mt-1.5 space-y-1.5">
                {items.map((c) => (
                  <li key={c.id} className="flex items-start gap-2 text-xs" style={{ color: 'var(--adm-text-2)' }}>
                    <FontAwesomeIcon icon={g.icon} className="mt-0.5 h-3 w-3 flex-shrink-0" style={{ color: g.color }} />
                    <span><span className="sr-only">{g.title}: </span>{c.message}</span>
                  </li>
                ))}
              </ul>
            );
            return g.status === 'pass' ? (
              <details key={g.status}>
                <summary className="cursor-pointer text-xs font-bold" style={{ color: g.color }}>{g.title} ({items.length})</summary>
                {list}
              </details>
            ) : (
              <div key={g.status}>
                <p className="text-xs font-bold" style={{ color: g.color }}>{g.title} ({items.length})</p>
                {list}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
