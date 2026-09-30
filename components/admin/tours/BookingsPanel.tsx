'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo, faDownload } from '@fortawesome/free-solid-svg-icons';

import { Button, IconButton, Modal, SearchInput, StatusPill, StatusSelect, TableCard, Tabs, Toolbar, downloadCsv, fmtDate, reportError, rowClass, type Tone } from '@/components/admin/ui';
import { createBrowserClient } from '@/lib/supabase/client';
import { BOOKING_STATUSES, cap, money, type Booking, type BookingStatus, type PaymentStatus } from './shared';

const STATUS_TONE: Record<BookingStatus, Tone> = { pending: 'warning', confirmed: 'info', completed: 'success', cancelled: 'danger' };
const PAY_TONE: Record<PaymentStatus, Tone> = { success: 'success', pending: 'warning', failed: 'danger', abandoned: 'neutral' };

export default function BookingsPanel({ bookings, loading, reload }: { bookings: Booking[]; loading: boolean; reload: () => Promise<void> }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [filter, setFilter] = useState<'all' | BookingStatus>('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<Booking | null>(null);

  const q = search.trim().toLowerCase();
  const shown = bookings.filter((b) => (filter === 'all' || b.status === filter) && (!q || [b.booking_reference, b.email, b.tours?.title ?? ''].some((t) => t.toLowerCase().includes(q))));

  async function setStatus(b: Booking, status: BookingStatus) {
    if (reportError((await supabase.from('bookings').update({ status }).eq('id', b.id)).error)) return;
    setOpen((o) => (o?.id === b.id ? { ...o, status } : o));
    await reload();
  }

  return (
    <>
      <Toolbar
        actions={
          <Button variant="secondary" disabled={shown.length === 0} onClick={() => downloadCsv('tour-bookings.csv',
            ['Reference', 'Tour', 'Departure', 'Email', 'Phone', 'Participants', 'Total', 'Currency', 'Payment', 'Status', 'Requests', 'Booked'],
            shown.map((b) => [b.booking_reference, b.tours?.title, b.tour_schedules?.start_date, b.email, b.phone, b.participants, b.total_price, b.currency, b.payment_status, b.status, b.special_requests, b.created_at]))}>
            <FontAwesomeIcon icon={faDownload} className="mr-2 h-3 w-3" />Export CSV
          </Button>
        }
      >
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-sm" value={search} onChange={setSearch} placeholder="Search reference, email or tour" label="Search bookings" />
      </Toolbar>
      <div className="mb-4">
        <Tabs value={filter} onChange={setFilter} tabs={[{ key: 'all' as const, label: 'All', count: bookings.length }, ...BOOKING_STATUSES.map((s) => ({ key: s, label: cap(s), count: bookings.filter((b) => b.status === s).length }))]} />
      </div>

      <TableCard loading={loading} empty={shown.length === 0} emptyTitle={bookings.length === 0 ? 'No bookings yet' : 'No bookings match'} emptyBody={bookings.length === 0 ? 'Bookings made on the site appear here.' : 'Try a different search or status.'}
        headers={['Reference', 'Tour', 'Guest', 'People', 'Total', 'Payment', 'Status', '']}>
        {shown.map((b) => (
          <tr key={b.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
            <td className="px-4 py-3 font-medium" style={{ color: 'var(--adm-text)' }}>{b.booking_reference}</td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>
              {b.tours?.title ?? '-'}
              {b.tour_schedules && <span className="block" style={{ color: 'var(--adm-muted)' }}>{fmtDate(b.tour_schedules.start_date)}</span>}
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{b.email}</td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{b.participants}</td>
            <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>{money(b.total_price, b.currency)}</td>
            <td className="px-4 py-3"><StatusPill tone={PAY_TONE[b.payment_status] ?? 'neutral'}>{cap(b.payment_status)}</StatusPill></td>
            <td className="px-4 py-3"><StatusSelect value={b.status} options={BOOKING_STATUSES} onChange={(s) => setStatus(b, s)} /></td>
            <td className="px-4 py-3"><IconButton title="Details" color="var(--adm-text-2)" onClick={() => setOpen(b)}><FontAwesomeIcon icon={faCircleInfo} className="h-3 w-3" /></IconButton></td>
          </tr>
        ))}
      </TableCard>

      {open && (
        <Modal title={`Booking ${open.booking_reference}`} subtitle={`Made ${new Date(open.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`} maxWidth="max-w-lg" onClose={() => setOpen(null)}
          footer={<>
            <a href={`mailto:${open.email}?subject=${encodeURIComponent(`Your TechTour Ghana booking ${open.booking_reference}`)}`} className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white" style={{ background: 'var(--adm-primary)', borderRadius: 'var(--adm-radius-control)' }}>Email guest</a>
            <Button variant="secondary" onClick={() => setOpen(null)}>Close</Button>
          </>}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <StatusPill tone={STATUS_TONE[open.status]}>{cap(open.status)}</StatusPill>
            <StatusPill tone={PAY_TONE[open.payment_status] ?? 'neutral'}>Payment {open.payment_status}</StatusPill>
          </div>
          <dl className="space-y-2 text-sm">
            {([
              ['Tour', open.tours?.title ?? '-'],
              ['Departure', open.tour_schedules ? `${fmtDate(open.tour_schedules.start_date)} to ${fmtDate(open.tour_schedules.end_date)}` : '-'],
              ['Email', open.email], ['Phone', open.phone || '-'], ['People', String(open.participants)],
              ['Total', money(open.total_price, open.currency)], ['Payment method', open.payment_method || '-'], ['Transaction', open.transaction_id || '-'],
            ] as const).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4"><dt className="flex-shrink-0 font-medium" style={{ color: 'var(--adm-muted)' }}>{k}</dt><dd className="break-all text-right" style={{ color: 'var(--adm-text)' }}>{v}</dd></div>
            ))}
          </dl>
          {open.special_requests && <p className="mt-4 whitespace-pre-wrap rounded-[var(--adm-radius-control)] p-3 text-sm" style={{ background: 'var(--adm-bg)', border: '1px solid var(--adm-border)', color: 'var(--adm-text)' }}><strong className="block text-xs" style={{ color: 'var(--adm-muted)' }}>Special requests</strong>{open.special_requests}</p>}
          <div className="mt-4"><p className="mb-1 text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Change status</p><StatusSelect value={open.status} options={BOOKING_STATUSES} onChange={(s) => setStatus(open, s)} /></div>
        </Modal>
      )}
    </>
  );
}
