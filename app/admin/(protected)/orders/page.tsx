'use client';

// Market orders. Admin can read every order (orders_select_admin) and change
// status and tracking (orders_update_admin, 0013). Orders are created by the
// Paystack settlement path, never by hand, so there is no add or delete here.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen, faCircleInfo, faCoins, faDownload, faTruck } from '@fortawesome/free-solid-svg-icons';

import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { notify } from '@/components/admin/toast';
import {
  Button, IconButton, Modal, SearchInput, StatTile, StatusPill, StatusSelect, TableCard, Tabs, Toolbar,
  confirmAction, downloadCsv, fieldStyle, fmtDate, rowClass, type Tone,
} from '@/components/admin/ui';
import type { Database } from '@/types/database';

type OrderStatus = Database['public']['Enums']['order_status'];
type PaymentStatus = Database['public']['Enums']['payment_status'];
const ORDER_STATUSES: readonly OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_TONE: Record<PaymentStatus, Tone> = { success: 'success', pending: 'warning', failed: 'danger', abandoned: 'neutral' };

interface OrderRow {
  id: string;
  order_number: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  tracking_number: string;
  shipping_address: string;
  shipping_city: string;
  shipping_region: string;
  shipping_country: string;
  phone_number: string;
  created_at: string;
  market_products: { title: string } | null;
  profiles: { email: string } | null;
}

const SELECT = 'id, order_number, quantity, unit_price, total_price, currency, order_status, payment_status, tracking_number, shipping_address, shipping_city, shipping_region, shipping_country, phone_number, created_at, market_products(title), profiles(email)';

