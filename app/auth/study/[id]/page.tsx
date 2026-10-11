'use client';

// One study abroad application, from the student's side: where it is, what to do
// next, the document checklist (upload here), and the timeline of what TechTour
// has done. Files go to a private bucket under <user id>/<application id>/ and
// are attached through attach_study_document() (migration 0046).

import { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheckCircle, faFile, faHeadset, faTriangleExclamation, faUpload } from '@fortawesome/free-solid-svg-icons';

import DashboardLayout from '@/components/DashboardLayout';
import StageTracker from '@/components/study/StageTracker';
import { createBrowserClient } from '@/lib/supabase/client';
import { DOC_ACCEPT, DOC_STATUS_META, MAX_DOC_BYTES, STUDY_BUCKET, STUDY_META, asStudyStatus, isEnded, type StudyDocument, type StudyEvent } from '@/lib/study/meta';

interface App {
  id: string;
  user_id: string;
  reference: string;
  status: string;
  program_name: string;
  university: string;
  location: string;
  intake: string;
  next_step: string;
  created_at: string;
}

const card = { background: 'var(--brand-card)', border: '1px solid var(--brand-line)' } as const;
const soft = (color: string, pct = 14) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const OK_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export default function StudyApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [app, setApp] = useState<App | null>(null);
  const [docs, setDocs] = useState<StudyDocument[]>([]);
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'failed'>('loading');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: string; text: string } | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    const supabase = createBrowserClient();
    const [a, d, e] = await Promise.all([
      supabase.from('study_applications').select('id, user_id, reference, status, program_name, university, location, intake, next_step, created_at').eq('id', id).maybeSingle(),
      supabase.from('study_application_documents').select('*').eq('application_id', id).order('sort_order'),
      supabase.from('study_application_events').select('id, kind, title, body, is_public, created_at').eq('application_id', id).order('created_at', { ascending: false }),
    ]);
    if (a.error) return setState('failed');
    if (!a.data) return setState('missing');
    setApp(a.data as App);
    setDocs((d.data as StudyDocument[] | null) ?? []);
    setEvents((e.data as StudyEvent[] | null) ?? []);
    setState('ready');
  }, [id]);

  useEffect(() => {
    load();
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  async function upload(doc: StudyDocument, file: File) {
    if (!app) return;
    setMessage(null);
    if (file.size > MAX_DOC_BYTES) return setMessage({ id: doc.id, text: 'That file is larger than 10 MB. Please choose a smaller one.' });
    if (file.type && !OK_TYPES.includes(file.type)) return setMessage({ id: doc.id, text: 'Please upload a PDF, a photo (JPG, PNG) or a Word document.' });
    setBusyId(doc.id);
    const supabase = createBrowserClient();
    const path = `${app.user_id}/${app.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, '_')}`;
    const up = await supabase.storage.from(STUDY_BUCKET).upload(path, file, { contentType: file.type || undefined });
    if (up.error) { setBusyId(null); return setMessage({ id: doc.id, text: 'The upload did not work. Check your connection and try again.' }); }
    const { error } = await supabase.rpc('attach_study_document', { p_document_id: doc.id, p_path: path, p_name: file.name, p_mime: file.type || 'application/octet-stream', p_size: file.size });
    if (error) {
      await supabase.storage.from(STUDY_BUCKET).remove([path]);
      setBusyId(null);
      return setMessage({ id: doc.id, text: error.message || 'We could not save that file.' });
    }
    // The old file of a replaced document is no longer needed.
    if (doc.file_path) await supabase.storage.from(STUDY_BUCKET).remove([doc.file_path]);
    setBusyId(null);
    await load();
  }

  async function openFile(doc: StudyDocument) {
    const { data } = await createBrowserClient().storage.from(STUDY_BUCKET).createSignedUrl(doc.file_path, 300);
    if (data) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  const title = app?.program_name ?? 'Application';

  if (state !== 'ready' || !app) {
    return (
      <DashboardLayout title="Study Abroad" subtitle="Your application">
        <div className="py-12 text-center">
          <p className="mb-4 text-sm" style={{ color: 'var(--brand-text-2)' }}>
            {state === 'loading' ? 'Loading your application...' : state === 'missing' ? 'We could not find that application.' : 'We could not load this right now. Please try again.'}
          </p>
          <Link href="/auth/study" className="text-sm font-semibold underline" style={{ color: 'var(--brand-teal)' }}>Back to my applications</Link>
        </div>
      </DashboardLayout>
    );
  }

  const status = asStudyStatus(app.status);
  const meta = STUDY_META[status];
  const required = docs.filter((d) => d.required);
  const have = required.filter((d) => d.status === 'uploaded' || d.status === 'approved').length;
  const closed = isEnded(status);

  return (
    <DashboardLayout title={title} subtitle={[app.university, app.location].filter(Boolean).join(' · ') || 'Study abroad application'}>
      <Link href="/auth/study" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--brand-teal)' }}>
        <FontAwesomeIcon icon={faArrowLeft} className="h-3 w-3" />All applications
      </Link>

      <section className="rounded-2xl p-5 sm:p-6" style={card} aria-labelledby="progress-h">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="progress-h" className="text-lg font-bold" style={{ color: 'var(--brand-text)' }}>Where your application is</h2>
            <p className="text-xs" style={{ color: 'var(--brand-muted)' }}>Reference {app.reference}{app.intake ? ` · ${app.intake} intake` : ''} · Started {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
          <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: soft(meta.color, 16), color: 'var(--brand-text)' }}>
            <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: meta.color }} />{meta.label}
          </span>
        </div>
        {!closed && <StageTracker status={status} />}
        <p className="mt-5 text-sm" style={{ color: 'var(--brand-text-2)' }}>{meta.hint}</p>
        {app.next_step && !closed && (
          <div className="mt-4 rounded-xl p-4" style={{ background: soft('var(--brand-gold)', 16), border: `1px solid ${soft('var(--brand-gold)', 40)}` }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--brand-accent-text)' }}>Your next step</p>
            <p className="mt-1 text-sm font-medium" style={{ color: 'var(--brand-text)' }}>{app.next_step}</p>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl p-5 sm:p-6" style={card} aria-labelledby="docs-h">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 id="docs-h" className="text-lg font-bold" style={{ color: 'var(--brand-text)' }}>Your documents</h2>
          {required.length > 0 && <span className="text-xs font-semibold" style={{ color: 'var(--brand-text-2)' }}>{have} of {required.length} required uploaded</span>}
        </div>
        {required.length > 0 && (
          <div className="mb-4 h-2 overflow-hidden rounded-full" style={{ background: 'var(--brand-line)' }} role="progressbar" aria-valuemin={0} aria-valuemax={required.length} aria-valuenow={have} aria-label="Required documents uploaded">
            <div className="h-full rounded-full" style={{ width: `${(have / required.length) * 100}%`, background: 'var(--brand-teal)' }} />
          </div>
        )}
        <p className="mb-4 text-xs" style={{ color: 'var(--brand-muted)' }}>PDF, JPG, PNG or Word, up to 10 MB each. Only you and the TechTour team can see them.</p>

        <ul className="space-y-3">
          {docs.map((d) => {
            const dm = DOC_STATUS_META[d.status];
            const canUpload = !closed && d.status !== 'approved';
            return (
              <li key={d.id} className="rounded-xl p-4" style={{ border: '1px solid var(--brand-line)', background: d.status === 'rejected' ? soft('var(--brand-error)', 6) : undefined }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>{d.label}{!d.required && <span className="ml-2 text-xs font-normal" style={{ color: 'var(--brand-muted)' }}>optional</span>}</p>
                    {d.description && <p className="mt-0.5 text-xs" style={{ color: 'var(--brand-text-2)' }}>{d.description}</p>}
                    {d.file_name && (
                      <button type="button" onClick={() => openFile(d)} className="mt-1 inline-flex max-w-full items-center gap-1.5 truncate text-xs font-medium underline" style={{ color: 'var(--brand-teal)' }}>
                        <FontAwesomeIcon icon={faFile} className="h-3 w-3 flex-shrink-0" />{d.file_name}
                      </button>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: soft(dm.color, 16), color: 'var(--brand-text)' }}>
                    {d.status === 'approved' && <FontAwesomeIcon icon={faCheckCircle} className="h-3 w-3" style={{ color: dm.color }} />}
                    {d.status === 'rejected' && <FontAwesomeIcon icon={faTriangleExclamation} className="h-3 w-3" style={{ color: dm.color }} />}
                    {dm.label}
                  </span>
                </div>
                {d.status === 'rejected' && d.staff_note && <p className="mt-2 text-sm font-medium" style={{ color: 'var(--brand-error-text)' }}>{d.staff_note}</p>}
                {canUpload && (
                  <div className="mt-3">
                    <input ref={(el) => { inputs.current[d.id] = el; }} type="file" accept={DOC_ACCEPT} className="sr-only" aria-label={`Choose a file for ${d.label}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(d, f); e.target.value = ''; }} />
                    <button
                      type="button"
                      disabled={busyId === d.id}
                      onClick={() => inputs.current[d.id]?.click()}
                      className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full px-4 text-sm font-semibold disabled:opacity-60"
                      style={d.status === 'requested' || d.status === 'rejected' ? { background: 'var(--brand-primary)', color: 'var(--brand-on-primary)' } : { border: '1px solid var(--brand-line)', color: 'var(--brand-text-2)' }}
                    >
                      <FontAwesomeIcon icon={faUpload} className="h-3.5 w-3.5" />
                      {busyId === d.id ? 'Uploading...' : d.file_path ? 'Replace file' : 'Upload'}
                    </button>
                    {message?.id === d.id && <p role="alert" className="mt-2 text-xs font-medium" style={{ color: 'var(--brand-error-text)' }}>{message.text}</p>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl p-5 sm:p-6" style={card} aria-labelledby="time-h">
        <h2 id="time-h" className="mb-4 text-lg font-bold" style={{ color: 'var(--brand-text)' }}>What has happened so far</h2>
        <ol className="relative space-y-5 border-l pl-6" style={{ borderColor: 'var(--brand-line)' }}>
          {events.map((e) => (
            <li key={e.id} className="relative">
              <span aria-hidden className="absolute -left-[31px] top-1 h-3 w-3 rounded-full" style={{ background: e.kind === 'stage' ? 'var(--brand-teal)' : 'var(--brand-muted)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>{e.title}</p>
              {e.body && <p className="mt-0.5 text-sm" style={{ color: 'var(--brand-text-2)' }}>{e.body}</p>}
              <p className="mt-0.5 text-xs" style={{ color: 'var(--brand-muted)' }}>{when(e.created_at)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5" style={card}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>Questions about this application?</p>
          <p className="text-xs" style={{ color: 'var(--brand-text-2)' }}>Send us a message and quote {app.reference}. Replies appear in your notifications.</p>
        </div>
        <Link href="/auth/support" className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full px-4 text-sm font-semibold" style={{ border: '1px solid var(--brand-line)', color: 'var(--brand-text)' }}>
          <FontAwesomeIcon icon={faHeadset} className="h-3.5 w-3.5" />Contact support
        </Link>
      </section>
    </DashboardLayout>
  );
}
