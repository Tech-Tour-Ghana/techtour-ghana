'use client';

// One study application, as staff work it: stage and assignment, the documents
// the student has provided (review them, ask for more), and the timeline the
// student sees in their dashboard. Everything staff change here reaches the
// student through database triggers (migration 0046).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faEye, faPlus, faTrash, faTriangleExclamation, faUpload } from '@fortawesome/free-solid-svg-icons';

import { notify } from '@/components/admin/toast';
import { Button, ListSkeleton, Modal, StatusPill, Tabs, confirmAction, fieldStyle, fmtDate, reportError } from '@/components/admin/ui';
import { createBrowserClient } from '@/lib/supabase/client';
import { DOC_STATUS_META, STUDY_BUCKET, STUDY_META, STUDY_STATUSES, asStudyStatus, type StudyDocument, type StudyEvent, type StudyStatus } from '@/lib/study/meta';
import { announceAdminCounts } from '@/lib/useAdminCounts';

export interface AdminApplication {
  id: string;
  user_id: string;
  reference: string;
  status: string;
  program_name: string;
  university: string;
  location: string;
  intake: string;
  created_at: string;
  last_activity_at: string;
  assigned_to: string | null;
  next_step: string;
  admin_notes: string;
  full_name: string;
  email: string;
  phone: string;
  nationality: string;
  education_level: string;
  intended_level: string;
  message: string;
  study_application_documents: { id: string; status: string; required: boolean }[];
}

export interface StaffUser { id: string; email: string | null; first_name: string | null; last_name: string | null }
export const staffName = (u: Pick<StaffUser, 'email' | 'first_name' | 'last_name'> | null | undefined) =>
  [u?.first_name, u?.last_name].filter(Boolean).join(' ') || u?.email || 'Unassigned';

const soft = (color: string, pct = 14) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
const fileSize = (n: number) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

type Tab = 'overview' | 'documents' | 'timeline';

