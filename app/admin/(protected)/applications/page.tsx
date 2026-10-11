'use client';

// Study abroad applications, handled by TechTour on the student's behalf. A board
// of stages (enquiry to ready to enrol); open a card to review documents, post
// updates and move it along. Students follow the same stages in their dashboard.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardCheck, faFileCircleCheck, faGraduationCap, faPassport, faPlus } from '@fortawesome/free-solid-svg-icons';

import AdminLayout from '@/components/AdminLayout';
import ApplicationDrawer, { staffName, type AdminApplication, type StaffUser } from '@/components/admin/study/ApplicationDrawer';
import { notify } from '@/components/admin/toast';
import { Button, EmptyBlock, ListSkeleton, Modal, SearchInput, StatTile, Toolbar, confirmAction, fieldStyle, reportError } from '@/components/admin/ui';
import { createBrowserClient } from '@/lib/supabase/client';
import { STUDY_ENDED, STUDY_META, STUDY_STAGES, asStudyStatus, isEnded, type StudyStatus } from '@/lib/study/meta';
import { announceAdminCounts } from '@/lib/useAdminCounts';

const SELECT = 'id, user_id, reference, status, program_name, university, location, intake, created_at, last_activity_at, assigned_to, next_step, admin_notes, full_name, email, phone, nationality, education_level, intended_level, message, study_application_documents(id, status, required)';
const soft = (color: string, pct = 14) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

const ago = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d < 1 ? 'Today' : d === 1 ? 'Yesterday' : d < 30 ? `${d} days ago` : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

interface ProgramOption { id: string; title: string; institution_id: string; study_institutions: { name: string; destination_id: string | null } | null }

