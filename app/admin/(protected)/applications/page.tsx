'use client';

// Study abroad applications. Customers apply on /services/study-abroad/<country>
// (database function submit_study_application, migration 0031) and see their
// status under Study in their account. Staff review, change the status, keep
// private notes, or record an application taken by phone or in person.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardCheck, faClock, faDownload, faEye, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

import AdminLayout from '@/components/AdminLayout';
import { notify } from '@/components/admin/toast';
import {
  Button, IconButton, Modal, SearchInput, StatTile, StatusPill, TableCard, Toolbar,
  confirmAction, downloadCsv, fieldStyle, fmtDate, reportError, rowClass, type Tone,
} from '@/components/admin/ui';
import { createBrowserClient } from '@/lib/supabase/client';

const STATUSES = ['pending', 'reviewing', 'approved', 'rejected', 'completed'] as const;
type Status = (typeof STATUSES)[number];
const TONE: Record<Status, Tone> = { pending: 'warning', reviewing: 'info', approved: 'success', rejected: 'danger', completed: 'neutral' };

interface Application {
  id: string;
  user_id: string;
  program_name: string;
  location: string;
  start_date: string | null;
  status: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  nationality: string;
  education_level: string;
  intended_level: string;
  field_of_study: string;
  message: string;
  admin_notes: string;
  study_destinations: { country_name: string } | null;
  scholarships: { title: string } | null;
  profiles: { email: string } | null;
}

const SELECT = 'id, user_id, program_name, location, start_date, status, created_at, full_name, email, phone, nationality, education_level, intended_level, field_of_study, message, admin_notes, study_destinations(country_name), scholarships(title), profiles(email)';
const EMPTY = { user_id: '', destination_id: '', program_name: '', start_date: '', phone: '' };

const asStatus = (s: string): Status => ((STATUSES as readonly string[]).includes(s) ? (s as Status) : 'pending');

