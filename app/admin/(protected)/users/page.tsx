'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner,
  faCheck,
  faTimes,
  faShieldHalved,
  faShield,
  faBan,
  faUnlock,
  faSearch,
  faInfoCircle,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import AdminLayout from '@/components/AdminLayout';

const BRAND_COLORS = { tropicalTeal: '#139EA2', sandyOrange: '#E6A64D' };

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const { isDimMode } = useTheme();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewUser, setViewUser] = useState<Profile | null>(null);

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#111827',
    textSecondary: isDimMode ? '#B0B0B0' : '#4B5563',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    inputBg: isDimMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    inputBorder: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
  };

  const fetchUsers = useCallback(async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone_number, is_admin, is_active, created_at')
      .order('created_at', { ascending: false });
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function toggleActive(user: Profile) {
    setTogglingId(user.id);
    const supabase = createBrowserClient();
    await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id);
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    if (viewUser?.id === user.id) setViewUser((v) => v ? { ...v, is_active: !v.is_active } : v);
    setTogglingId(null);
  }

  async function toggleAdmin(user: Profile) {
    const action = user.is_admin ? 'remove admin access from' : 'grant admin access to';
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'this user';
    if (!window.confirm(`Are you sure you want to ${action} ${name}?`)) return;
    setTogglingId(user.id);
    const supabase = createBrowserClient();
    await supabase.from('profiles').update({ is_admin: !user.is_admin }).eq('id', user.id);
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_admin: !u.is_admin } : u));
    if (viewUser?.id === user.id) setViewUser((v) => v ? { ...v, is_admin: !v.is_admin } : v);
    setTogglingId(null);
  }

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ').toLowerCase();
    return name.includes(q) || (u.email ?? '').toLowerCase().includes(q);
  });

  const fullName = (u: Profile) =>
    [u.first_name, u.last_name].filter(Boolean).join(' ') || '-';

  return (
    <AdminLayout title="Users" subtitle="Manage user accounts">
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm" style={{ color: themeStyles.textMuted }}>
            {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
          </p>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-64"
            style={{ background: themeStyles.inputBg, border: `1px solid ${themeStyles.inputBorder}` }}
          >
            <FontAwesomeIcon icon={faSearch} className="w-3.5 h-3.5 flex-shrink-0" style={{ color: themeStyles.textMuted }} />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: themeStyles.textPrimary }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ color: themeStyles.textMuted }}>
                <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 animate-spin" style={{ color: BRAND_COLORS.tropicalTeal }} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-center" style={{ color: themeStyles.textMuted }}>
              {search ? 'No users match your search.' : 'No users found.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: themeStyles.border }}>
                    {['Name', 'Email', 'Phone', 'Admin', 'Status', 'Joined', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: themeStyles.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const busy = togglingId === u.id;
                    return (
                      <tr
                        key={u.id}
                        className="border-b last:border-b-0 transition hover:bg-black/5"
                        style={{ borderColor: themeStyles.border }}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium" style={{ color: themeStyles.textPrimary }}>{fullName(u)}</p>
                        </td>
                        <td className="px-4 py-3" style={{ color: themeStyles.textSecondary }}>{u.email || '-'}</td>
                        <td className="px-4 py-3" style={{ color: themeStyles.textSecondary }}>{u.phone_number || '-'}</td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={u.is_admin
                              ? { background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }
                              : { background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6', color: themeStyles.textMuted }
                            }
                          >
                            <FontAwesomeIcon icon={u.is_admin ? faShieldHalved : faShield} className="w-2.5 h-2.5" />
                            {u.is_admin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={u.is_active
                              ? { background: '#10B98122', color: '#10B981' }
                              : { background: '#EF444422', color: '#EF4444' }
                            }
                          >
                            <FontAwesomeIcon icon={u.is_active ? faCheck : faTimes} className="w-2.5 h-2.5" />
                            {u.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: themeStyles.textMuted }}>
                          {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* View */}
                            <button
                              onClick={() => setViewUser(u)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80"
                              style={{ background: `${BRAND_COLORS.sandyOrange}22`, color: BRAND_COLORS.sandyOrange }}
                              title="View profile"
                              disabled={busy}
                            >
                              <FontAwesomeIcon icon={faInfoCircle} className="w-3 h-3" />
                            </button>
                            {/* Toggle admin */}
                            <button
                              onClick={() => toggleAdmin(u)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80"
                              style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}
                              title={u.is_admin ? 'Remove admin' : 'Make admin'}
                              disabled={busy}
                            >
                              {busy ? (
                                <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
                              ) : (
                                <FontAwesomeIcon icon={u.is_admin ? faShield : faShieldHalved} className="w-3 h-3" />
                              )}
                            </button>
                            {/* Toggle active */}
                            <button
                              onClick={() => toggleActive(u)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80"
                              style={u.is_active
                                ? { background: '#EF444422', color: '#EF4444' }
                                : { background: '#10B98122', color: '#10B981' }
                              }
                              title={u.is_active ? 'Suspend user' : 'Activate user'}
                              disabled={busy}
                            >
                              <FontAwesomeIcon icon={u.is_active ? faBan : faUnlock} className="w-3 h-3" />
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

      {/* Profile info modal */}
      {viewUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setViewUser(null); }}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl"
            style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: themeStyles.border }}>
              <h2 className="text-base font-bold" style={{ color: themeStyles.textPrimary }}>User Profile</h2>
              <button
                onClick={() => setViewUser(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-70"
                style={{ background: themeStyles.inputBg, color: themeStyles.textMuted }}
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {[
                { label: 'Name', value: fullName(viewUser) },
                { label: 'Email', value: viewUser.email || '-' },
                { label: 'Phone', value: viewUser.phone_number || '-' },
                { label: 'User ID', value: viewUser.id },
                { label: 'Role', value: viewUser.is_admin ? 'Admin' : 'User' },
                { label: 'Status', value: viewUser.is_active ? 'Active' : 'Suspended' },
                { label: 'Joined', value: new Date(viewUser.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm gap-4">
                  <span className="font-medium flex-shrink-0" style={{ color: themeStyles.textMuted }}>{label}</span>
                  <span className="text-right break-all" style={{ color: themeStyles.textPrimary }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: themeStyles.border }}>
              <button
                onClick={() => toggleAdmin(viewUser)}
                disabled={togglingId === viewUser.id}
                className="px-3 py-2 rounded-lg text-xs font-medium transition hover:opacity-80"
                style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}
              >
                {viewUser.is_admin ? 'Remove Admin' : 'Make Admin'}
              </button>
              <button
                onClick={() => toggleActive(viewUser)}
                disabled={togglingId === viewUser.id}
                className="px-3 py-2 rounded-lg text-xs font-medium transition hover:opacity-80"
                style={viewUser.is_active
                  ? { background: '#EF444422', color: '#EF4444' }
                  : { background: '#10B98122', color: '#10B981' }
                }
              >
                {viewUser.is_active ? 'Suspend User' : 'Activate User'}
              </button>
              <button
                onClick={() => setViewUser(null)}
                className="px-3 py-2 rounded-lg text-xs font-medium transition hover:opacity-70"
                style={{ background: themeStyles.inputBg, color: themeStyles.textSecondary }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