export default function AdminApplicationsPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [mine, setMine] = useState(false);
  const [showEnded, setShowEnded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<StudyStatus | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      supabase.from('study_applications').select(SELECT).order('last_activity_at', { ascending: false }),
      supabase.from('profiles').select('id, email, first_name, last_name').eq('is_admin', true).eq('is_active', true),
      supabase.auth.getUser(),
    ]);
    if (a.error) setError('Could not load applications. Please refresh.'); else setError('');
    setApps((a.data as unknown as AdminApplication[] | null) ?? []);
    setStaff((b.data as StaffUser[] | null) ?? []);
    setMe(c.data.user?.id ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const q = search.trim().toLowerCase();
  const visible = apps.filter((a) => (!mine || a.assigned_to === me) && (!q || [a.full_name, a.email, a.reference, a.program_name, a.university, a.location].some((t) => t.toLowerCase().includes(q))));
  const columns: StudyStatus[] = showEnded ? [...STUDY_STAGES, ...STUDY_ENDED] : [...STUDY_STAGES];
  const open = apps.find((a) => a.id === openId) ?? null;

  const docsToReview = apps.reduce((n, a) => n + a.study_application_documents.filter((d) => d.status === 'uploaded').length, 0);
  const active = apps.filter((a) => !isEnded(a.status) && a.status !== 'enrolled').length;
  const offers = apps.filter((a) => a.status === 'offer' || a.status === 'accepted').length;
  const ready = apps.filter((a) => a.status === 'enrolled').length;

  async function move(a: AdminApplication, next: StudyStatus) {
    if (asStudyStatus(a.status) === next) return;
    if (next === 'rejected' && !(await confirmAction({ message: `Mark ${a.full_name || 'this application'} as not successful? The student is notified.`, confirmLabel: 'Mark not successful', danger: true }))) { await load(); return; }
    const { error: err } = await supabase.from('study_applications').update({ status: next }).eq('id', a.id);
    if (reportError(err)) return;
    notify('Stage updated. The student was notified.', 'success');
    announceAdminCounts();
    load();
  }

  return (
    <AdminLayout title="Study Applications" subtitle="Applications TechTour handles for students, from enquiry to enrolment">
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={faGraduationCap} label="In progress" value={active} tone="info" />
        <StatTile icon={faFileCircleCheck} label="Documents to review" value={docsToReview} tone="warning" />
        <StatTile icon={faClipboardCheck} label="Offers" value={offers} tone="success" />
        <StatTile icon={faPassport} label="Ready to enrol" value={ready} tone="neutral" />
      </div>

      <Toolbar actions={<Button onClick={() => setAdding(true)}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Record application</Button>}>
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-sm" value={search} onChange={setSearch} placeholder="Search name, reference, university" label="Search applications" />
        <label className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Assigned to me</label>
        <label className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={showEnded} onChange={(e) => setShowEnded(e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Show closed</label>
      </Toolbar>

      {error && <p role="alert" className="mb-4 rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>}

      {loading ? <ListSkeleton /> : (
        <div className="flex w-full max-w-full snap-x snap-mandatory items-start gap-3 overflow-x-auto pb-3" role="group" aria-label="Applications board">
          {columns.map((col) => {
            const meta = STUDY_META[col];
            const list = visible.filter((a) => asStudyStatus(a.status) === col);
            const over = overCol === col && dragId !== null;
            return (
              <section
                key={col}
                aria-label={`${meta.label}, ${list.length} applications`}
                onDragOver={(e) => { if (dragId) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverCol(col); } }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverCol((c) => (c === col ? null : c)); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const a = apps.find((x) => x.id === (dragId ?? e.dataTransfer.getData('text/plain')));
                  setDragId(null); setOverCol(null);
                  if (a) move(a, col);
                }}
                className="flex w-full min-w-full flex-shrink-0 snap-start flex-col rounded-[var(--adm-radius-card)] sm:w-72 sm:min-w-0 lg:w-72"
                style={{ background: over ? soft(meta.color, 12) : 'var(--adm-track)', border: `2px ${over ? 'dashed' : 'solid'} ${over ? meta.color : 'transparent'}` }}
              >
                <header className="flex items-center gap-2 px-3 py-2.5">
                  <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
                  <h2 className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>{meta.short}</h2>
                  <span className="rounded-full px-2 text-xs font-bold" style={{ background: 'var(--adm-card)', color: 'var(--adm-text-2)' }}>{list.length}</span>
                </header>
                <div className="max-h-[65vh] min-h-[7rem] space-y-2 overflow-y-auto px-2 pb-2">
                  {list.length === 0 ? <EmptyBlock title="None" body={over ? 'Drop here' : undefined} /> : list.map((a) => {
                    const docs = a.study_application_documents;
                    const uploaded = docs.filter((d) => d.status === 'uploaded' || d.status === 'approved').length;
                    const review = docs.filter((d) => d.status === 'uploaded').length;
                    const owner = staff.find((s) => s.id === a.assigned_to);
                    return (
                      <article
                        key={a.id}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData('text/plain', a.id); e.dataTransfer.effectAllowed = 'move'; setDragId(a.id); }}
                        onDragEnd={() => { setDragId(null); setOverCol(null); }}
                        className="cursor-grab rounded-[var(--adm-radius-control)] p-3 active:cursor-grabbing"
                        style={{ background: 'var(--adm-card)', border: '1px solid var(--adm-border)', borderLeft: `4px solid ${meta.color}`, boxShadow: 'var(--adm-shadow)', opacity: dragId === a.id ? 0.5 : 1 }}
                      >
                        <button type="button" onClick={() => setOpenId(a.id)} className="block min-h-[44px] w-full rounded text-left" aria-label={`Open ${a.full_name}, ${a.reference}`}>
                          <span className="flex items-center justify-between gap-2 text-[11px] font-semibold" style={{ color: 'var(--adm-muted)' }}><span>{a.reference}</span><span>{ago(a.last_activity_at)}</span></span>
                          <span className="mt-1 block truncate text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>{a.full_name || a.email}</span>
                          <span className="mt-0.5 line-clamp-2 block text-xs" style={{ color: 'var(--adm-text-2)' }}>{a.program_name}{a.university ? `, ${a.university}` : ''}</span>
                          {a.location && <span className="mt-0.5 block text-[11px]" style={{ color: 'var(--adm-muted)' }}>{a.location}{a.intake ? ` · ${a.intake}` : ''}</span>}
                        </button>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                          {docs.length > 0 && <span className="rounded-full px-2 py-0.5 font-semibold" style={{ background: soft(meta.color, 12), color: 'var(--adm-text)' }}>{uploaded}/{docs.length} documents</span>}
                          {review > 0 && <span className="rounded-full px-2 py-0.5 font-bold" style={{ background: 'var(--brand-gold)', color: 'var(--brand-ink)' }}>{review} to review</span>}
                          <span className="ml-auto" style={{ color: 'var(--adm-muted)' }}>{owner ? staffName(owner) : 'Unassigned'}</span>
                        </div>
                        <select aria-label={`Move ${a.full_name} to another stage`} value={asStudyStatus(a.status)} onChange={(e) => move(a, e.target.value as StudyStatus)} className="mt-2 w-full px-2 py-1.5 text-xs" style={fieldStyle}>
                          {[...STUDY_STAGES, ...STUDY_ENDED].map((s) => <option key={s} value={s}>{STUDY_META[s].label}</option>)}
                        </select>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {open && <ApplicationDrawer key={open.id} app={open} staff={staff} onClose={() => setOpenId(null)} onChanged={load} />}
      {adding && <RecordApplication onClose={() => setAdding(false)} onSaved={async (id) => { setAdding(false); await load(); setOpenId(id); }} />}
    </AdminLayout>
  );
}

/** Applications taken by phone or in person: pick the customer and the programme. */
function RecordApplication({ onClose, onSaved }: { onClose: () => void; onSaved: (id: string) => void }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [customers, setCustomers] = useState<{ id: string; email: string; first_name: string | null; last_name: string | null; phone_number?: string | null }[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [form, setForm] = useState({ user_id: '', program_id: '', intake: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('profiles').select('id, email, first_name, last_name').eq('is_admin', false).eq('is_active', true).order('email').then(({ data }) => setCustomers((data as typeof customers | null) ?? []));
    supabase.from('study_programs').select('id, title, institution_id, study_institutions(name, destination_id)').eq('is_active', true).order('title').then(({ data }) => setPrograms((data as unknown as ProgramOption[] | null) ?? []));
  }, [supabase]);

  async function save() {
    const customer = customers.find((c) => c.id === form.user_id);
    const program = programs.find((p) => p.id === form.program_id);
    if (!customer) return notify('Choose the customer.');
    if (!program) return notify('Choose the programme.');
    if (form.phone.trim().length < 6) return notify('Add a phone number.');
    setSaving(true);
    const { data: dest } = await supabase.from('study_destinations').select('id, country_name').eq('id', program.study_institutions?.destination_id ?? '').maybeSingle();
    const { data, error } = await supabase.from('study_applications').insert({
      user_id: customer.id, destination_id: dest?.id ?? null, institution_id: program.institution_id, program_id: program.id,
      program_name: program.title, university: program.study_institutions?.name ?? '', location: dest?.country_name ?? '', intake: form.intake.trim(),
      full_name: [customer.first_name, customer.last_name].filter(Boolean).join(' ') || customer.email, email: customer.email, phone: form.phone.trim(),
    }).select('id').single();
    setSaving(false);
    if (reportError(error) || !data) return;
    notify('Application recorded.', 'success');
    onSaved(data.id);
  }

  return (
    <Modal title="Record an application" subtitle="For a student who applied by phone or in person" maxWidth="max-w-lg" onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Record application'}</Button></>}>
      <div className="space-y-4">
        <div>
          <label htmlFor="ra-user" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Customer</label>
          <select id="ra-user" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className="w-full px-3 py-2 text-sm" style={fieldStyle}>
            <option value="">Choose a customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{[c.first_name, c.last_name].filter(Boolean).join(' ') ? `${[c.first_name, c.last_name].filter(Boolean).join(' ')} (${c.email})` : c.email}</option>)}
          </select>
          <p className="mt-1 text-[11px]" style={{ color: 'var(--adm-muted)' }}>They need an account so they can follow progress. Ask them to register first if they do not have one.</p>
        </div>
        <div>
          <label htmlFor="ra-prog" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Programme</label>
          <select id="ra-prog" value={form.program_id} onChange={(e) => setForm({ ...form, program_id: e.target.value })} className="w-full px-3 py-2 text-sm" style={fieldStyle}>
            <option value="">Choose a programme</option>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.study_institutions?.name ?? ''})</option>)}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="ra-intake" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Intake</label><input id="ra-intake" value={form.intake} onChange={(e) => setForm({ ...form, intake: e.target.value })} placeholder="e.g. September 2027" className="w-full px-3 py-2 text-sm" style={fieldStyle} /></div>
          <div><label htmlFor="ra-phone" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Phone</label><input id="ra-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" className="w-full px-3 py-2 text-sm" style={fieldStyle} /></div>
        </div>
      </div>
    </Modal>
  );
}
