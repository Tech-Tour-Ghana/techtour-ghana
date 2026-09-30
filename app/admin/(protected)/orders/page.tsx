'use client';

// Market orders. Replaces the old Django admin order list. Admin can read
// every order (orders_select_admin) and change status and tracking
// (orders_update_admin, 0013). Orders are created by the Paystack settlement
// path, never by hand.

import { useCallback, useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { StatusSelect, TableCard, Tabs, fmtDate, rowClass, useAdminTheme } from '@/components/admin/ui';
import type { Database } from '@/types/database';

type OrderStatus = Database['public']['Enums']['order_status'];
const ORDER_STATUSES: readonly OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

interface OrderRow {
  id: string;
  order_number: string;
  quantity: number;
  total_price: number;
  currency: string;
  order_status: OrderStatus;
  payment_status: string;
  tracking_number: string;
  created_at: string;
  market_products: { title: string } | null;
  profiles: { email: string } | null;
}

export default function AdminOrdersPage() {
  const t = useAdminTheme();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');

  const load = useCallback(async () => {
    const { data } = await createBrowserClient()
      .from('orders')
      .select('id, order_number, quantity, total_price, currency, order_status, payment_status, tracking_number, created_at, market_products(title), profiles(email)')
      .order('created_at', { ascending: false });
    setOrders((data as unknown as OrderRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function update(id: string, patch: { order_status?: OrderStatus; tracking_number?: string }) {
    const { error } = await createBrowserClient().from('orders').update(patch).eq('id', id);
    if (error) {
      window.alert(`Could not update the order: ${error.message}`);
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  const shown = filter === 'all' ? orders : orders.filter((o) => o.order_status === filter);

  return (
    <AdminLayout title="Orders" subtitle="Market orders and fulfilment">
      <div className="space-y-4">
        <Tabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { key: 'all' as const, label: 'All', count: orders.length },
            ...ORDER_STATUSES.map((s) => ({ key: s, label: s, count: orders.filter((o) => o.order_status === s).length })),
          ]}
        />
        <TableCard loading={loading} empty={shown.length === 0} headers={['Order', 'Customer', 'Product', 'Total', 'Payment', 'Status', 'Tracking', 'Date']}>
          {shown.map((o) => (
            <tr key={o.id} className={rowClass} style={{ borderColor: t.border }}>
              <td className="px-4 py-3 font-medium" style={{ color: t.textPrimary }}>{o.order_number}</td>
              <td className="px-4 py-3" style={{ color: t.textSecondary }}>{o.profiles?.email ?? '-'}</td>
              <td className="px-4 py-3" style={{ color: t.textSecondary }}>{o.market_products?.title ?? '-'} × {o.quantity}</td>
              <td className="px-4 py-3" style={{ color: t.textPrimary }}>{o.currency} {o.total_price.toFixed(2)}</td>
              <td className="px-4 py-3" style={{ color: t.textSecondary }}>{o.payment_status}</td>
              <td className="px-4 py-3">
                <StatusSelect value={o.order_status} options={ORDER_STATUSES} onChange={(s) => update(o.id, { order_status: s })} />
              </td>
              <td className="px-4 py-3">
                <input
                  defaultValue={o.tracking_number}
                  onBlur={(e) => e.target.value !== o.tracking_number && update(o.id, { tracking_number: e.target.value.trim() })}
                  placeholder="Tracking no."
                  className="px-2 py-1 rounded-lg text-xs w-32"
                  style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textPrimary }}
                />
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: t.textMuted }}>{fmtDate(o.created_at)}</td>
            </tr>
          ))}
        </TableCard>
      </div>
    </AdminLayout>
  );
}
