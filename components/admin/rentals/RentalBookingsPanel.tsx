'use client';

// Stay requests made on Dream Vacations. Staff confirm or cancel them here and record
// when payment arrives. Changing the status notifies the customer (migration 0042).
// There is no insert policy for bookings: they are created by create_rental_booking().

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo, faDownload } from '@fortawesome/free-solid-svg-icons';

import { notify } from '@/components/admin/toast';
import { Button, IconButton, Modal, SearchInput, StatusPill, StatusSelect, TableCard, Tabs, Toolbar, downloadCsv, fmtDate, reportError, rowClass, type Tone } from '@/components/admin/ui';
import { cap, money } from '@/components/admin/tours/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Row = Database['public']['Tables']['vacation_bookings']['Row'] & { vacation_rentals: { title: string } | null };
type Status = Database['public']['Enums']['vacation_booking_status'];
type Pay = Database['public']['Enums']['payment_status'];

const STATUSES: readonly Status[] = ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'];
const STATUS_TONE: Record<Status, Tone> = { pending: 'warning', confirmed: 'info', completed: 'success', cancelled: 'danger', refunded: 'neutral' };
const PAY_TONE: Record<Pay, Tone> = { success: 'success', pending: 'warning', failed: 'danger', abandoned: 'neutral' };

