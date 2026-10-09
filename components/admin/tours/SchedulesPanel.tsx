'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faPencil, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

import { notify } from '@/components/admin/toast';
import { Button, IconButton, Modal, StatusPill, TableCard, Toolbar, confirmAction, fieldStyle, fmtDate, reportError, rowClass } from '@/components/admin/ui';
import { createBrowserClient } from '@/lib/supabase/client';
import { Field, inputCls, type Schedule, type Tour } from './shared';

interface Form { tour_id: string; start_date: string; end_date: string; available_spots: string; notes: string; is_cancelled: boolean }
const EMPTY: Form = { tour_id: '', start_date: '', end_date: '', available_spots: '10', notes: '', is_cancelled: false };
const today = () => new Date().toISOString().slice(0, 10);

export default function SchedulesPanel({ schedules, tours, loading, reload }: { schedules: Schedule[]; tours: Tour[]; loading: boolean; reload: () => Promise<void> }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [tourFilter, setTourFilter] = useState('all');
  const [when, setWhen] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [editing, setEditing] = useState<'new' | Schedule | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  const title = (id: string) => tours.find((t) => t.id === id)?.title ?? '-';
  const shown = schedules
    .filter((s) => (tourFilter === 'all' || s.tour_id === tourFilter) && (when === 'all' || (when === 'upcoming' ? s.end_date >= today() : s.end_date < today())))
    .sort((a, b) => (when === 'past' ? b.start_date.localeCompare(a.start_date) : a.start_date.localeCompare(b.start_date)));

  function open(s: 'new' | Schedule) {
    setEditing(s);
    setForm(s === 'new' ? { ...EMPTY, tour_id: tourFilter !== 'all' ? tourFilter : '' } : { tour_id: s.tour_id, start_date: s.start_date, end_date: s.end_date, available_spots: String(s.available_spots), notes: s.notes, is_cancelled: s.is_cancelled });
  }

  async function save() {
    const spots = Number(form.available_spots);
    const booked = editing && editing !== 'new' ? editing.booked_spots : 0;
    if (!form.tour_id) return notify('Choose a tour.');
    if (!form.start_date || !form.end_date) return notify('Set the start and end dates.');
    if (form.end_date < form.start_date) return notify('The end date cannot be before the start date.');
    if (!Number.isInteger(spots) || spots < 1) return notify('Spots must be at least 1.');
    if (spots < booked) return notify(`${booked} spots are already booked, so there must be at least ${booked}.`);
    const row = { tour_id: form.tour_id, start_date: form.start_date, end_date: form.end_date, available_spots: spots, notes: form.notes.trim(), is_cancelled: form.is_cancelled };
    setSaving(true);
    const { error } = editing === 'new' || editing === null
      ? await supabase.from('tour_schedules').insert(row)
      : await supabase.from('tour_schedules').update(row).eq('id', editing.id);
    setSaving(false);
    if (reportError(error)) return;
    notify('Departure saved.', 'success');
    setEditing(null);
    await reload();
  }

  async function cancel(s: Schedule) {
    const undo = s.is_cancelled;
    if (!undo && !(await confirmAction({ title: 'Cancel this departure?', message: `The ${fmtDate(s.start_date)} departure of ${title(s.tour_id)} will stop taking bookings. Existing bookings are not changed.`, danger: true, confirmLabel: 'Cancel departure' }))) return;
    if (reportError((await supabase.from('tour_schedules').update({ is_cancelled: !undo }).eq('id', s.id)).error)) return;
    await reload();
  }

  async function remove(s: Schedule) {
    if (!(await confirmAction({ message: `Delete the ${fmtDate(s.start_date)} departure of ${title(s.tour_id)}? You can restore it from Trash.`, danger: true, confirmLabel: 'Delete' }))) return;
    if (reportError((await supabase.from('tour_schedules').delete().eq('id', s.id)).error)) return;
    await reload();
  }

  return (
    <>
      <Toolbar actions={<Button onClick={() => open('new')}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add departure</Button>}>
        <select aria-label="Tour" value={tourFilter} onChange={(e) => setTourFilter(e.target.value)} className="min-w-[12rem] px-3 py-2 text-sm" style={fieldStyle}>
          <option value="all">All tours</option>
          {tours.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <select aria-label="When" value={when} onChange={(e) => setWhen(e.target.value as typeof when)} className="px-3 py-2 text-sm" style={fieldStyle}>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
          <option value="all">All dates</option>
        </select>
      </Toolbar>

      <TableCard loading={loading} empty={shown.length === 0} emptyTitle="No departures" emptyBody="Add dates for a tour so customers can book it." headers={['Tour', 'Dates', 'Spots', 'Status', '']}>
        {shown.map((s) => {
          const remaining = s.available_spots - s.booked_spots;
          return (
            <tr key={s.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--adm-text)' }}>{title(s.tour_id)}</td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{fmtDate(s.start_date)}{s.end_date !== s.start_date && ` to ${fmtDate(s.end_date)}`}</td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{s.booked_spots} of {s.available_spots} booked</td>
              <td className="px-4 py-3">
                {s.is_cancelled ? <StatusPill tone="danger">Cancelled</StatusPill> : remaining <= 0 ? <StatusPill tone="warning">Full</StatusPill> : <StatusPill tone="success">{remaining} left</StatusPill>}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="Edit" onClick={() => open(s)}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                  <IconButton title={s.is_cancelled ? 'Reopen departure' : 'Cancel departure'} onClick={() => cancel(s)}><FontAwesomeIcon icon={faBan} className="h-3 w-3" /></IconButton>
                  <IconButton title="Delete" color="var(--adm-error)" onClick={() => remove(s)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                </div>
              </td>
            </tr>
          );
        })}
      </TableCard>

      {editing && (
        <Modal title={editing === 'new' ? 'Add departure' : 'Edit departure'} maxWidth="max-w-md" onClose={() => setEditing(null)}
          footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></>}>
          <div className="space-y-4">
            <Field label="Tour">
              <select className={inputCls} style={fieldStyle} value={form.tour_id} onChange={(e) => setForm((f) => ({ ...f, tour_id: e.target.value }))}>
                <option value="">Choose a tour</option>
                {tours.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Starts"><input type="date" className={inputCls} style={fieldStyle} value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value, end_date: f.end_date && f.end_date >= e.target.value ? f.end_date : e.target.value }))} /></Field>
              <Field label="Ends"><input type="date" min={form.start_date} className={inputCls} style={fieldStyle} value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} /></Field>
            </div>
            <Field label="Spots available" hint={editing !== 'new' ? `${editing.booked_spots} already booked.` : undefined}><input type="number" min={1} className={inputCls} style={fieldStyle} value={form.available_spots} onChange={(e) => setForm((f) => ({ ...f, available_spots: e.target.value }))} /></Field>
            <Field label="Notes (internal)"><textarea rows={2} className={inputCls} style={fieldStyle} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></Field>
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={form.is_cancelled} onChange={(e) => setForm((f) => ({ ...f, is_cancelled: e.target.checked }))} style={{ accentColor: 'var(--adm-primary)' }} />Cancelled</label>
          </div>
        </Modal>
      )}
    </>
  );
}