export default function AdminApplicationsPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [apps, setApps] = useState<Application[]>([]);
  const [customers, setCustomers] = useState<{ id: string; email: string }[]>([]);
  const [destinations, setDestinations] = useState<{ id: string; country_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [open, setOpen] = useState<Application | null>(null);
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [a, c, d] = await Promise.all([
      supabase.from('study_applications').select(SELECT).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, email').eq('is_admin', false).order('email'),
      supabase.from('study_destinations').select('id, country_name').order('country_name'),
    ]);
    if (a.error) setError('Could not load applications.'); else setError('');
    setApps((a.data as unknown as Application[]) ?? []);
    setCustomers(c.data ?? []);
    setDestinations(d.data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function setStatus(app: Application, status: Status) {
    if (reportError((await supabase.from('study_applications').update({ status }).eq('id', app.id)).error)) return;
    setApps((prev) => prev.map((x) => (x.id === app.id ? { ...x, status } : x)));
    setOpen((o) => (o && o.id === app.id ? { ...o, status } : o));
    notify('Status updated.', 'success');
  }

  async function saveNotes() {
    if (!open) return;
    if (reportError((await supabase.from('study_applications').update({ admin_notes: notes.trim() }).eq('id', open.id)).error)) return;
    setApps((prev) => prev.map((x) => (x.id === open.id ? { ...x, admin_notes: notes.trim() } : x)));
    notify('Notes saved.', 'success');
    setOpen(null);
  }

  async function remove(app: Application) {
    if (!(await confirmAction({ message: `Delete the application from ${app.full_name || app.email || app.profiles?.email || 'this applicant'}? You can restore it from Trash.`, danger: true, confirmLabel: 'Delete' }))) return;
    if (reportError((await supabase.from('study_applications').delete().eq('id', app.id)).error)) return;
    setApps((prev) => prev.filter((x) => x.id !== app.id));
    setOpen(null);
    notify('Moved to Trash.', 'success');
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const customer = customers.find((c) => c.id === form.user_id);
    const dest = destinations.find((d) => d.id === form.destination_id);
    if (!customer) return notify('Choose the customer this application belongs to.');
    if (!form.program_name.trim() && !dest) return notify('Enter a programme or choose a destination.');
    setSaving(true);
    const { error: err } = await supabase.from('study_applications').insert({
      user_id: customer.id,
      destination_id: dest?.id ?? null,
      program_name: form.program_name.trim() || `Study in ${dest?.country_name}`,
      location: dest?.country_name ?? '',
      start_date: form.start_date || null,
      email: customer.email,
      phone: form.phone.trim(),
    });
    setSaving(false);
    if (reportError(err)) return;
    setAdding(false);
    setForm(EMPTY);
    load();
  }

  const q = search.trim().toLowerCase();
  const visible = apps.filter((a) => {
    if (filter !== 'all' && asStatus(a.status) !== filter) return false;
    if (!q) return true;
    return [a.full_name, a.email, a.profiles?.email, a.phone, a.program_name, a.location, a.study_destinations?.country_name].some((v) => (v ?? '').toLowerCase().includes(q));
  });
  const count = (s: Status) => apps.filter((a) => asStatus(a.status) === s).length;
  const who = (a: Application) => a.full_name || a.profiles?.email || a.email || '-';

  return (
    <AdminLayout title="Study Applications" subtitle="Review applications from the study abroad pages">
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={faClock} label="Pending" value={count('pending')} tone="warning" />
        <StatTile icon={faEye} label="Reviewing" value={count('reviewing')} tone="info" />
        <StatTile icon={faClipboardCheck} label="Approved" value={count('approved')} tone="success" />
        <StatTile icon={faClipboardCheck} label="All applications" value={apps.length} tone="neutral" />
      </div>

      <Toolbar
        actions={
          <>
            <Button variant="secondary" disabled={visible.length === 0} onClick={() => downloadCsv('study-applications.csv', ['Name', 'Email', 'Phone', 'Nationality', 'Destination', 'Programme', 'Level', 'Start', 'Status', 'Applied'], visible.map((a) => [a.full_name, a.email || a.profiles?.email, a.phone, a.nationality, a.study_destinations?.country_name ?? a.location, a.field_of_study || a.program_name, a.intended_level, a.start_date, a.status, a.created_at]))}>
              <FontAwesomeIcon icon={faDownload} className="mr-2 h-3 w-3" />Export CSV
            </Button>
            <Button onClick={() => setAdding(true)}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add application</Button>
          </>
        }
      >
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-sm" value={search} onChange={setSearch} placeholder="Search name, email, country" label="Search applications" />
        <select aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="px-3 py-2 text-sm capitalize" style={fieldStyle}>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>

      {error ? (
        <p role="alert" className="rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>
      ) : (
        <TableCard loading={loading} empty={visible.length === 0} emptyTitle={apps.length === 0 ? 'No applications yet' : 'Nothing matches'} emptyBody={apps.length === 0 ? 'Applications from the study abroad pages appear here.' : 'Try another search or status.'} headers={['Applicant', 'Destination', 'Starts', 'Status', 'Applied', '']}>
          {visible.map((a) => (
            <tr key={a.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="px-4 py-3">
                <div className="font-medium" style={{ color: 'var(--adm-text)' }}>{who(a)}</div>
                <div className="text-xs" style={{ color: 'var(--adm-muted)' }}>{[a.email || a.profiles?.email, a.phone].filter(Boolean).join(' · ')}</div>
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>
                {a.study_destinations?.country_name ?? (a.location || '-')}
                {(a.field_of_study || a.program_name) && <div style={{ color: 'var(--adm-muted)' }}>{a.field_of_study || a.program_name}</div>}
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-muted)' }}>{a.start_date ? fmtDate(a.start_date) : '-'}</td>
              <td className="px-4 py-3">
                <select aria-label={`Status for ${who(a)}`} value={asStatus(a.status)} onChange={(e) => setStatus(a, e.target.value as Status)} className="px-2 py-1 text-xs capitalize" style={fieldStyle}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-muted)' }}>{fmtDate(a.created_at)}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="View details" onClick={() => { setOpen(a); setNotes(a.admin_notes); }}><FontAwesomeIcon icon={faEye} className="h-3 w-3" /></IconButton>
                  <IconButton title="Delete" color="var(--adm-error)" onClick={() => remove(a)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      )}

      {open && (
        <Modal title={who(open)} subtitle={`Applied ${fmtDate(open.created_at)}`} maxWidth="max-w-xl" onClose={() => setOpen(null)}
          footer={<><Button variant="secondary" onClick={() => setOpen(null)}>Close</Button><Button onClick={saveNotes}>Save notes</Button></>}>
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <StatusPill tone={TONE[asStatus(open.status)]}><span className="capitalize">{asStatus(open.status)}</span></StatusPill>
              <select aria-label="Change status" value={asStatus(open.status)} onChange={(e) => setStatus(open, e.target.value as Status)} className="px-2 py-1 text-xs capitalize" style={fieldStyle}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              {([
                ['Email', open.email || open.profiles?.email], ['Phone', open.phone], ['Nationality', open.nationality],
                ['Destination', open.study_destinations?.country_name ?? open.location], ['Studying', open.intended_level], ['Field', open.field_of_study || open.program_name],
                ['Education so far', open.education_level], ['Preferred start', open.start_date ? fmtDate(open.start_date) : ''], ['Scholarship', open.scholarships?.title],
              ] as [string, string | null | undefined][]).map(([k, v]) => (
                <div key={k}><dt className="text-xs" style={{ color: 'var(--adm-muted)' }}>{k}</dt><dd style={{ color: 'var(--adm-text)' }}>{v || '-'}</dd></div>
              ))}
            </dl>
            {open.message && (
              <div><div className="text-xs" style={{ color: 'var(--adm-muted)' }}>Message from the applicant</div><p className="mt-1 whitespace-pre-wrap" style={{ color: 'var(--adm-text)' }}>{open.message}</p></div>
            )}
            <div>
              <label htmlFor="app-notes" className="text-xs" style={{ color: 'var(--adm-muted)' }}>Private notes (staff only)</label>
              <textarea id="app-notes" rows={4} className="mt-1 w-full px-3 py-2 text-sm" style={fieldStyle} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </Modal>
      )}

      {adding && (
        <Modal title="Add an application" subtitle="For applications taken by phone or in person" maxWidth="max-w-md" onClose={() => setAdding(false)}
          footer={<><Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button><Button disabled={saving} onClick={(e) => add(e as unknown as React.FormEvent)}>{saving ? 'Saving...' : 'Add'}</Button></>}>
          <form onSubmit={add} className="space-y-3">
            <select required aria-label="Customer" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className="w-full px-3 py-2 text-sm" style={fieldStyle}>
              <option value="">Choose a customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.email}</option>)}
            </select>
            <select aria-label="Destination" value={form.destination_id} onChange={(e) => setForm({ ...form, destination_id: e.target.value })} className="w-full px-3 py-2 text-sm" style={fieldStyle}>
              <option value="">Destination (optional)</option>
              {destinations.map((d) => <option key={d.id} value={d.id}>{d.country_name}</option>)}
            </select>
            <input aria-label="Programme" value={form.program_name} onChange={(e) => setForm({ ...form, program_name: e.target.value })} placeholder="Programme or field of study" className="w-full px-3 py-2 text-sm" style={fieldStyle} />
            <input aria-label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="w-full px-3 py-2 text-sm" style={fieldStyle} />
            <input aria-label="Start date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2 text-sm" style={fieldStyle} />
            <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