export default function RentalBookingsPanel({ onCount }: { onCount?: (pending: number) => void }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<Row | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('vacation_bookings').select('*, vacation_rentals(title)').order('created_at', { ascending: false });
    if (error) notify('Could not load stay requests. Please refresh.');
    const list = (data as Row[] | null) ?? [];
    setRows(list);
    onCount?.(list.filter((r) => r.status === 'pending').length);
    setLoading(false);
  }, [supabase, onCount]);

  useEffect(() => { load(); }, [load]);

  const q = search.trim().toLowerCase();
  const shown = rows.filter((r) => (filter === 'all' || r.status === filter) && (!q || [r.booking_number, r.guest_email, r.guest_name, r.vacation_rentals?.title ?? ''].some((t) => t.toLowerCase().includes(q))));

  async function patch(r: Row, change: { status?: Status; payment_status?: Pay }) {
    if (reportError((await supabase.from('vacation_bookings').update(change).eq('id', r.id)).error)) return;
    notify(change.status ? 'Status updated. The guest was notified.' : 'Payment updated.', 'success');
    setOpen((o) => (o?.id === r.id ? { ...o, ...change } : o));
    await load();
  }

  return (
    <>
      <Toolbar
        actions={
          <Button variant="secondary" disabled={shown.length === 0} onClick={() => downloadCsv('stay-requests.csv',
            ['Number', 'Rental', 'Check-in', 'Check-out', 'Nights', 'Guests', 'Guest', 'Email', 'Phone', 'Total', 'Currency', 'Payment', 'Status', 'Requests', 'Requested'],
            shown.map((r) => [r.booking_number, r.vacation_rentals?.title, r.check_in, r.check_out, r.total_nights, r.guests, r.guest_name, r.guest_email, r.guest_phone, r.total_price, r.currency, r.payment_status, r.status, r.special_requests, r.created_at]))}>
            <FontAwesomeIcon icon={faDownload} className="mr-2 h-3 w-3" />Export CSV
          </Button>
        }
      >
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-sm" value={search} onChange={setSearch} placeholder="Search number, guest or rental" label="Search stay requests" />
      </Toolbar>
      <div className="mb-4">
        <Tabs value={filter} onChange={setFilter} tabs={[{ key: 'all' as const, label: 'All', count: rows.length }, ...STATUSES.map((s) => ({ key: s, label: cap(s), count: rows.filter((r) => r.status === s).length }))]} />
      </div>

      <TableCard loading={loading} empty={shown.length === 0} emptyTitle={rows.length === 0 ? 'No stay requests yet' : 'No requests match'} emptyBody={rows.length === 0 ? 'Stays requested on Dream Vacations appear here.' : 'Try a different search or status.'}
        headers={['Number', 'Rental', 'Dates', 'Guest', 'Total', 'Payment', 'Status', '']}>
        {shown.map((r) => (
          <tr key={r.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
            <td className="px-4 py-3 font-medium" style={{ color: 'var(--adm-text)' }}>{r.booking_number}</td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{r.vacation_rentals?.title ?? '-'}</td>
            <td className="whitespace-nowrap px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{fmtDate(r.check_in)} to {fmtDate(r.check_out)}<span className="block" style={{ color: 'var(--adm-muted)' }}>{r.total_nights} {r.total_nights === 1 ? 'night' : 'nights'}, {r.guests} {r.guests === 1 ? 'guest' : 'guests'}</span></td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{r.guest_name || r.guest_email}</td>
            <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>{money(r.total_price, r.currency)}</td>
            <td className="px-4 py-3"><StatusPill tone={PAY_TONE[r.payment_status] ?? 'neutral'}>{r.payment_status === 'success' ? 'Paid' : cap(r.payment_status)}</StatusPill></td>
            <td className="px-4 py-3"><StatusSelect value={r.status} options={STATUSES} onChange={(s) => patch(r, { status: s })} /></td>
            <td className="px-4 py-3"><IconButton title="Details" color="var(--adm-text-2)" onClick={() => setOpen(r)}><FontAwesomeIcon icon={faCircleInfo} className="h-3 w-3" /></IconButton></td>
          </tr>
        ))}
      </TableCard>

      {open && (
        <Modal title={`Stay ${open.booking_number}`} subtitle={`Requested ${new Date(open.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`} maxWidth="max-w-lg" onClose={() => setOpen(null)}
          footer={<>
            <a href={`mailto:${open.guest_email}?subject=${encodeURIComponent(`Your TechTour Ghana stay ${open.booking_number}`)}`} className="inline-flex items-center px-4 py-2 text-xs font-semibold" style={{ background: 'var(--adm-primary)', color: 'var(--brand-white)', borderRadius: 'var(--adm-radius-control)' }}>Email guest</a>
            <Button variant="secondary" onClick={() => setOpen(null)}>Close</Button>
          </>}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <StatusPill tone={STATUS_TONE[open.status]}>{cap(open.status)}</StatusPill>
            <StatusPill tone={PAY_TONE[open.payment_status] ?? 'neutral'}>{open.payment_status === 'success' ? 'Paid' : `Payment ${open.payment_status}`}</StatusPill>
          </div>
          <dl className="space-y-2 text-sm">
            {([
              ['Rental', open.vacation_rentals?.title ?? '-'],
              ['Stay', `${fmtDate(open.check_in)} to ${fmtDate(open.check_out)} (${open.total_nights} nights)`],
              ['Guests', String(open.guests)],
              ['Guest', open.guest_name || '-'], ['Email', open.guest_email], ['Phone', open.guest_phone || '-'],
              ['Nights', money(open.subtotal, open.currency)], ['Cleaning fee', money(open.cleaning_fee, open.currency)], ['Total', money(open.total_price, open.currency)],
            ] as const).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4"><dt className="flex-shrink-0 font-medium" style={{ color: 'var(--adm-muted)' }}>{k}</dt><dd className="break-all text-right" style={{ color: 'var(--adm-text)' }}>{v}</dd></div>
            ))}
          </dl>
          {open.special_requests && <p className="mt-4 whitespace-pre-wrap rounded-[var(--adm-radius-control)] p-3 text-sm" style={{ background: 'var(--adm-bg)', border: '1px solid var(--adm-border)', color: 'var(--adm-text)' }}><strong className="block text-xs" style={{ color: 'var(--adm-muted)' }}>Special requests</strong>{open.special_requests}</p>}
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div><p className="mb-1 text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Change status</p><StatusSelect value={open.status} options={STATUSES} onChange={(s) => patch(open, { status: s })} /></div>
            <Button variant="secondary" onClick={() => patch(open, { payment_status: open.payment_status === 'success' ? 'pending' : 'success' })}>{open.payment_status === 'success' ? 'Mark as unpaid' : 'Mark as paid'}</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
