import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuildingColumns, faLocationDot } from '@fortawesome/free-solid-svg-icons';

import { cardStyle } from '@/components/content/ContentShell';
import Button from '@/components/ui/Button';
import { formatTuition, type StudyInstitution } from '@/lib/study/load.server';
import { levelLabel } from '@/lib/study/meta';

/** A partner university with its programmes. Each programme leads straight into the application. */
export default function InstitutionCard({ institution: i, country }: { institution: StudyInstitution; country?: string }) {
  const shown = i.programs.slice(0, 4);
  const more = i.programs.slice(4);

  const row = (p: StudyInstitution['programs'][number]) => (
    <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{p.title}</p>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--sp-text-muted)' }}>
          {[levelLabel(p.level), p.duration, formatTuition(p.tuition_amount, p.tuition_currency), p.intakes && `Intakes: ${p.intakes}`].filter(Boolean).join(' · ')}
        </p>
      </div>
      <Button href={`/services/study-abroad/apply?program=${p.id}`} size="sm" variant="secondary">Apply</Button>
    </li>
  );

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl" style={cardStyle}>
      <div className="flex items-start gap-4 p-5">
        <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl" style={{ background: 'var(--sp-bg-primary)', border: '1px solid var(--sp-border)' }}>
          {i.logo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={i.logo_url} alt="" className="h-full w-full object-contain p-1.5" loading="lazy" />
            : <FontAwesomeIcon icon={faBuildingColumns} className="h-6 w-6" style={{ color: 'var(--sp-text-muted)' }} />}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-snug">{i.name}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs" style={{ color: 'var(--sp-text-muted)' }}>
            {(i.city || country) && <span className="inline-flex items-center gap-1"><FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />{[i.city, country].filter(Boolean).join(', ')}</span>}
            {i.is_partner && <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-primary)' }}>TechTour partner</span>}
          </p>
        </div>
      </div>
      {i.description && <p className="line-clamp-3 px-5 text-sm leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{i.description}</p>}
      {i.programs.length > 0 && (
        <div className="mt-3 border-t px-5 pb-3" style={{ borderColor: 'var(--sp-border)' }}>
          <ul className="divide-y" style={{ borderColor: 'var(--sp-border)' }}>{shown.map(row)}</ul>
          {more.length > 0 && (
            <details className="border-t" style={{ borderColor: 'var(--sp-border)' }}>
              <summary className="cursor-pointer py-3 text-sm font-semibold" style={{ color: 'var(--sp-primary)' }}>Show {more.length} more programme{more.length === 1 ? '' : 's'}</summary>
              <ul className="divide-y" style={{ borderColor: 'var(--sp-border)' }}>{more.map(row)}</ul>
            </details>
          )}
        </div>
      )}
    </article>
  );
}
