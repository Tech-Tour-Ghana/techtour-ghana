// getDashboardStats (lib/api.ts) gathers
// the counts, profile completeness and recent orders directly through
// Supabase, replacing the single Django stats endpoint. The old endpoint
// hardcoded profile completeness at 80% plus bonuses, here it is the share of
// profile fields actually filled in.

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faShoppingBag, faGraduationCap, faHeart, faClock } from '@fortawesome/free-solid-svg-icons';
import { getAuthStatus, getDashboardStats, type User, type DashboardStats } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import DashboardLayout from '@/components/DashboardLayout';

const BRAND_COLORS = {
  tropicalTeal: '#139EA2',
  sandyOrange: '#E6A64D',
};

export default function DashboardPage() {
  const { isDimMode } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    Promise.all([getAuthStatus(), getDashboardStats()])
      .then(([status, dashboardStats]) => {
        if (status.user) setUser(status.user);
        setStats(dashboardStats);
      })
      .finally(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isDimMode ? '#0A0A0A' : '#F9F9F9' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: BRAND_COLORS.tropicalTeal, borderTopColor: 'transparent' }}></div>
          <p className="mt-4 text-sm" style={{ color: isDimMode ? '#B0B0B0' : '#4A4A4A' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#000000',
    textSecondary: isDimMode ? '#B0B0B0' : '#4A4A4A',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
  };

  const StatCard = ({ icon, label, value, color }: { icon: typeof faCalendarCheck; label: string; value: number; color: string }) => (
    <div className="rounded-2xl p-5" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: themeStyles.textSecondary }}>{label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: themeStyles.textPrimary }}>{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
          <FontAwesomeIcon icon={icon} style={{ color }} />
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Dashboard" subtitle={`${getGreeting()}, ${user?.display_name || 'User'}!`}>
      <section className="mb-6 flex items-start gap-4 rounded-2xl p-5 sm:p-6" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold text-white" style={{ background: BRAND_COLORS.tropicalTeal }} aria-hidden>
          {(user?.display_name || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold sm:text-2xl" style={{ color: themeStyles.textPrimary }}>Welcome back, {user?.display_name || 'User'}</h2>
          <p className="mt-1 text-sm" style={{ color: themeStyles.textSecondary }}>Here is a summary of your activity on TechTour Ghana.</p>
          <div className="mt-4" role="group" aria-label="Profile completeness">
            <div className="mb-1.5 flex items-center justify-between text-xs" style={{ color: themeStyles.textSecondary }}>
              <span>Profile {stats?.profile_complete || 0}% complete</span>
              {(stats?.profile_complete || 0) < 100 && <Link href="/auth/profile" className="font-semibold underline" style={{ color: BRAND_COLORS.tropicalTeal }}>Finish your profile</Link>}
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: isDimMode ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }}>
              <div className="h-full rounded-full" style={{ width: `${stats?.profile_complete || 0}%`, background: BRAND_COLORS.tropicalTeal }} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={faCalendarCheck} label="Tours Booked" value={stats?.tours_booked || 0} color={BRAND_COLORS.tropicalTeal} />
        <StatCard icon={faShoppingBag} label="Purchases" value={stats?.orders_placed || 0} color={BRAND_COLORS.sandyOrange} />
        <StatCard icon={faGraduationCap} label="Study Apps" value={stats?.study_applications || 0} color="#8B5CF6" />
        <StatCard icon={faHeart} label="Wishlist" value={stats?.wishlist_count || 0} color="#EF4444" />
      </div>

      {stats && stats.recent_orders.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-4" style={{ color: themeStyles.textPrimary }}>
            <FontAwesomeIcon icon={faClock} className="mr-2" style={{ color: BRAND_COLORS.tropicalTeal }} />
            Recent Orders
          </h3>
          <div className="space-y-3">
            {stats.recent_orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl p-4 flex items-center justify-between"
                style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
              >
                <div>
                  <p className="font-medium" style={{ color: themeStyles.textPrimary }}>{order.product_name}</p>
                  <p className="text-xs" style={{ color: themeStyles.textMuted }}>
                    #{order.order_number} • {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold" style={{ color: BRAND_COLORS.tropicalTeal }}>
                    ₵{order.total_price.toFixed(2)}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    order.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                    order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-xs" style={{ color: themeStyles.textMuted }}>
          TechTour Ghana. Redefining African Tourism Through Innovation
        </p>
      </div>
    </DashboardLayout>
  );
}
