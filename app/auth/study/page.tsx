'use client';

// The student's study abroad applications. TechTour handles each application with
// the university on their behalf; this page shows where each one is. Signed-out
// visitors are redirected by middleware.ts, rows are scoped by RLS (0016, 0046).

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faGraduationCap, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import DashboardLayout from '@/components/DashboardLayout';
import Button from '@/components/ui/Button';
import StageTracker from '@/components/study/StageTracker';
import { createBrowserClient } from '@/lib/supabase/client';
import { STUDY_META, asStudyStatus, isEnded } from '@/lib/study/meta';

interface Row {
  id: string;
  reference: string;
  status: string;
  program_name: string;
  university: string;
  location: string;
  intake: string;
  next_step: string;
  created_at: string;
  last_activity_at: string;
  study_application_documents: { status: string; required: boolean }[];
}

const SELECT = 'id, reference, status, program_name, university, location, intake, next_step, created_at, last_activity_at, study_application_documents(status, required)';
const card = { background: 'var(--brand-card)', border: '1px solid var(--brand-line)' } as const;

export default function StudyPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    createBrowserClient()
      .from('study_applications')
      .select(SELECT)
      .order('last_activity_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setFailed(true);
        else setRows((data as unknown as Row[]) ?? []);
      });
  }, []);

  useEffect(() => {
    load();
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  if (failed) {
    return (
      <DashboardLayout title="Study Abroad" subtitle="Your applications and where they stand">
        <div role="alert" className="py-12 text-center">
          <p className="mb-4 text-sm" style={{ color: 'var(--brand-text-2)' }}>We could not load this right now. Please try again.</p>
          <Button variant="accent" size="sm" onClick={load}>Try again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Study Abroad" subtitle="Your applications and where they stand">
      {rows === null ? (
        <p className="py-12 text-center text-sm" style={{ color: 'var(--brand-muted)' }}>Loading your applications...</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={card}>
          <FontAwesomeIcon icon={faGraduationCap} className="mb-4 h-10 w-10" style={{ color: 'var(--brand-muted)' }} />
          <h2 className="mb-2 text-xl font-semibold" style={{ color: 'var(--brand-text)' }}>No applications yet</h2>
          <p className="mx-auto max-w-md text-sm" style={{ color: 'var(--brand-text-2)' }}>
            Choose a university and programme and we handle the application with the university for you. You can follow every step here.
          </p>
          <Button variant="accent" className="mt-5" href="/services/study-abroad">Explore universities</Button>
        </div>
      ) : (
        <ul className="space-y-5">
          {rows.map((a) => {
            const status = asStudyStatus(a.status);
            const meta = STUDY_META[status];
            const docs = a.study_application_documents;
            const required = docs.filter((d) => d.required);
            const have = required.filter((d) => d.status === 'uploaded' || d.status === 'approved').length;
            const attention = docs.filter((d) => d.status === 'rejected').length;
            return (
              <li key={a.id}>
                <Link href={`/auth/study/${a.id}`} className="block rounded-2xl p-5 transition hover:shadow-lg sm:p-6" style={card}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold" style={{ color: 'var(--brand-text)' }}>{a.program_name}</h2>
                      <p className="mt-0.5 text-sm" style={{ color: 'var(--brand-text-2)' }}>{[a.university, a.location, a.intake].filter(Boolean).join(' · ')}</p>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--brand-muted)' }}>Reference {a.reference}</p>
                    </div>
                    <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: 'var(--brand-text)' }}>
                      <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: meta.color }} />{meta.label}
                    </span>
                  </div>

                  {isEnded(status) ? (
                    <p className="mt-4 text-sm" style={{ color: 'var(--brand-text-2)' }}>{meta.hint}</p>
                  ) : (
                    <div className="mt-5"><StageTracker status={status} /></div>
                  )}

                  {a.next_step && !isEnded(status) && (
                    <p className="mt-4 rounded-xl p-3 text-sm" style={{ background: 'color-mix(in srgb, var(--brand-gold) 14%, transparent)', color: 'var(--brand-text)' }}>
                      <strong>Next:</strong> {a.next_step}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs" style={{ color: 'var(--brand-text-2)' }}>
                    {required.length > 0 && <span>{have} of {required.length} required documents uploaded</span>}
                    {attention > 0 && <span className="inline-flex items-center gap-1 font-semibold" style={{ color: 'var(--brand-error-text)' }}><FontAwesomeIcon icon={faTriangleExclamation} className="h-3 w-3" />{attention} need{attention === 1 ? 's' : ''} attention</span>}
                    <span className="ml-auto inline-flex items-center gap-1 font-semibold" style={{ color: 'var(--brand-teal)' }}>View progress <FontAwesomeIcon icon={faChevronRight} className="h-2.5 w-2.5" /></span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardLayout>
  );
}
