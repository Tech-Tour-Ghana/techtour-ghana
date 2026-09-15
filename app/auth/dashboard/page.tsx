// Ported from docs/old-sites/techtour-frontend/app/auth/dashboard/page.tsx.
// Markup and styling are unchanged. getDashboardStats (lib/api.ts) counts
// the caller's own bookings and orders directly through Supabase; the old
// study_applications and wishlist_count fields are dropped along with the
// stat cards that showed them, since neither ever had a real backend (see
// the comment in components/DashboardLayout.tsx). recent_orders is dropped
// for the same reason profile_complete is: both were computed server side
// in Python and have no equivalent here without reintroducing that logic,
// and the orders list itself already exists at /auth/orders.

'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faShoppingBag, faShieldAlt, faGlobeAfrica } from '@fortawesome/free-solid-svg-icons';
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
      <div className="rounded-2xl p-6 mb-6 text-white" style={{ background: `linear-gradient(135deg, ${BRAND_COLORS.tropicalTeal}, ${BRAND_COLORS.sandyOrange})` }}>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {(user?.display_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {user?.display_name || 'User'}!</h2>
            <p className="text-white/80 text-sm mt-1">Here&apos;s a summary of your activity on TechTour Ghana.</p>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
                <FontAwesomeIcon icon={faShieldAlt} className="mr-1" />
                Verified Member
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={faCalendarCheck} label="Tours Booked" value={stats?.tours_booked || 0} color={BRAND_COLORS.tropicalTeal} />
        <StatCard icon={faShoppingBag} label="Orders Placed" value={stats?.orders_placed || 0} color={BRAND_COLORS.sandyOrange} />
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs" style={{ color: themeStyles.textMuted }}>
          <FontAwesomeIcon icon={faGlobeAfrica} className="mr-1" />
          TechTour Ghana — Redefining African Tourism Through Innovation
        </p>
      </div>
    </DashboardLayout>
  );
}
