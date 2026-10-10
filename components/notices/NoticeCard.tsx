import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCircleExclamation, faInfo, faThumbtack, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

export type NoticeSeverity = 'info' | 'success' | 'warning' | 'critical';

export const SEVERITY: Record<NoticeSeverity, { label: string; icon: typeof faInfo; color: string }> = {
  info: { label: 'Info', icon: faInfo, color: 'var(--brand-info)' },
  success: { label: 'Good news', icon: faCheck, color: 'var(--brand-success)' },
  warning: { label: 'Heads up', icon: faTriangleExclamation, color: 'var(--brand-warning)' },
  critical: { label: 'Important', icon: faCircleExclamation, color: 'var(--brand-error)' },
};

export const severityOf = (s: string): NoticeSeverity => (s in SEVERITY ? (s as NoticeSeverity) : 'info');

export interface NoticeCardData {
  title: string;
  body: string;
  severity: string;
  is_pinned: boolean;
  starts_at: string;
}

export default function NoticeCard({ notice }: { notice: NoticeCardData }) {
  const sev = SEVERITY[severityOf(notice.severity)];
  const date = new Date(notice.starts_at);
  return (
    <article
      className="rounded-2xl p-4"
      style={{
        background: `color-mix(in srgb, ${sev.color} 8%, var(--brand-card))`,
        border: '1px solid var(--brand-line)',
        borderLeft: `4px solid ${sev.color}`,
      }}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: `color-mix(in srgb, ${sev.color} 16%, transparent)`, color: 'var(--brand-text)' }}>
          <FontAwesomeIcon icon={sev.icon} className="h-3 w-3" style={{ color: sev.color }} aria-hidden />
          {sev.label}
        </span>
        {notice.is_pinned && (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: 'var(--brand-subtle)', color: 'var(--brand-text-2)' }}>
            <FontAwesomeIcon icon={faThumbtack} className="h-3 w-3" aria-hidden />
            Pinned
          </span>
        )}
        {!Number.isNaN(date.getTime()) && (
          <time dateTime={notice.starts_at} className="ml-auto font-normal" style={{ color: 'var(--brand-muted)' }}>
            {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </time>
        )}
      </div>
      <h3 className="mt-2 break-words text-base font-bold" style={{ color: 'var(--brand-text)' }}>{notice.title || 'Notice title'}</h3>
      {notice.body && <p className="mt-1 whitespace-pre-line break-words text-sm" style={{ color: 'var(--brand-text-2)' }}>{notice.body}</p>}
    </article>
  );
}
