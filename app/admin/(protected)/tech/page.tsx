'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faPencil,
  faTrash,
  faMicrochip,
  faCalendarAlt,
  faBookOpen,
  faTimes,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import UrlWithPicker from '@/components/admin/UrlWithPicker';
import { useTheme } from '@/context/ThemeContext';
import AdminLayout from '@/components/AdminLayout';

const BRAND_COLORS = { tropicalTeal: '#139EA2', sandyOrange: '#E6A64D' };

const toSlug = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ─── Types ────────────────────────────────────────────────────────────────────

interface TechInnovation {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: 'ai' | 'vr' | 'cloud' | 'mobile' | 'blockchain' | 'iot' | 'web3' | 'other';
  status: 'active' | 'development' | 'completed' | 'planned';
  icon: string;
  image_url: string;
  is_active: boolean;
}

interface TechEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_type: 'workshop' | 'hackathon' | 'seminar' | 'conference' | 'meetup' | 'webinar';
  starts_at: string;
  ends_at: string | null;
  location: string;
  is_active: boolean;
}

interface TechResource {
  id: string;
  title: string;
  slug: string;
  description: string;
  resource_type: 'article' | 'video' | 'tutorial' | 'tool' | 'course' | 'podcast';
  url: string;
  thumbnail_url: string;
  is_active: boolean;
}

type Tab = 'innovations' | 'events' | 'resources';

const CATEGORIES = [
  { value: 'ai', label: 'AI' },
  { value: 'vr', label: 'VR' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'blockchain', label: 'Blockchain' },
  { value: 'iot', label: 'IoT' },
  { value: 'web3', label: 'Web3' },
  { value: 'other', label: 'Other' },
] as const;

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'development', label: 'Development' },
  { value: 'completed', label: 'Completed' },
  { value: 'planned', label: 'Planned' },
] as const;

const EVENT_TYPES = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'conference', label: 'Conference' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'webinar', label: 'Webinar' },
] as const;

// ─── Blank forms ──────────────────────────────────────────────────────────────

const blankInnovation = (): Omit<TechInnovation, 'id'> => ({
  title: '', slug: '', description: '', category: 'ai', status: 'planned',
  icon: '', image_url: '', is_active: true,
});

const blankEvent = (): Omit<TechEvent, 'id'> => ({
  title: '', slug: '', description: '', event_type: 'meetup',
  starts_at: '', ends_at: null, location: '', is_active: true,
});

const blankResource = (): Omit<TechResource, 'id'> => ({
  title: '', slug: '', description: '', resource_type: 'article',
  url: '', thumbnail_url: '', is_active: true,
});