export default function AdminOrdersPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<OrderRow | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('orders').select(SELECT).order('created_at', { ascending: false });
    if (err) setError('Could not load orders.');
    else { setOrders((data as unknown as OrderRow[]) ?? []); setError(''); }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function update(id: string, patch: { order_status?: OrderStatus; tracking_number?: string }) {
    const target = orders.find((o) => o.id === id);
    if (target && (patch.order_status === 'shipped' || patch.order_status === 'delivered') && target.payment_status !== 'success') {
      if (!(await confirmAction({ title: 'Order not paid', message: `Order ${target.order_number} has not been paid. Mark it as ${patch.order_status} anyway?`, confirmLabel: `Mark ${patch.order_status}` }))) { await load(); return; }
    }
    const { error: err } = await supabase.from('orders').update(patch).eq('id', id);
    if (err) return notify('Could not update the order. Please try again.');
    notify(patch.order_status ? 'Status updated. The customer was notified.' : 'Order updated.', 'success');
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    setOpen((o) => (o?.id === id ? { ...o, ...patch } : o));
  }

  const q = search.trim().toLowerCase();
  const shown = orders.filter((o) => {
    if (filter !== 'all' && o.order_status !== filter) return false;
    return !q || [o.order_number, o.profiles?.email ?? '', o.market_products?.title ?? '', o.tracking_number].some((t) => t.toLowerCase().includes(q));
  });

  const paid = orders.filter((o) => o.payment_status === 'success' && o.order_status !== 'refunded' && o.order_status !== 'cancelled');
  const revenue = paid.filter((o) => o.currency === 'GHS').reduce((sum, o) => sum + o.total_price, 0);
  const toShip = orders.filter((o) => o.payment_status === 'success' && (o.order_status === 'pending' || o.order_status === 'processing')).length;

  return (
    <AdminLayout title="Orders" subtitle="Market orders and fulfilment">
      <div className="mb-4 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile icon={faBoxOpen} label="Orders" value={orders.length} tone="info" />
        <StatTile icon={faTruck} label="Paid, to ship" value={toShip} tone="warning" />
        <StatTile icon={faCoins} label="Revenue (GHS)" value={revenue.toLocaleString('en-GB', { maximumFractionDigits: 2 })} tone="success" />
      </div>

      <Toolbar
        actions={
          <Button variant="secondary" disabled={shown.length === 0} onClick={() => downloadCsv('orders.csv',
            ['Order', 'Customer', 'Product', 'Quantity', 'Total', 'Currency', 'Payment', 'Status', 'Tracking', 'Address', 'City', 'Region', 'Country', 'Phone', 'Date'],
            shown.map((o) => [o.order_number, o.profiles?.email, o.market_products?.title, o.quantity, o.total_price, o.currency, o.payment_status, o.order_status, o.tracking_number, o.shipping_address, o.shipping_city, o.shipping_region, o.shipping_country, o.phone_number, o.created_at]))}>
            <FontAwesomeIcon icon={faDownload} className="mr-2 h-3 w-3" />Export CSV
          </Button>
        }
      >
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-sm" value={search} onChange={setSearch} placeholder="Search order, customer or product" label="Search orders" />
      </Toolbar>
      <div className="mb-4">
        <Tabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { key: 'all' as const, label: 'All', count: orders.length },
            ...ORDER_STATUSES.map((s) => ({ key: s, label: s.charAt(0).toUpperCase() + s.slice(1), count: orders.filter((o) => o.order_status === s).length })),
          ]}
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>
      ) : (
        <TableCard
          loading={loading}
          empty={shown.length === 0}
          emptyTitle={orders.length === 0 ? 'No orders yet' : 'No orders match'}
          emptyBody={orders.length === 0 ? 'Paid orders from the marketplace appear here.' : 'Try a different search or status.'}
          headers={['Order', 'Customer', 'Product', 'Total', 'Payment', 'Status', 'Date', '']}
        >
          {shown.map((o) => (
            <tr key={o.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--adm-text)' }}>{o.order_number}</td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{o.profiles?.email ?? '-'}</td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{o.market_products?.title ?? '-'} × {o.quantity}</td>
              <td className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>{o.currency} {o.total_price.toFixed(2)}</td>
              <td className="px-4 py-3"><StatusPill tone={PAYMENT_TONE[o.payment_status] ?? 'neutral'}><span className="capitalize">{o.payment_status}</span></StatusPill></td>
              <td className="px-4 py-3"><StatusSelect value={o.order_status} options={ORDER_STATUSES} onChange={(s) => update(o.id, { order_status: s })} /></td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-muted)' }}>{fmtDate(o.created_at)}</td>
              <td className="px-4 py-3"><IconButton title="Order details" color="var(--adm-text-2)" onClick={() => setOpen(o)}><FontAwesomeIcon icon={faCircleInfo} className="h-3 w-3" /></IconButton></td>
            </tr>
          ))}
        </TableCard>
      )}

      {open && (
        <Modal title={`Order ${open.order_number}`} subtitle={new Date(open.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} maxWidth="max-w-lg" onClose={() => setOpen(null)}
          footer={<Button variant="secondary" onClick={() => setOpen(null)}>Close</Button>}>
          <dl className="space-y-2 text-sm">
            {([
              ['Customer', open.profiles?.email ?? '-'],
              ['Phone', open.phone_number || '-'],
              ['Product', `${open.market_products?.title ?? '-'} × ${open.quantity}`],
              ['Unit price', `${open.currency} ${open.unit_price.toFixed(2)}`],
              ['Total', `${open.currency} ${open.total_price.toFixed(2)}`],
              ['Ship to', [open.shipping_address, open.shipping_city, open.shipping_region, open.shipping_country].filter(Boolean).join(', ') || '-'],
            ] as const).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="flex-shrink-0 font-medium" style={{ color: 'var(--adm-muted)' }}>{k}</dt>
                <dd className="text-right" style={{ color: 'var(--adm-text)' }}>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Status</label>
              <StatusSelect value={open.order_status} options={ORDER_STATUSES} onChange={(s) => update(open.id, { order_status: s })} />
            </div>
            <div>
              <label htmlFor="tracking" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Tracking number</label>
              <input
                id="tracking"
                key={open.id}
                defaultValue={open.tracking_number}
                onBlur={(e) => e.target.value.trim() !== open.tracking_number && update(open.id, { tracking_number: e.target.value.trim() })}
                placeholder="Add tracking number"
                className="w-full px-3 py-2 text-sm"
                style={fieldStyle}
              />
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
