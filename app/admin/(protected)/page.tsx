'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faBox,
  faEnvelope,
  faShoppingBag,
  faChartLine,
  faHammer,
  faBriefcase,
  faMicrochip,
} from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import AdminLayout from '@/components/AdminLayout';

const BRAND_COLORS = { tropicalTeal: '#139EA2', sandyOrange: '#E6A64D' };

interface Stats {
  users: number;
  products: number;
  artisans: number;
  orders: number;
  messages: number;
  newsletter: number;
  jobs: number;
  tech: number;
}

interface RecentActivity {
  id: string;
  action: string;
  page_visited: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const { isDimMode } = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('market_products').select('id', { count: 'exact', head: true }),
      supabase.from('artisans').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('contact_messages').select('id', { count: 'exact', head: true }),
      supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }),
      supabase.from('job_openings').select('id', { count: 'exact', head: true }),
      supabase.from('tech_innovations').select('id', { count: 'exact', head: true }),
      supabase.from('analytics_user_activities').select('id, action, page_visited, created_at').order('created_at', { ascending: false }).limit(10),
    ]).then(([users, products, artisans, orders, messages, newsletter, jobs, tech, recentActivity]) => {
      setStats({
        users: users.count ?? 0,
        products: products.count ?? 0,
        artisans: artisans.count ?? 0,
        orders: orders.count ?? 0,
        messages: messages.count ?? 0,
        newsletter: newsletter.count ?? 0,
        jobs: jobs.count ?? 0,
        tech: tech.count ?? 0,
      });
      setActivity((recentActivity.data ?? []) as RecentActivity[]);
      setLoading(false);
    });
  }, []);

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#111827',
    textSecondary: isDimMode ? '#B0B0B0' : '#4B5563',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
  };

  const statCards = stats
    ? [
        { icon: faUsers, label: 'Users', value: stats.users, color: BRAND_COLORS.tropicalTeal, href: '/admin/users' },
        { icon: faBox, label: 'Products', value: stats.products, color: BRAND_COLORS.sandyOrange, href: '/admin/market' },
        { icon: faHammer, label: 'Artisans', value: stats.artisans, color: '#8B5CF6', href: '/admin/artisans' },
        { icon: faShoppingBag, label: 'Orders', value: stats.orders, color: '#10B981', href: '#' },
        { icon: faEnvelope, label: 'Messages', value: stats.messages, color: '#EF4444', href: '/admin/contacts' },
        { icon: faChartLine, label: 'Subscribers', value: stats.newsletter, color: '#F59E0B', href: '/admin/newsletter' },
        { icon: faBriefcase, label: 'Job Openings', value: stats.jobs, color: '#EC4899', href: '/admin/team' },
        { icon: faMicrochip, label: 'Tech Items', value: stats.tech, color: '#06B6D4', href: '/admin/tech' },
      ]
    : [];

  if (loading) {
    return (
      <AdminLayout title="Dashboard" subtitle="Overview of site content and activity">
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND_COLORS.tropicalTeal, borderTopColor: 'transparent' }} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" subtitle="Overview of site content and activity">
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <a
              key={card.label}
              href={card.href}
              className="rounded-xl p-4 transition hover:scale-[1.02]"
              style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${card.color}22` }}>
                  <FontAwesomeIcon icon={card.icon} className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <span className="text-2xl font-bold" style={{ color: themeStyles.textPrimary }}>{card.value}</span>
              </div>
              <p className="text-xs" style={{ color: themeStyles.textSecondary }}>{card.label}</p>
            </a>
          ))}
        </div>

        {/* Recent activity */}
        <div className="rounded-xl overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: themeStyles.border }}>
            <h2 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>Recent Activity</h2>
          </div>
          {activity.length === 0 ? (
            <p className="p-5 text-sm" style={{ color: themeStyles.textMuted }}>No activity recorded yet.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: themeStyles.border }}>
              {activity.map((row) => (
                <div key={row.id} className="px-5 py-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium" style={{ color: themeStyles.textPrimary }}>{row.action}</p>
                    <p className="text-xs mt-0.5" style={{ color: themeStyles.textSecondary }}>{row.page_visited || '-'}</p>
                  </div>
                  <p className="text-xs flex-shrink-0" style={{ color: themeStyles.textMuted }}>
                    {new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
