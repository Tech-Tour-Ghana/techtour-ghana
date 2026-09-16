'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner,
  faCheck,
  faTimes,
  faTrash,
  faUsers,
  faUserCheck,
} from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import AdminLayout from '@/components/AdminLayout';

const BRAND_COLORS = { tropicalTeal: '#139EA2', sandyOrange: '#E6A64D' };

type Source = 'footer' | 'popup' | 'landing' | 'other';

interface Subscriber {
  id: string;
  email: string;
  country: string | null;
  source: Source | null;
  is_active: boolean;
  created_at: string;
}

const SOURCE_STYLES: Record<Source, { bg: string; color: string }> = {
  footer:  { bg: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal },
  popup:   { bg: `${BRAND_COLORS.sandyOrange}22`, color: BRAND_COLORS.sandyOrange },
  landing: { bg: '#8B5CF622', color: '#8B5CF6' },
  other:   { bg: '#6B728022', color: '#6B7280' },
};

export default function AdminNewsletterPage() {
  const { isDimMode } = useTheme();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#111827',
    textSecondary: isDimMode ? '#B0B0B0' : '#4B5563',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    inputBg: isDimMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    inputBorder: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
  };

  const fetchSubscribers = useCallback(async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, country, source, is_active, created_at')
      .order('created_at', { ascending: false });
    setSubscribers((data as Subscriber[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

  async function toggleActive(sub: Subscriber) {
    setBusyId(sub.id);
    const supabase = createBrowserClient();
    await supabase
      .from('newsletter_subscribers')
      .update({ is_active: !sub.is_active })
      .eq('id', sub.id);
    setSubscribers((prev) =>
      prev.map((s) => s.id === sub.id ? { ...s, is_active: !s.is_active } : s)
    );
    setBusyId(null);
  }

  async function deleteSub(sub: Subscriber) {
    if (!window.confirm(`Remove ${sub.email} from the newsletter? This cannot be undone.`)) return;
    setBusyId(sub.id);
    const supabase = createBrowserClient();
    await supabase.from('newsletter_subscribers').delete().eq('id', sub.id);
    setSubscribers((prev) => prev.filter((s) => s.id !== sub.id));
    setBusyId(null);
  }

  const activeCount = subscribers.filter((s) => s.is_active).length;

  const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const sourceStyle = (src: Source | null) =>
    src && src in SOURCE_STYLES ? SOURCE_STYLES[src] : SOURCE_STYLES.other;

  return (
    <AdminLayout title="Newsletter" subtitle="Manage newsletter subscribers">
      <div className="space-y-4">
        {/* Summary stat cards */}
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          {[
            { icon: faUsers, label: 'Total Subscribers', value: subscribers.length, color: BRAND_COLORS.tropicalTeal },
            { icon: faUserCheck, label: 'Active', value: activeCount, color: '#10B981' },
          ].map(({ icon, label, value, color }) => (
            <div
              key={label}
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}22` }}
              >
                <FontAwesomeIcon icon={icon} className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-bold leading-tight" style={{ color: themeStyles.textPrimary }}>{value}</p>
                <p className="text-xs" style={{ color: themeStyles.textMuted }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 animate-spin" style={{ color: BRAND_COLORS.tropicalTeal }} />
            </div>
          ) : subscribers.length === 0 ? (
            <p className="p-6 text-sm text-center" style={{ color: themeStyles.textMuted }}>No subscribers yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: themeStyles.border }}>
                    {['Email', 'Name', 'Source', 'Status', 'Subscribed', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: themeStyles.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => {
                    const busy = busyId === sub.id;
                    const srcStyle = sourceStyle(sub.source);
                    return (
                      <tr
                        key={sub.id}
                        className="border-b last:border-b-0 transition hover:bg-black/5"
                        style={{ borderColor: themeStyles.border }}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: themeStyles.textPrimary }}>{sub.email}</td>
                        <td className="px-4 py-3" style={{ color: themeStyles.textSecondary }}>{sub.country || '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                            style={{ background: srcStyle.bg, color: srcStyle.color }}
                          >
                            {sub.source || 'other'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={sub.is_active
                              ? { background: '#10B98122', color: '#10B981' }
                              : { background: '#EF444422', color: '#EF4444' }
                            }
                          >
                            <FontAwesomeIcon icon={sub.is_active ? faCheck : faTimes} className="w-2.5 h-2.5" />
                            {sub.is_active ? 'Active' : 'Unsubscribed'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: themeStyles.textMuted }}>
                          {fmtDate(sub.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* Toggle active */}
                            <button
                              onClick={() => toggleActive(sub)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80"
                              style={sub.is_active
                                ? { background: '#EF444422', color: '#EF4444' }
                                : { background: '#10B98122', color: '#10B981' }
                              }
                              title={sub.is_active ? 'Unsubscribe' : 'Reactivate'}
                              disabled={busy}
                            >
                              {busy ? (
                                <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
                              ) : (
                                <FontAwesomeIcon icon={sub.is_active ? faTimes : faCheck} className="w-3 h-3" />
                              )}
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => deleteSub(sub)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80"
                              style={{ background: '#EF444422', color: '#EF4444' }}
                              title="Delete"
                              disabled={busy}
                            >
                              <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