export default function ApplicationDrawer({ app, staff, onClose, onChanged }: {
  app: AdminApplication;
  staff: StaffUser[];
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [tab, setTab] = useState<Tab>('overview');
  const [docs, setDocs] = useState<StudyDocument[] | null>(null);
  const [events, setEvents] = useState<StudyEvent[] | null>(null);
  const [nextStep, setNextStep] = useState(app.next_step);
  const [notes, setNotes] = useState(app.admin_notes);
  const [update, setUpdate] = useState('');
  const [visible, setVisible] = useState(true);
  const [newDoc, setNewDoc] = useState({ label: '', description: '', required: true });
  const [rejecting, setRejecting] = useState<{ id: string; note: string } | null>(null);
  const [viewing, setViewing] = useState<{ name: string; url: string; mime: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadDocs = useCallback(async () => {
    const { data } = await supabase.from('study_application_documents').select('*').eq('application_id', app.id).order('sort_order').order('created_at');
    setDocs((data as StudyDocument[] | null) ?? []);
  }, [supabase, app.id]);
  const loadEvents = useCallback(async () => {
    const { data } = await supabase.from('study_application_events').select('id, kind, title, body, is_public, created_at').eq('application_id', app.id).order('created_at', { ascending: false });
    setEvents((data as StudyEvent[] | null) ?? []);
  }, [supabase, app.id]);
  useEffect(() => { loadDocs(); loadEvents(); }, [loadDocs, loadEvents]);

  const status = asStudyStatus(app.status);
  const toReview = (docs ?? []).filter((d) => d.status === 'uploaded').length;

  async function patch(change: { status?: string; assigned_to?: string | null; next_step?: string; admin_notes?: string }, message: string) {
    if (reportError((await supabase.from('study_applications').update(change).eq('id', app.id)).error)) return false;
    notify(message, 'success');
    announceAdminCounts();
    await Promise.all([onChanged(), loadEvents()]);
    return true;
  }

  async function changeStage(next: StudyStatus) {
    if (next === status) return;
    if (next === 'rejected' && !(await confirmAction({ message: 'Mark this application as not successful? The student is notified.', confirmLabel: 'Mark not successful', danger: true }))) return;
    await patch({ status: next }, 'Stage updated. The student was notified.');
  }

  async function review(d: StudyDocument, next: 'approved' | 'rejected', note = '') {
    if (reportError((await supabase.from('study_application_documents').update({ status: next, staff_note: note }).eq('id', d.id)).error)) return;
    notify(next === 'approved' ? 'Document approved.' : 'Sent back to the student.', 'success');
    setRejecting(null);
    announceAdminCounts();
    await Promise.all([loadDocs(), loadEvents(), onChanged()]);
  }

  async function view(d: StudyDocument) {
    const { data, error } = await supabase.storage.from(STUDY_BUCKET).createSignedUrl(d.file_path, 600);
    if (error || !data) return notify('Could not open the file.');
    setViewing({ name: d.file_name || d.label, url: data.signedUrl, mime: d.mime_type });
  }

  async function uploadFor(d: StudyDocument, file: File) {
    if (file.size > 10 * 1024 * 1024) return notify('Files can be up to 10 MB.');
    setBusy(true);
    const path = `${app.user_id}/${app.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, '_')}`;
    const up = await supabase.storage.from(STUDY_BUCKET).upload(path, file, { contentType: file.type || undefined });
    if (up.error) { setBusy(false); return notify('Could not upload the file.'); }
    // Staff supplied it, so there is nothing to review.
    const { error } = await supabase.from('study_application_documents').update({ status: 'approved', file_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size, uploaded_at: new Date().toISOString() }).eq('id', d.id);
    setBusy(false);
    if (reportError(error)) return;
    notify('File added.', 'success');
    await Promise.all([loadDocs(), onChanged()]);
  }

  async function addDoc() {
    if (newDoc.label.trim().length < 2) return notify('Say which document you need.');
    const order = (docs ?? []).reduce((m, d) => Math.max(m, d.sort_order), 0) + 1;
    if (reportError((await supabase.from('study_application_documents').insert({ application_id: app.id, label: newDoc.label.trim(), description: newDoc.description.trim(), required: newDoc.required, sort_order: order }).select('id').single()).error)) return;
    setNewDoc({ label: '', description: '', required: true });
    notify('Document requested.', 'success');
    await Promise.all([loadDocs(), onChanged()]);
  }

  async function removeDoc(d: StudyDocument) {
    if (!(await confirmAction({ message: `Remove "${d.label}" from the checklist?`, danger: true, confirmLabel: 'Remove' }))) return;
    if (d.file_path) await supabase.storage.from(STUDY_BUCKET).remove([d.file_path]);
    if (reportError((await supabase.from('study_application_documents').delete().eq('id', d.id)).error)) return;
    await Promise.all([loadDocs(), onChanged()]);
  }

  async function addUpdate() {
    if (!update.trim()) return;
    const { data: auth } = await supabase.auth.getUser();
    if (reportError((await supabase.from('study_application_events').insert({ application_id: app.id, kind: 'note', title: update.trim(), is_public: visible, created_by: auth.user?.id ?? null })).error)) return;
    setUpdate('');
    notify(visible ? 'Update posted. The student was notified.' : 'Internal note saved.', 'success');
    await Promise.all([loadEvents(), onChanged()]);
  }

  const meta = STUDY_META[status];
  const label = (text: string) => <span className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>{text}</span>;

  return (
    <>
      <Modal title={app.full_name || 'Applicant'} subtitle={`${app.reference} · ${app.program_name}`} maxWidth="max-w-4xl" onClose={onClose}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: soft(meta.color), color: 'var(--adm-text)' }}>
            <span aria-hidden className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: meta.color }} />{meta.label}
          </span>
          {app.university && <StatusPill tone="neutral">{app.university}</StatusPill>}
          {app.location && <StatusPill tone="neutral">{app.location}</StatusPill>}
          {app.intake && <StatusPill tone="neutral">{app.intake}</StatusPill>}
        </div>

        <div className="mb-4">
          <Tabs value={tab} onChange={setTab} tabs={[{ key: 'overview' as Tab, label: 'Overview' }, { key: 'documents' as Tab, label: 'Documents', count: toReview || undefined }, { key: 'timeline' as Tab, label: 'Timeline', count: events?.length }]} />
        </div>

        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="sa-stage" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Stage</label>
                <select id="sa-stage" value={status} onChange={(e) => changeStage(e.target.value as StudyStatus)} className="w-full px-3 py-2 text-sm" style={fieldStyle}>
                  {STUDY_STATUSES.map((s) => <option key={s} value={s}>{STUDY_META[s].label}</option>)}
                </select>
                <p className="mt-1 text-[11px]" style={{ color: 'var(--adm-muted)' }}>Changing it adds to the student&apos;s timeline and notifies them.</p>
              </div>
              <div>
                <label htmlFor="sa-assign" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Counsellor</label>
                <select id="sa-assign" value={app.assigned_to ?? ''} onChange={(e) => patch({ assigned_to: e.target.value || null }, 'Assigned.')} className="w-full px-3 py-2 text-sm" style={fieldStyle}>
                  <option value="">Unassigned</option>
                  {staff.map((u) => <option key={u.id} value={u.id}>{staffName(u)}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="sa-next" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>What the student should do next</label>
              <textarea id="sa-next" rows={2} maxLength={500} value={nextStep} onChange={(e) => setNextStep(e.target.value)} placeholder="For example: Upload your passport and transcripts by Friday." className="w-full px-3 py-2 text-sm" style={fieldStyle} />
              <div className="mt-2 flex items-center gap-3">
                <Button variant="secondary" disabled={nextStep === app.next_step} onClick={() => patch({ next_step: nextStep.trim() }, 'Saved. The student sees this at the top of their dashboard.')}>Save</Button>
                <span className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>Shown prominently on the student&apos;s application page.</span>
              </div>
            </div>

            <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              {([['Email', app.email], ['Phone', app.phone || '-'], ['Nationality', app.nationality || '-'], ['Education', app.education_level || '-'], ['Applied', fmtDate(app.created_at)], ['Last activity', when(app.last_activity_at)]] as const).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4"><dt style={{ color: 'var(--adm-muted)' }}>{k}</dt><dd className="break-all text-right" style={{ color: 'var(--adm-text)' }}>{v}</dd></div>
              ))}
            </dl>
            {app.message && <p className="whitespace-pre-wrap rounded-[var(--adm-radius-control)] p-3 text-sm" style={{ background: 'var(--adm-bg)', border: '1px solid var(--adm-border)', color: 'var(--adm-text)' }}><strong className="block text-xs" style={{ color: 'var(--adm-muted)' }}>Message from the student</strong>{app.message}</p>}

            <div>
              <label htmlFor="sa-notes" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Private notes (never shown to the student)</label>
              <textarea id="sa-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 text-sm" style={fieldStyle} />
              <div className="mt-2"><Button variant="secondary" disabled={notes === app.admin_notes} onClick={() => patch({ admin_notes: notes.trim() }, 'Notes saved.')}>Save notes</Button></div>
            </div>
          </div>
        )}

        {tab === 'documents' && (
          <div className="space-y-3">
            {docs === null ? <ListSkeleton /> : docs.map((d) => {
              const dm = DOC_STATUS_META[d.status];
              return (
                <div key={d.id} className="rounded-[var(--adm-radius-control)] p-3" style={{ border: '1px solid var(--adm-border)', background: 'var(--adm-card)' }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>{d.label}{!d.required && <span className="ml-2 text-[11px] font-normal" style={{ color: 'var(--adm-muted)' }}>optional</span>}</p>
                      {d.file_name && <p className="truncate text-xs" style={{ color: 'var(--adm-muted)' }}>{d.file_name}{d.size_bytes ? ` · ${fileSize(d.size_bytes)}` : ''}{d.uploaded_at ? ` · ${when(d.uploaded_at)}` : ''}</p>}
                    </div>
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: soft(dm.color), color: 'var(--adm-text)' }}>{dm.label}</span>
                  </div>
                  {d.status === 'rejected' && d.staff_note && <p className="mt-2 text-xs" style={{ color: 'var(--adm-error)' }}><FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5 h-3 w-3" />{d.staff_note}</p>}

                  {rejecting?.id === d.id ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <input autoFocus aria-label="What needs to change" value={rejecting.note} onChange={(e) => setRejecting({ id: d.id, note: e.target.value })} placeholder="What needs to change?" className="min-w-[14rem] flex-1 px-3 py-2 text-sm" style={fieldStyle} />
                      <Button onClick={() => review(d, 'rejected', rejecting.note.trim())} disabled={!rejecting.note.trim()}>Send back</Button>
                      <Button variant="secondary" onClick={() => setRejecting(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {d.file_path && <Button variant="secondary" onClick={() => view(d)}><FontAwesomeIcon icon={faEye} className="mr-2 h-3 w-3" />View</Button>}
                      {d.status === 'uploaded' && (
                        <>
                          <Button onClick={() => review(d, 'approved')}><FontAwesomeIcon icon={faCheck} className="mr-2 h-3 w-3" />Approve</Button>
                          <Button variant="secondary" onClick={() => setRejecting({ id: d.id, note: '' })}>Needs changes</Button>
                        </>
                      )}
                      <label className="inline-flex cursor-pointer items-center rounded-[var(--adm-radius-control)] px-3 py-2 text-xs font-semibold" style={{ border: '1px solid var(--adm-border)', color: 'var(--adm-text-2)' }}>
                        <FontAwesomeIcon icon={faUpload} className="mr-2 h-3 w-3" />{d.file_path ? 'Replace file' : 'Add file for student'}
                        <input type="file" className="sr-only" disabled={busy} accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFor(d, f); e.target.value = ''; }} />
                      </label>
                      <button type="button" aria-label={`Remove ${d.label}`} title="Remove from checklist" onClick={() => removeDoc(d)} className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}><FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="rounded-[var(--adm-radius-control)] p-3" style={{ border: '1px dashed var(--adm-border)' }}>
              <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Ask for another document</p>
              <div className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
                <input aria-label="Document name" value={newDoc.label} onChange={(e) => setNewDoc({ ...newDoc, label: e.target.value })} placeholder="e.g. Police clearance" className="px-3 py-2 text-sm" style={fieldStyle} />
                <input aria-label="Instructions" value={newDoc.description} onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })} placeholder="What the student should provide" className="px-3 py-2 text-sm" style={fieldStyle} />
                <Button onClick={addDoc}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Request</Button>
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={newDoc.required} onChange={(e) => setNewDoc({ ...newDoc, required: e.target.checked })} style={{ accentColor: 'var(--adm-primary)' }} />Required</label>
            </div>
          </div>
        )}

        {tab === 'timeline' && (
          <div>
            <div className="mb-5 rounded-[var(--adm-radius-control)] p-3" style={{ border: '1px solid var(--adm-border)' }}>
              <label htmlFor="sa-update" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Post an update</label>
              <textarea id="sa-update" rows={2} maxLength={500} value={update} onChange={(e) => setUpdate(e.target.value)} placeholder="For example: The university confirmed they received your application." className="w-full px-3 py-2 text-sm" style={fieldStyle} />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Visible to the student (they get a notification)</label>
                <Button onClick={addUpdate} disabled={!update.trim()}>{visible ? 'Post update' : 'Save internal note'}</Button>
              </div>
            </div>
            {events === null ? <ListSkeleton /> : (
              <ol className="relative space-y-4 border-l pl-5" style={{ borderColor: 'var(--adm-border)' }}>
                {events.map((e) => (
                  <li key={e.id} className="relative">
                    <span aria-hidden className="absolute -left-[26px] top-1 h-3 w-3 rounded-full" style={{ background: e.kind === 'stage' ? 'var(--adm-primary)' : e.is_public ? 'var(--adm-muted)' : 'var(--adm-warning, var(--brand-warning))' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>{e.title}{!e.is_public && <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: soft('var(--brand-warning)', 22), color: 'var(--adm-text)' }}>Internal</span>}</p>
                    {e.body && <p className="mt-0.5 text-xs" style={{ color: 'var(--adm-text-2)' }}>{e.body}</p>}
                    <p className="mt-0.5 text-[11px]" style={{ color: 'var(--adm-muted)' }}>{when(e.created_at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </Modal>

      {viewing && (
        <Modal title={viewing.name} maxWidth="max-w-4xl" onClose={() => setViewing(null)}>
          {viewing.mime.startsWith('image/') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={viewing.url} alt={viewing.name} className="mx-auto max-h-[70vh] w-auto max-w-full object-contain" />
          ) : viewing.mime === 'application/pdf' ? (
            <iframe src={viewing.url} title={viewing.name} className="h-[70vh] w-full" />
          ) : (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--adm-text-2)' }}>This file type cannot be previewed. <a href={viewing.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline" style={{ color: 'var(--adm-primary)' }}>Download it</a>.</p>
          )}
        </Modal>
      )}
    </>
  );
}
