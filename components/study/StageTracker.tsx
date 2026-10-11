// The stages of a study application as a progress tracker. Horizontal from the
// small breakpoint up, vertical on phones. Purely presentational.

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

import { STUDY_META, STUDY_STAGES, isEnded, stageIndex } from '@/lib/study/meta';

export default function StageTracker({ status }: { status: string }) {
  const ended = isEnded(status);
  const current = ended ? -1 : stageIndex(status);

  return (
    <ol className="grid gap-0 sm:grid-flow-col sm:auto-cols-fr" aria-label="Application progress">
      {STUDY_STAGES.map((s, i) => {
        const done = !ended && i < current;
        const now = !ended && i === current;
        const color = ended ? 'var(--brand-muted)' : done || now ? 'var(--brand-teal)' : 'var(--brand-line)';
        return (
          <li key={s} aria-current={now ? 'step' : undefined} className="relative flex items-center gap-3 pb-5 sm:flex-col sm:gap-2 sm:pb-0 sm:text-center">
            {/* connector */}
            {i < STUDY_STAGES.length - 1 && (
              <span aria-hidden className="absolute left-[0.95rem] top-8 h-[calc(100%-1.25rem)] w-0.5 sm:left-1/2 sm:top-[0.95rem] sm:h-0.5 sm:w-full" style={{ background: done ? 'var(--brand-teal)' : 'var(--brand-line)' }} />
            )}
            <span
              className="relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: done ? 'var(--brand-teal)' : now ? 'var(--brand-card)' : 'var(--brand-card)',
                border: `2px solid ${color}`,
                color: done ? 'var(--brand-on-primary)' : now ? 'var(--brand-teal)' : 'var(--brand-muted)',
                boxShadow: now ? '0 0 0 4px color-mix(in srgb, var(--brand-teal) 18%, transparent)' : undefined,
              }}
            >
              {done ? <FontAwesomeIcon icon={faCheck} className="h-3 w-3" /> : i + 1}
            </span>
            <span className="text-sm sm:px-1 sm:text-xs" style={{ color: now ? 'var(--brand-text)' : 'var(--brand-muted)', fontWeight: now ? 700 : 500 }}>
              {STUDY_META[s].short}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