// ─── Category / status colour chips ──────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  ai: '#8B5CF6', vr: '#EC4899', cloud: '#3B82F6', mobile: '#F59E0B',
  blockchain: '#F97316', iot: '#10B981', web3: '#6366F1', other: '#6B7280',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981', development: BRAND_COLORS.sandyOrange,
  completed: '#3B82F6', planned: '#6B7280',
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminTechPage() {
  const { isDimMode } = useTheme();
  const [tab, setTab] = useState<Tab>('innovations');

  const [innovations, setInnovations] = useState<TechInnovation[]>([]);
  const [events, setEvents] = useState<TechEvent[]>([]);
  const [resources, setResources] = useState<TechResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [innovationModal, setInnovationModal] = useState<{ open: boolean; data: Omit<TechInnovation, 'id'>; id: string | null }>({ open: false, data: blankInnovation(), id: null });
  const [eventModal, setEventModal] = useState<{ open: boolean; data: Omit<TechEvent, 'id'>; id: string | null }>({ open: false, data: blankEvent(), id: null });
  const [resourceModal, setResourceModal] = useState<{ open: boolean; data: Omit<TechResource, 'id'>; id: string | null }>({ open: false, data: blankResource(), id: null });

  const supabase = createBrowserClient();

  const ts = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#111827',
    textSecondary: isDimMode ? '#B0B0B0' : '#4B5563',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    inputBg: isDimMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    inputBorder: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
    rowHover: isDimMode ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [inn, ev, res] = await Promise.all([
      supabase.from('tech_innovations').select('*').order('title'),
      supabase.from('tech_events').select('*').order('starts_at', { ascending: false }),
      supabase.from('tech_resources').select('*').order('title'),
    ]);
    setInnovations((inn.data ?? []) as unknown as TechInnovation[]);
    setEvents((ev.data ?? []) as unknown as TechEvent[]);
    setResources((res.data ?? []) as unknown as TechResource[]);
    setLoading(false);
  }, []); // ponytail: supabase ref is stable

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Delete helpers ─────────────────────────────────────────────────────────

  const deleteInnovation = async (id: string, title: string) => {
    if (!window.confirm(`Delete innovation "${title}"?`)) return;
    await supabase.from('tech_innovations').delete().eq('id', id);
    fetchAll();
  };

  const deleteEvent = async (id: string, title: string) => {
    if (!window.confirm(`Delete event "${title}"?`)) return;
    await supabase.from('tech_events').delete().eq('id', id);
    fetchAll();
  };

  const deleteResource = async (id: string, title: string) => {
    if (!window.confirm(`Delete resource "${title}"?`)) return;
    await supabase.from('tech_resources').delete().eq('id', id);
    fetchAll();
  };

  // ── Save helpers ───────────────────────────────────────────────────────────

  const saveInnovation = async () => {
    setSaving(true);
    const d = innovationModal.data;
    if (innovationModal.id) {
      await supabase.from('tech_innovations').update(d).eq('id', innovationModal.id);
    } else {
      await supabase.from('tech_innovations').insert(d);
    }
    setSaving(false);
    setInnovationModal({ open: false, data: blankInnovation(), id: null });
    fetchAll();
  };

  const saveEvent = async () => {
    setSaving(true);
    const d = eventModal.data;
    if (eventModal.id) {
      await supabase.from('tech_events').update(d).eq('id', eventModal.id);
    } else {
      await supabase.from('tech_events').insert(d);
    }
    setSaving(false);
    setEventModal({ open: false, data: blankEvent(), id: null });
    fetchAll();
  };

  const saveResource = async () => {
    setSaving(true);
    const d = resourceModal.data;
    if (resourceModal.id) {
      await supabase.from('tech_resources').update(d).eq('id', resourceModal.id);
    } else {
      await supabase.from('tech_resources').insert(d);
    }
    setSaving(false);
    setResourceModal({ open: false, data: blankResource(), id: null });
    fetchAll();
  };

  // ── Shared UI bits ─────────────────────────────────────────────────────────

  const Badge = ({ active }: { active: boolean }) => (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: active ? '#10B98122' : '#EF444422', color: active ? '#10B981' : '#EF4444' }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );

  const ColourChip = ({ label, color }: { label: string; color: string }) => (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize" style={{ background: `${color}22`, color }}>
      {label}
    </span>
  );

  const inputStyle: React.CSSProperties = {
    background: ts.inputBg, border: `1px solid ${ts.inputBorder}`, color: ts.textPrimary,
    borderRadius: 8, padding: '6px 10px', fontSize: 13, width: '100%', outline: 'none',
  };

  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: ts.textSecondary, marginBottom: 4, display: 'block' };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );

  if (loading) {
    return (
      <AdminLayout title="Tech Hub" subtitle="Manage tech innovations, events and resources">
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: BRAND_COLORS.tropicalTeal, borderTopColor: 'transparent' }} />
        </div>
      </AdminLayout>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof faMicrochip; count: number }[] = [
    { key: 'innovations', label: 'Innovations', icon: faMicrochip, count: innovations.length },
    { key: 'events', label: 'Events', icon: faCalendarAlt, count: events.length },
    { key: 'resources', label: 'Resources', icon: faBookOpen, count: resources.length },
  ];

  return (
    <AdminLayout title="Tech Hub" subtitle="Manage tech innovations, events and resources">
      <div className="space-y-5">

        {/* Tab bar */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
                style={{
                  background: active ? BRAND_COLORS.tropicalTeal : ts.cardBg,
                  color: active ? '#FFFFFF' : ts.textSecondary,
                  border: `1px solid ${active ? BRAND_COLORS.tropicalTeal : ts.border}`,
                }}
              >
                <FontAwesomeIcon icon={t.icon} className="w-3.5 h-3.5" />
                {t.label}
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: active ? 'rgba(255,255,255,0.25)' : `${BRAND_COLORS.tropicalTeal}22`, color: active ? '#fff' : BRAND_COLORS.tropicalTeal }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Innovations ── */}
        {tab === 'innovations' && (
          <div className="rounded-xl overflow-hidden" style={{ background: ts.cardBg, border: `1px solid ${ts.border}` }}>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: ts.border }}>
              <h2 className="text-sm font-semibold" style={{ color: ts.textPrimary }}>Tech Innovations</h2>
              <button
                onClick={() => setInnovationModal({ open: true, data: blankInnovation(), id: null })}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition hover:opacity-90"
                style={{ background: BRAND_COLORS.tropicalTeal }}
              >
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                Add New
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${ts.border}` }}>
                    {['Title', 'Category', 'Status', 'Visible', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-2.5 text-left font-semibold" style={{ color: ts.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {innovations.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center" style={{ color: ts.textMuted }}>No innovations yet.</td></tr>
                  ) : innovations.map((n) => (
                    <tr key={n.id} style={{ borderBottom: `1px solid ${ts.border}` }} className="transition" onMouseEnter={e => (e.currentTarget.style.background = ts.rowHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-5 py-2.5 font-medium" style={{ color: ts.textPrimary }}>{n.title}</td>
                      <td className="px-5 py-2.5"><ColourChip label={n.category} color={CATEGORY_COLORS[n.category] ?? '#6B7280'} /></td>
                      <td className="px-5 py-2.5"><ColourChip label={n.status} color={STATUS_COLORS[n.status] ?? '#6B7280'} /></td>
                      <td className="px-5 py-2.5"><Badge active={n.is_active} /></td>
                      <td className="px-5 py-2.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setInnovationModal({ open: true, data: { title: n.title, slug: n.slug, description: n.description, category: n.category, status: n.status, icon: n.icon, image_url: n.image_url, is_active: n.is_active }, id: n.id })}
                            className="p-1.5 rounded-lg transition hover:opacity-80"
                            style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}
                          >
                            <FontAwesomeIcon icon={faPencil} className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteInnovation(n.id, n.title)}
                            className="p-1.5 rounded-lg transition hover:opacity-80"
                            style={{ background: '#EF444422', color: '#EF4444' }}
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Events ── */}
        {tab === 'events' && (
          <div className="rounded-xl overflow-hidden" style={{ background: ts.cardBg, border: `1px solid ${ts.border}` }}>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: ts.border }}>
              <h2 className="text-sm font-semibold" style={{ color: ts.textPrimary }}>Tech Events</h2>
              <button
                onClick={() => setEventModal({ open: true, data: blankEvent(), id: null })}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition hover:opacity-90"
                style={{ background: BRAND_COLORS.tropicalTeal }}
              >
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                Add New
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${ts.border}` }}>
                    {['Title', 'Type', 'Start Date', 'Visible', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-2.5 text-left font-semibold" style={{ color: ts.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center" style={{ color: ts.textMuted }}>No events yet.</td></tr>
                  ) : events.map((ev) => (
                    <tr key={ev.id} style={{ borderBottom: `1px solid ${ts.border}` }} className="transition" onMouseEnter={e => (e.currentTarget.style.background = ts.rowHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-5 py-2.5 font-medium" style={{ color: ts.textPrimary }}>{ev.title}</td>
                      <td className="px-5 py-2.5" style={{ color: ts.textSecondary }}>{ev.event_type}</td>
                      <td className="px-5 py-2.5" style={{ color: ts.textSecondary }}>{ev.starts_at ?? '-'}</td>
                      <td className="px-5 py-2.5"><Badge active={ev.is_active} /></td>
                      <td className="px-5 py-2.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEventModal({ open: true, data: { title: ev.title, slug: ev.slug, description: ev.description, event_type: ev.event_type, starts_at: ev.starts_at, ends_at: ev.ends_at, location: ev.location, is_active: ev.is_active }, id: ev.id })}
                            className="p-1.5 rounded-lg transition hover:opacity-80"
                            style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}
                          >
                            <FontAwesomeIcon icon={faPencil} className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteEvent(ev.id, ev.title)}
                            className="p-1.5 rounded-lg transition hover:opacity-80"
                            style={{ background: '#EF444422', color: '#EF4444' }}
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Resources ── */}
        {tab === 'resources' && (
          <div className="rounded-xl overflow-hidden" style={{ background: ts.cardBg, border: `1px solid ${ts.border}` }}>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: ts.border }}>
              <h2 className="text-sm font-semibold" style={{ color: ts.textPrimary }}>Tech Resources</h2>
              <button
                onClick={() => setResourceModal({ open: true, data: blankResource(), id: null })}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition hover:opacity-90"
                style={{ background: BRAND_COLORS.tropicalTeal }}
              >
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                Add New
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${ts.border}` }}>
                    {['Title', 'Type', 'Visible', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-2.5 text-left font-semibold" style={{ color: ts.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resources.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center" style={{ color: ts.textMuted }}>No resources yet.</td></tr>
                  ) : resources.map((r) => (
                    <tr key={r.id} style={{ borderBottom: `1px solid ${ts.border}` }} className="transition" onMouseEnter={e => (e.currentTarget.style.background = ts.rowHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-5 py-2.5 font-medium" style={{ color: ts.textPrimary }}>{r.title}</td>
                      <td className="px-5 py-2.5" style={{ color: ts.textSecondary }}>{r.resource_type ?? '-'}</td>
                      <td className="px-5 py-2.5"><Badge active={r.is_active} /></td>
                      <td className="px-5 py-2.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setResourceModal({ open: true, data: { title: r.title, slug: r.slug, description: r.description, resource_type: r.resource_type, url: r.url, thumbnail_url: r.thumbnail_url, is_active: r.is_active }, id: r.id })}
                            className="p-1.5 rounded-lg transition hover:opacity-80"
                            style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}
                          >
                            <FontAwesomeIcon icon={faPencil} className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteResource(r.id, r.title)}
                            className="p-1.5 rounded-lg transition hover:opacity-80"
                            style={{ background: '#EF444422', color: '#EF4444' }}
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          Modal: Innovation
      ═══════════════════════════════════════════════ */}
      {innovationModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" style={{ background: ts.cardBg, border: `1px solid ${ts.border}` }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: ts.border }}>
              <h3 className="font-semibold text-sm" style={{ color: ts.textPrimary }}>
                {innovationModal.id ? 'Edit Innovation' : 'Add Innovation'}
              </h3>
              <button onClick={() => setInnovationModal({ open: false, data: blankInnovation(), id: null })} style={{ color: ts.textMuted }}>
                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <Field label="Title *">
                <input
                  style={inputStyle}
                  value={innovationModal.data.title}
                  onChange={e => setInnovationModal(s => ({ ...s, data: { ...s.data, title: e.target.value, slug: toSlug(e.target.value) } }))}
                />
              </Field>
              <Field label="Slug (auto-generated)">
                <input style={{ ...inputStyle, color: ts.textMuted }} value={innovationModal.data.slug} onChange={e => setInnovationModal(s => ({ ...s, data: { ...s.data, slug: e.target.value } }))} />
              </Field>
              <Field label="Description">
                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={innovationModal.data.description ?? ''} onChange={e => setInnovationModal(s => ({ ...s, data: { ...s.data, description: e.target.value } }))} />
              </Field>
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Category">
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={innovationModal.data.category} onChange={e => setInnovationModal(s => ({ ...s, data: { ...s.data, category: e.target.value as TechInnovation['category'] } }))}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={innovationModal.data.status} onChange={e => setInnovationModal(s => ({ ...s, data: { ...s.data, status: e.target.value as TechInnovation['status'] } }))}>
                    {STATUSES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Image URL">
                <UrlWithPicker inputStyle={inputStyle} value={innovationModal.data.image_url ?? ''} onChange={v => setInnovationModal(s => ({ ...s, data: { ...s.data, image_url: v } }))} />
              </Field>
              <Field label="Icon (emoji or CSS class)">
                <input style={inputStyle} value={innovationModal.data.icon ?? ''} onChange={e => setInnovationModal(s => ({ ...s, data: { ...s.data, icon: e.target.value } }))} />
              </Field>
              <Field label="Active">
                <div className="flex items-center gap-2 mt-1">
                  <input type="checkbox" id="inn-active" checked={innovationModal.data.is_active} onChange={e => setInnovationModal(s => ({ ...s, data: { ...s.data, is_active: e.target.checked } }))} className="w-4 h-4 cursor-pointer" style={{ accentColor: BRAND_COLORS.tropicalTeal }} />
                  <label htmlFor="inn-active" className="text-xs cursor-pointer" style={{ color: ts.textSecondary }}>Visible on site</label>
                </div>
              </Field>
              <div className="flex justify-end gap-3 mt-2">
                <button onClick={() => setInnovationModal({ open: false, data: blankInnovation(), id: null })} className="px-4 py-2 rounded-lg text-xs font-medium transition" style={{ background: ts.inputBg, color: ts.textSecondary, border: `1px solid ${ts.inputBorder}` }}>
                  Cancel
                </button>
                <button onClick={saveInnovation} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-60" style={{ background: BRAND_COLORS.tropicalTeal }}>
                  {saving && <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />}
                  {innovationModal.id ? 'Save Changes' : 'Add Innovation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          Modal: Event
      ═══════════════════════════════════════════════ */}
      {eventModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" style={{ background: ts.cardBg, border: `1px solid ${ts.border}` }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: ts.border }}>
              <h3 className="font-semibold text-sm" style={{ color: ts.textPrimary }}>
                {eventModal.id ? 'Edit Event' : 'Add Event'}
              </h3>
              <button onClick={() => setEventModal({ open: false, data: blankEvent(), id: null })} style={{ color: ts.textMuted }}>
                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <Field label="Title *">
                <input
                  style={inputStyle}
                  value={eventModal.data.title}
                  onChange={e => setEventModal(s => ({ ...s, data: { ...s.data, title: e.target.value, slug: toSlug(e.target.value) } }))}
                />
              </Field>
              <Field label="Slug (auto-generated)">
                <input style={{ ...inputStyle, color: ts.textMuted }} value={eventModal.data.slug} onChange={e => setEventModal(s => ({ ...s, data: { ...s.data, slug: e.target.value } }))} />
              </Field>
              <Field label="Description">
                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={eventModal.data.description ?? ''} onChange={e => setEventModal(s => ({ ...s, data: { ...s.data, description: e.target.value } }))} />
              </Field>
              <Field label="Event Type">
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={eventModal.data.event_type} onChange={e => setEventModal(s => ({ ...s, data: { ...s.data, event_type: e.target.value as TechEvent['event_type'] } }))}>
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Starts At">
                  <input type="datetime-local" style={inputStyle} value={eventModal.data.starts_at ?? ''} onChange={e => setEventModal(s => ({ ...s, data: { ...s.data, starts_at: e.target.value } }))} />
                </Field>
                <Field label="Ends At">
                  <input type="datetime-local" style={inputStyle} value={eventModal.data.ends_at ?? ''} onChange={e => setEventModal(s => ({ ...s, data: { ...s.data, ends_at: e.target.value } }))} />
                </Field>
              </div>
              <Field label="Location">
                <input style={inputStyle} value={eventModal.data.location ?? ''} onChange={e => setEventModal(s => ({ ...s, data: { ...s.data, location: e.target.value } }))} />
              </Field>
              <Field label="Active">
                <div className="flex items-center gap-2 mt-1">
                  <input type="checkbox" id="ev-active" checked={eventModal.data.is_active} onChange={e => setEventModal(s => ({ ...s, data: { ...s.data, is_active: e.target.checked } }))} className="w-4 h-4 cursor-pointer" style={{ accentColor: BRAND_COLORS.tropicalTeal }} />
                  <label htmlFor="ev-active" className="text-xs cursor-pointer" style={{ color: ts.textSecondary }}>Visible on site</label>
                </div>
              </Field>
              <div className="flex justify-end gap-3 mt-2">
                <button onClick={() => setEventModal({ open: false, data: blankEvent(), id: null })} className="px-4 py-2 rounded-lg text-xs font-medium transition" style={{ background: ts.inputBg, color: ts.textSecondary, border: `1px solid ${ts.inputBorder}` }}>
                  Cancel
                </button>
                <button onClick={saveEvent} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-60" style={{ background: BRAND_COLORS.tropicalTeal }}>
                  {saving && <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />}
                  {eventModal.id ? 'Save Changes' : 'Add Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          Modal: Resource
      ═══════════════════════════════════════════════ */}
      {resourceModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" style={{ background: ts.cardBg, border: `1px solid ${ts.border}` }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: ts.border }}>
              <h3 className="font-semibold text-sm" style={{ color: ts.textPrimary }}>
                {resourceModal.id ? 'Edit Resource' : 'Add Resource'}
              </h3>
              <button onClick={() => setResourceModal({ open: false, data: blankResource(), id: null })} style={{ color: ts.textMuted }}>
                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <Field label="Title *">
                <input
                  style={inputStyle}
                  value={resourceModal.data.title}
                  onChange={e => setResourceModal(s => ({ ...s, data: { ...s.data, title: e.target.value, slug: toSlug(e.target.value) } }))}
                />
              </Field>
              <Field label="Slug (auto-generated)">
                <input style={{ ...inputStyle, color: ts.textMuted }} value={resourceModal.data.slug} onChange={e => setResourceModal(s => ({ ...s, data: { ...s.data, slug: e.target.value } }))} />
              </Field>
              <Field label="Description">
                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={resourceModal.data.description ?? ''} onChange={e => setResourceModal(s => ({ ...s, data: { ...s.data, description: e.target.value } }))} />
              </Field>
              <Field label="Resource Type">
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={resourceModal.data.resource_type} onChange={e => setResourceModal(s => ({ ...s, data: { ...s.data, resource_type: e.target.value as TechResource['resource_type'] } }))}>
                  {['article','video','tutorial','tool','course','podcast'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="URL *">
                <input style={inputStyle} value={resourceModal.data.url ?? ''} onChange={e => setResourceModal(s => ({ ...s, data: { ...s.data, url: e.target.value } }))} />
              </Field>
              <Field label="Thumbnail URL">
                <UrlWithPicker inputStyle={inputStyle} value={resourceModal.data.thumbnail_url ?? ''} onChange={v => setResourceModal(s => ({ ...s, data: { ...s.data, thumbnail_url: v } }))} />
              </Field>
              <Field label="Active">
                <div className="flex items-center gap-2 mt-1">
                  <input type="checkbox" id="res-active" checked={resourceModal.data.is_active} onChange={e => setResourceModal(s => ({ ...s, data: { ...s.data, is_active: e.target.checked } }))} className="w-4 h-4 cursor-pointer" style={{ accentColor: BRAND_COLORS.tropicalTeal }} />
                  <label htmlFor="res-active" className="text-xs cursor-pointer" style={{ color: ts.textSecondary }}>Visible on site</label>
                </div>
              </Field>
              <div className="flex justify-end gap-3 mt-2">
                <button onClick={() => setResourceModal({ open: false, data: blankResource(), id: null })} className="px-4 py-2 rounded-lg text-xs font-medium transition" style={{ background: ts.inputBg, color: ts.textSecondary, border: `1px solid ${ts.inputBorder}` }}>
                  Cancel
                </button>
                <button onClick={saveResource} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-60" style={{ background: BRAND_COLORS.tropicalTeal }}>
                  {saving && <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />}
                  {resourceModal.id ? 'Save Changes' : 'Add Resource'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
