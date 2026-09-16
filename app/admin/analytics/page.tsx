'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner,
  faChartLine,
  faUsers,
  faShoppingCart,
  faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import AdminLayout from '@/components/AdminLayout';

const BRAND_COLORS = { tropicalTeal: '#139EA2', sandyOrange: '#E6A64D' };

interface ActivityRow {
  id: string;
  user_id: string | null;
  action: string;
  page_visited: string;
  created_at: string;
}

interface OrderRow {
  id: string;
  order_status: string;
  created_at: string;
}

interface PaystackRow {
  amount: number;
  status: string;
}

export default function AdminAnalyticsPage() {
  const { isDimMode } = useTheme();

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#111827',
    textSecondary: isDimMode ? '#B0B0B0' : '#4B5563',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
  };

  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [newUsers, setNewUsers] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [activityRes, profilesRes, ordersRes, paystackRes] = await Promise.all([
        supabase
          .from('analytics_user_activities')
          .select('id, user_id, action, page_visited, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id')
          .gte('created_at', thirtyDaysAgo),
        supabase
          .from('orders')
          .select('id, order_status, created_at'),
        supabase
          .from('paystack_transactions')
          .select('amount, status')
          .eq('status', 'success'),
      ]);

      setActivity((activityRes.data as ActivityRow[]) ?? []);
      setNewUsers(profilesRes.data?.length ?? 0);
      setTotalOrders(ordersRes.data?.length ?? 0);

      const ghsRevenue = ((paystackRes.data as PaystackRow[]) ?? [])
        .reduce((sum, r) => sum + (r.amount ?? 0), 0) / 100;
      setRevenue(ghsRevenue);

      setLoading(false);
    }
    load();
  }, []);

  // Aggregate by activity_type client-side (4,377 rows is fine)
  const breakdown = Object.entries(
    activity.reduce<Record<string, number>>((acc, row) => {
      const key = row.action || 'unknown';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const recentActivity = activity.slice(0, 20);

  const statCards = [
    {
      label: 'Total Activity Events',
      value: activity.length.toLocaleString(),
      icon: faChartLine,
      color: BRAND_COLORS.tropicalTeal,
    },
    {
      label: 'New Users (Last 30 Days)',
      value: newUsers.toLocaleString(),
      icon: faUsers,
      color: BRAND_COLORS.sandyOrange,
    },
    {
      label: 'Total Orders',
      value: totalOrders.toLocaleString(),
      icon: faShoppingCart,
      color: BRAND_COLORS.tropicalTeal,
    },
    {
      label: 'Total Revenue (GHS)',
      value: `GHS ${revenue.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: faMoneyBillWave,
      color: BRAND_COLORS.sandyOrange,
    },
  ];

  return (
    <AdminLayout title="Analytics" subtitle="Site activity and usage statistics">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 animate-spin" style={{ color: BRAND_COLORS.tropicalTeal }} />
        </div>
      ) : (
        <div className="space-y-8">

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map(({ label, value, icon, color }) => (
              <div
                key={label}
                className="rounded-xl p-5 flex items-center gap-4"
                style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}22` }}
                >
                  <FontAwesomeIcon icon={icon} className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: themeStyles.textMuted }}>{label}</p>
                  <p className="text-xl font-bold" style={{ color: themeStyles.textPrimary }}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Breakdown */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: themeStyles.border }}>
              <h2 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>Activity Breakdown</h2>
              <p className="text-xs mt-0.5" style={{ color: themeStyles.textMuted }}>All-time counts by activity type</p>
            </div>
            {breakdown.length === 0 ? (
              <p className="p-6 text-sm text-center" style={{ color: themeStyles.textMuted }}>No activity data.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: themeStyles.border }}>
                      {['Activity Type', 'Count'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: themeStyles.textMuted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map(([type, count]) => (
                      <tr key={type} className="border-b last:border-b-0" style={{ borderColor: themeStyles.border }}>
                        <td className="px-5 py-3 font-medium" style={{ color: themeStyles.textPrimary }}>{type}</td>
                        <td className="px-5 py-3 tabular-nums" style={{ color: themeStyles.textSecondary }}>{count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: themeStyles.border }}>
              <h2 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>Recent Activity</h2>
              <p className="text-xs mt-0.5" style={{ color: themeStyles.textMuted }}>Last 20 events</p>
            </div>
            {recentActivity.length === 0 ? (
              <p className="p-6 text-sm text-center" style={{ color: themeStyles.textMuted }}>No recent activity.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: themeStyles.border }}>
                      {['User ID', 'Action', 'Page', 'Date'].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: themeStyles.textMuted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((row) => (
                      <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: themeStyles.border }}>
                        <td className="px-5 py-3 font-mono text-xs" style={{ color: themeStyles.textMuted }}>
                          {row.user_id ? `${row.user_id.slice(0, 8)}…` : '—'}
                        </td>
                        <td className="px-5 py-3 font-medium" style={{ color: themeStyles.textPrimary }}>{row.action}</td>
                        <td className="px-5 py-3 max-w-xs truncate" style={{ color: themeStyles.textSecondary }} title={row.page_visited}>
                          {row.page_visited || '—'}
                        </td>
                        <td className="px-5 py-3 text-xs whitespace-nowrap" style={{ color: themeStyles.textMuted }}>
                          {new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </AdminLayout>
  );
}
