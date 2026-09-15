// Ported from docs/old-sites/techtour-frontend/app/auth/orders/page.tsx.
// Markup and styling are unchanged. getUserOrders (lib/api.ts) now queries
// public.orders directly through Supabase instead of a Django endpoint; RLS
// (0013, orders_select_own) already scopes the result to the caller.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import DashboardLayout from '@/components/DashboardLayout';
import { getUserOrders, type Order } from '@/lib/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoppingBag,
  faGlobeAfrica,
  faClock,
  faCheckCircle,
  faTruck,
  faBox,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

const BRAND_COLORS = {
  tropicalTeal: '#139EA2',
  sandyOrange: '#E6A64D',
};

export default function OrdersPage() {
  const router = useRouter();
  const { isDimMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getUserOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      processing: '#3B82F6',
      shipped: '#8B5CF6',
      delivered: '#10B981',
      cancelled: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusIcon = (status: string): IconDefinition => {
    const icons: Record<string, IconDefinition> = {
      pending: faClock,
      processing: faBox,
      shipped: faTruck,
      delivered: faCheckCircle,
      cancelled: faClock,
    };
    return icons[status] || faClock;
  };

  const getStatusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#000000',
    textSecondary: isDimMode ? '#B0B0B0' : '#4A4A4A',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDimMode ? '#0A0A0A' : '#F9F9F9' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: BRAND_COLORS.tropicalTeal, borderTopColor: 'transparent' }}></div>
          <p className="mt-4 text-sm" style={{ color: themeStyles.textSecondary }}>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="My Orders" subtitle="Track and manage your orders">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 text-sm rounded-full transition-all duration-200 ${filter === status ? 'text-white' : ''}`}
              style={{
                background: filter === status ? BRAND_COLORS.tropicalTeal : 'transparent',
                color: filter === status ? 'white' : themeStyles.textSecondary,
                border: `1px solid ${filter === status ? BRAND_COLORS.tropicalTeal : themeStyles.border}`,
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="rounded-2xl p-5 transition-all duration-200 hover:shadow-lg" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold" style={{ color: themeStyles.textPrimary }}>#{order.order_number}</p>
                    <span
                      className="px-2.5 py-0.5 text-xs font-medium rounded-full flex items-center gap-1.5"
                      style={{ background: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status) }}
                    >
                      <FontAwesomeIcon icon={getStatusIcon(order.status)} className="w-3 h-3" />
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: themeStyles.textSecondary }}>
                    {order.product_name} • {order.quantity} {order.quantity === 1 ? 'item' : 'items'}
                  </p>
                  <p className="text-xs" style={{ color: themeStyles.textMuted }}>
                    Ordered on {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                  {order.tracking_number && (
                    <p className="text-xs mt-1" style={{ color: BRAND_COLORS.tropicalTeal }}>Tracking: {order.tracking_number}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm" style={{ color: themeStyles.textMuted }}>Total</p>
                    <p className="text-lg font-bold" style={{ color: BRAND_COLORS.tropicalTeal }}>
                      {order.currency === 'GHS' ? '₵' : order.currency + ' '}{order.total_price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t" style={{ borderColor: themeStyles.border }}>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: themeStyles.border }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width:
                          order.status === 'pending' ? '25%' :
                          order.status === 'processing' ? '50%' :
                          order.status === 'shipped' ? '75%' :
                          order.status === 'delivered' ? '100%' : '0%',
                        background: BRAND_COLORS.tropicalTeal,
                      }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: themeStyles.textMuted }}>
                    {order.status === 'pending' ? 'Order placed' :
                      order.status === 'processing' ? 'Processing' :
                      order.status === 'shipped' ? 'On the way' :
                      order.status === 'delivered' ? 'Delivered' : 'Cancelled'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl p-12 text-center" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          <FontAwesomeIcon icon={faShoppingBag} className="text-6xl mb-4" style={{ color: themeStyles.textMuted }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: themeStyles.textPrimary }}>No orders found</h3>
          <p className="text-sm" style={{ color: themeStyles.textSecondary }}>Start shopping to see your orders here.</p>
          <button className="mt-4 px-6 py-2.5 rounded-xl font-medium transition-all duration-200 hover:scale-105" style={{ background: BRAND_COLORS.tropicalTeal, color: 'white' }} onClick={() => router.push('/market')}>
            Start Shopping
          </button>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-xs" style={{ color: themeStyles.textMuted }}>
          <FontAwesomeIcon icon={faGlobeAfrica} className="mr-1" />
          TechTour Ghana — Redefining African Tourism Through Innovation
        </p>
      </div>
    </DashboardLayout>
  );
}
