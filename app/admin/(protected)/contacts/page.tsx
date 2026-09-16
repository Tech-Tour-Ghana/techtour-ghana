'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner,
  faCheck,
  faEnvelopeOpen,
  faEnvelope,
  faTrash,
  faEye,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import AdminLayout from '@/components/AdminLayout';

const BRAND_COLORS = { tropicalTeal: '#139EA2', sandyOrange: '#E6A64D' };

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

type FilterTab = 'all' | 'unread' | 'read';

export default function AdminContactsPage() {
  const { isDimMode } = useTheme();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState<FilterTab>('all');
  const [viewMsg, setViewMsg] = useState<ContactMessage | null>(null);

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#111827',
    textSecondary: isDimMode ? '#B0B0B0' : '#4B5563',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    inputBg: isDimMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    inputBorder: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
  };

  const fetchMessages = useCallback(async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('contact_messages')
      .select('id, name, email, phone, subject, message, is_read, created_at')
      .order('created_at', { ascending: false });
    setMessages((data as ContactMessage[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  async function toggleRead(msg: ContactMessage) {
    setBusyId(msg.id);
    const supabase = createBrowserClient();
    await supabase
      .from('contact_messages')
      .update({ is_read: !msg.is_read })
      .eq('id', msg.id);
    setMessages((prev) =>
      prev.map((m) => m.id === msg.id ? { ...m, is_read: !m.is_read } : m)
    );
    if (viewMsg?.id === msg.id) setViewMsg((v) => v ? { ...v, is_read: !v.is_read } : v);
    setBusyId(null);
  }

  async function deleteMsg(msg: ContactMessage) {
    const from = msg.name || msg.email;
    if (!window.confirm(`Delete message from ${from}? This cannot be undone.`)) return;
    setBusyId(msg.id);
    const supabase = createBrowserClient();
    await supabase.from('contact_messages').delete().eq('id', msg.id);
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    if (viewMsg?.id === msg.id) setViewMsg(null);
    setBusyId(null);
  }

  const counts = {
    all: messages.length,
    unread: messages.filter((m) => !m.is_read).length,
    read: messages.filter((m) => m.is_read).length,
  };

  const filtered = tab === 'all' ? messages
    : tab === 'unread' ? messages.filter((m) => !m.is_read)
    : messages.filter((m) => m.is_read);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'read', label: 'Read' },
  ];

  return (
    <AdminLayout title="Contact Messages" subtitle="Inbox of contact form submissions">
      <div className="space-y-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {TABS.map(({ key, label }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition"
                style={{
                  background: active ? BRAND_COLORS.tropicalTeal : (isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6'),
                  color: active ? '#FFFFFF' : themeStyles.textSecondary,
                }}
              >
                {label}
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
                  style={{
                    background: active ? 'rgba(255,255,255,0.25)' : (isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB'),
                    color: active ? '#FFFFFF' : themeStyles.textMuted,
                  }}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 animate-spin" style={{ color: BRAND_COLORS.tropicalTeal }} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-center" style={{ color: themeStyles.textMuted }}>
              No messages found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: themeStyles.border }}>
                    {['Name', 'Email', 'Subject', 'Status', 'Date', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: themeStyles.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((msg) => {
                    const busy = busyId === msg.id;
                    return (
                      <tr
                        key={msg.id}
                        className="border-b last:border-b-0 transition hover:bg-black/5"
                        style={{ borderColor: themeStyles.border }}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium" style={{ color: themeStyles.textPrimary }}>{msg.name || '-'}</p>
                        </td>
                        <td className="px-4 py-3" style={{ color: themeStyles.textSecondary }}>{msg.email}</td>
                        <td className="px-4 py-3" style={{ color: themeStyles.textSecondary }}>
                          {msg.subject ? (msg.subject.length > 50 ? msg.subject.slice(0, 50) + '…' : msg.subject) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={msg.is_read
                              ? { background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6', color: themeStyles.textMuted }
                              : { background: `${BRAND_COLORS.sandyOrange}22`, color: BRAND_COLORS.sandyOrange }
                            }
                          >
                            <FontAwesomeIcon icon={msg.is_read ? faEnvelopeOpen : faEnvelope} className="w-2.5 h-2.5" />
                            {msg.is_read ? 'Read' : 'Unread'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: themeStyles.textMuted }}>
                          {fmtDate(msg.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* View */}
                            <button
                              onClick={() => setViewMsg(msg)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80"
                              style={{ background: `${BRAND_COLORS.sandyOrange}22`, color: BRAND_COLORS.sandyOrange }}
                              title="View message"
                              disabled={busy}
                            >
                              <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                            </button>
                            {/* Toggle read */}
                            <button
                              onClick={() => toggleRead(msg)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80"
                              style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}
                              title={msg.is_read ? 'Mark unread' : 'Mark read'}
                              disabled={busy}
                            >
                              {busy ? (
                                <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
                              ) : (
                                <FontAwesomeIcon icon={msg.is_read ? faEnvelope : faCheck} className="w-3 h-3" />
                              )}
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => deleteMsg(msg)}
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

      {/* Message detail modal */}
      {viewMsg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setViewMsg(null); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl shadow-2xl"
            style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: themeStyles.border }}>
              <h2 className="text-base font-bold" style={{ color: themeStyles.textPrimary }}>Message Details</h2>
              <button
                onClick={() => setViewMsg(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-70"
                style={{ background: themeStyles.inputBg, color: themeStyles.textMuted }}
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {[
                { label: 'Name', value: viewMsg.name || '-' },
                { label: 'Email', value: viewMsg.email },
                { label: 'Phone', value: viewMsg.phone || '-' },
                { label: 'Subject', value: viewMsg.subject || '-' },
                { label: 'Received', value: fmtDate(viewMsg.created_at) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm gap-4">
                  <span className="font-medium flex-shrink-0" style={{ color: themeStyles.textMuted }}>{label}</span>
                  <span className="text-right break-all" style={{ color: themeStyles.textPrimary }}>{value}</span>
                </div>
              ))}
              <div className="pt-2">
                <p className="text-xs font-medium mb-1" style={{ color: themeStyles.textMuted }}>Message</p>
                <p
                  className="text-sm whitespace-pre-wrap rounded-lg p-3"
                  style={{ background: themeStyles.inputBg, color: themeStyles.textPrimary, border: `1px solid ${themeStyles.inputBorder}` }}
                >
                  {viewMsg.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: themeStyles.border }}>
              <button
                onClick={() => toggleRead(viewMsg)}
                disabled={busyId === viewMsg.id}
                className="px-3 py-2 rounded-lg text-xs font-medium transition hover:opacity-80"
                style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}
              >
                {viewMsg.is_read ? 'Mark Unread' : 'Mark Read'}
              </button>
              <button
                onClick={() => deleteMsg(viewMsg)}
                disabled={busyId === viewMsg.id}
                className="px-3 py-2 rounded-lg text-xs font-medium transition hover:opacity-80"
                style={{ background: '#EF444422', color: '#EF4444' }}
              >
                Delete
              </button>
              <button
                onClick={() => setViewMsg(null)}
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
