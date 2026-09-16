'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faPencil, faTrash, faSpinner, faCheck, faTimes, faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import AdminLayout from '@/components/AdminLayout';

const BRAND_COLORS = { tropicalTeal: '#139EA2', sandyOrange: '#E6A64D' };

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface Destination {
  id: string;
  country_name: string;
  slug: string;
  flag: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

interface Scholarship {
  id: string;
  destination_id: string;
  title: string;
  slug: string;
  level: 'bachelor' | 'master' | 'phd' | 'all';
  description: string;
  deadline: string;
  amount: string;
  is_featured: boolean;
  is_active: boolean;
}

type DestForm = Omit<Destination, 'id'>;
type ScholarForm = Omit<Scholarship, 'id'>;

const EMPTY_DEST: DestForm = {
  country_name: '', slug: '', flag: '', description: '', image_url: '', is_active: true,
};

const EMPTY_SCHOLAR: ScholarForm = {
  destination_id: '', title: '', slug: '', level: 'all',
  description: '', deadline: '', amount: '', is_featured: false, is_active: true,
};

const LEVEL_LABELS: Record<Scholarship['level'], string> = {
  bachelor: 'Bachelor', master: 'Master', phd: 'PhD', all: 'All Levels',
};

const LEVEL_COLORS: Record<Scholarship['level'], { bg: string; fg: string }> = {
  bachelor: { bg: '#3B82F622', fg: '#3B82F6' },
  master:   { bg: '#8B5CF622', fg: '#8B5CF6' },
  phd:      { bg: '#EC489922', fg: '#EC4899' },
  all:      { bg: '#10B98122', fg: '#10B981' },
};

export default function AdminStudyPage() {
  const { isDimMode } = useTheme();
  const [tab, setTab] = useState<'destinations' | 'scholarships'>('destinations');

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#111827',
    textSecondary: isDimMode ? '#B0B0B0' : '#4B5563',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    inputBg: isDimMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    inputBorder: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
  };

  const inputClass = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2';
  const inputStyle = {
    background: themeStyles.inputBg,
    border: `1px solid ${themeStyles.inputBorder}`,
    color: themeStyles.textPrimary,
  };
  const labelStyle = { color: themeStyles.textSecondary, fontSize: '0.75rem', fontWeight: 600 } as const;

  return (
    <AdminLayout title="Study Abroad" subtitle="Manage study destinations and scholarships">
      <div className="space-y-4">
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: themeStyles.inputBg, border: `1px solid ${themeStyles.border}` }}>
          {(['destinations', 'scholarships'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition"
              style={tab === t ? { background: BRAND_COLORS.tropicalTeal, color: '#FFFFFF' } : { color: themeStyles.textSecondary }}
            >
              {t === 'destinations' ? 'Destinations' : 'Scholarships'}
            </button>
          ))}
        </div>

        {tab === 'destinations'
          ? <DestinationsTab themeStyles={themeStyles} isDimMode={isDimMode} inputClass={inputClass} inputStyle={inputStyle} labelStyle={labelStyle} />
          : <ScholarshipsTab themeStyles={themeStyles} isDimMode={isDimMode} inputClass={inputClass} inputStyle={inputStyle} labelStyle={labelStyle} />
        }
      </div>
    </AdminLayout>
  );
}

interface TabProps {
  themeStyles: {
    cardBg: string; textPrimary: string; textSecondary: string;
    textMuted: string; border: string; inputBg: string; inputBorder: string;
  };
  isDimMode: boolean;
  inputClass: string;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
}

function DestinationsTab({ themeStyles, isDimMode, inputClass, inputStyle, labelStyle }: TabProps) {
  const [rows, setRows] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DestForm>(EMPTY_DEST);

  const fetchRows = useCallback(async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase.from('study_destinations').select('id, country_name, slug, flag, description, image_url, is_active').order('country_name');
    setRows((data as Destination[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  function openAdd() { setEditingId(null); setForm(EMPTY_DEST); setModalOpen(true); }
  function openEdit(r: Destination) {
    setEditingId(r.id);
    const { id, ...rest } = r; // eslint-disable-line @typescript-eslint/no-unused-vars
    setForm(rest);
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditingId(null); setForm(EMPTY_DEST); }

  function handleCountryName(value: string) {
    setForm((f) => ({ ...f, country_name: value, slug: editingId ? f.slug : toSlug(value) }));
  }

  async function handleSave() {
    if (!form.country_name.trim()) return;
    setSaving(true);
    const supabase = createBrowserClient();
    const payload = {
      country_name: form.country_name.trim(),
      slug: form.slug.trim() || toSlug(form.country_name),
      flag: form.flag,
      description: form.description,
      image_url: form.image_url,
      is_active: form.is_active,
    };
    if (editingId) {
      await supabase.from('study_destinations').update(payload).eq('id', editingId);
    } else {
      await supabase.from('study_destinations').insert(payload);
    }
    setSaving(false);
    closeModal();
    setLoading(true);
    fetchRows();
  }

  async function handleDelete(r: Destination) {
    if (!window.confirm(`Delete "${r.country_name}"? This cannot be undone.`)) return;
    const supabase = createBrowserClient();
    await supabase.from('study_destinations').delete().eq('id', r.id);
    setLoading(true);
    fetchRows();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: themeStyles.textMuted }}>
          {rows.length} destination{rows.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90"
          style={{ background: BRAND_COLORS.tropicalTeal }}
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          Add Destination
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 animate-spin" style={{ color: BRAND_COLORS.tropicalTeal }} />
          </div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-center" style={{ color: themeStyles.textMuted }}>No destinations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: themeStyles.border }}>
                  {['Country', 'Flag', 'Slug', 'Active', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: themeStyles.textMuted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0 transition hover:bg-black/5" style={{ borderColor: themeStyles.border }}>
                    <td className="px-4 py-3 font-medium" style={{ color: themeStyles.textPrimary }}>{r.country_name}</td>
                    <td className="px-4 py-3 text-xl">{r.flag}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: themeStyles.textMuted }}>{r.slug}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={r.is_active
                          ? { background: '#10B98122', color: '#10B981' }
                          : { background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6', color: themeStyles.textMuted }
                        }
                      >
                        <FontAwesomeIcon icon={r.is_active ? faCheck : faTimes} className="w-2.5 h-2.5" />
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(r)} className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80" style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}>
                          <FontAwesomeIcon icon={faPencil} className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDelete(r)} className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80" style={{ background: '#EF444422', color: '#EF4444' }}>
                          <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10" style={{ borderColor: themeStyles.border, background: themeStyles.cardBg }}>
              <h2 className="text-base font-bold" style={{ color: themeStyles.textPrimary }}>{editingId ? 'Edit Destination' : 'Add Destination'}</h2>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-70" style={{ background: themeStyles.inputBg, color: themeStyles.textMuted }}>
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label style={labelStyle}>Country Name <span style={{ color: '#EF4444' }}>*</span></label>
                  <input className={inputClass} style={inputStyle} value={form.country_name} onChange={(e) => handleCountryName(e.target.value)} placeholder="e.g. United Kingdom" />
                </div>
                <div className="space-y-1">
                  <label style={labelStyle}>Slug</label>
                  <input className={inputClass} style={inputStyle} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" />
                </div>
              </div>

              <div className="space-y-1">
                <label style={labelStyle}>Flag (emoji)</label>
                <input className={inputClass} style={inputStyle} value={form.flag} onChange={(e) => setForm((f) => ({ ...f, flag: e.target.value }))} placeholder="🇬🇧" />
              </div>

              <div className="space-y-1">
                <label style={labelStyle}>Description</label>
                <textarea className={inputClass} style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description..." />
              </div>

              <div className="space-y-1">
                <label style={labelStyle}>Image URL</label>
                <input className={inputClass} style={inputStyle} value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  className="w-4 h-4 rounded flex items-center justify-center transition"
                  style={{ background: form.is_active ? BRAND_COLORS.tropicalTeal : themeStyles.inputBg, border: `1px solid ${form.is_active ? BRAND_COLORS.tropicalTeal : themeStyles.inputBorder}` }}
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                >
                  {form.is_active && <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className="text-sm" style={{ color: themeStyles.textSecondary }}>Active</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: themeStyles.border }}>
              <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-70" style={{ background: themeStyles.inputBg, color: themeStyles.textSecondary }}>Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.country_name.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: BRAND_COLORS.tropicalTeal }}
              >
                {saving && <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Destination'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ScholarshipsTab({ themeStyles, isDimMode, inputClass, inputStyle, labelStyle }: TabProps) {
  const [rows, setRows] = useState<Scholarship[]>([]);
  const [destinations, setDestinations] = useState<Pick<Destination, 'id' | 'country_name'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScholarForm>(EMPTY_SCHOLAR);

  const fetchRows = useCallback(async () => {
    const supabase = createBrowserClient();
    const [{ data: schols }, { data: dests }] = await Promise.all([
      supabase.from('scholarships').select('id, destination_id, title, slug, level, description, deadline, amount, is_featured, is_active').order('title'),
      supabase.from('study_destinations').select('id, country_name').order('country_name'),
    ]);
    setRows((schols as Scholarship[]) ?? []);
    setDestinations((dests as Pick<Destination, 'id' | 'country_name'>[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  function openAdd() { setEditingId(null); setForm(EMPTY_SCHOLAR); setModalOpen(true); }
  function openEdit(r: Scholarship) {
    setEditingId(r.id);
    const { id, ...rest } = r; // eslint-disable-line @typescript-eslint/no-unused-vars
    setForm(rest);
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditingId(null); setForm(EMPTY_SCHOLAR); }

  function handleTitle(value: string) {
    setForm((f) => ({ ...f, title: value, slug: editingId ? f.slug : toSlug(value) }));
  }

  function formatDeadline(d: string) {
    if (!d) return 'Open';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async function handleSave() {
    if (!form.title.trim() || !form.destination_id) return;
    setSaving(true);
    const supabase = createBrowserClient();
    const payload = {
      destination_id: form.destination_id,
      title: form.title.trim(),
      slug: form.slug.trim() || toSlug(form.title),
      level: form.level,
      description: form.description,
      deadline: form.deadline || new Date().toISOString().slice(0, 10),
      amount: form.amount,
      is_featured: form.is_featured,
      is_active: form.is_active,
    };
    if (editingId) {
      await supabase.from('scholarships').update(payload).eq('id', editingId);
    } else {
      await supabase.from('scholarships').insert(payload);
    }
    setSaving(false);
    closeModal();
    setLoading(true);
    fetchRows();
  }

  async function handleDelete(r: Scholarship) {
    if (!window.confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
    const supabase = createBrowserClient();
    await supabase.from('scholarships').delete().eq('id', r.id);
    setLoading(true);
    fetchRows();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: themeStyles.textMuted }}>
          {rows.length} scholarship{rows.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90"
          style={{ background: BRAND_COLORS.tropicalTeal }}
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          Add Scholarship
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 animate-spin" style={{ color: BRAND_COLORS.tropicalTeal }} />
          </div>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-center" style={{ color: themeStyles.textMuted }}>No scholarships yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: themeStyles.border }}>
                  {['Title', 'Level', 'Deadline', 'Active', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: themeStyles.textMuted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const lc = LEVEL_COLORS[r.level];
                  return (
                    <tr key={r.id} className="border-b last:border-b-0 transition hover:bg-black/5" style={{ borderColor: themeStyles.border }}>
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: themeStyles.textPrimary }}>{r.title}</p>
                        <p className="text-xs" style={{ color: themeStyles.textMuted }}>{r.amount || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: lc.bg, color: lc.fg }}>
                          {LEVEL_LABELS[r.level]}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: themeStyles.textSecondary }}>{formatDeadline(r.deadline)}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={r.is_active
                            ? { background: '#10B98122', color: '#10B981' }
                            : { background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6', color: themeStyles.textMuted }
                          }
                        >
                          <FontAwesomeIcon icon={r.is_active ? faCheck : faTimes} className="w-2.5 h-2.5" />
                          {r.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(r)} className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80" style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}>
                            <FontAwesomeIcon icon={faPencil} className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDelete(r)} className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80" style={{ background: '#EF444422', color: '#EF4444' }}>
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10" style={{ borderColor: themeStyles.border, background: themeStyles.cardBg }}>
              <h2 className="text-base font-bold" style={{ color: themeStyles.textPrimary }}>{editingId ? 'Edit Scholarship' : 'Add Scholarship'}</h2>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-70" style={{ background: themeStyles.inputBg, color: themeStyles.textMuted }}>
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label style={labelStyle}>Title <span style={{ color: '#EF4444' }}>*</span></label>
                  <input className={inputClass} style={inputStyle} value={form.title} onChange={(e) => handleTitle(e.target.value)} placeholder="e.g. Commonwealth Scholarship" />
                </div>
                <div className="space-y-1">
                  <label style={labelStyle}>Slug</label>
                  <input className={inputClass} style={inputStyle} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" />
                </div>
              </div>

              <div className="space-y-1">
                <label style={labelStyle}>Destination <span style={{ color: '#EF4444' }}>*</span></label>
                <select className={inputClass} style={inputStyle} value={form.destination_id} onChange={(e) => setForm((f) => ({ ...f, destination_id: e.target.value }))}>
                  <option value="">Select destination…</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>{d.country_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label style={labelStyle}>Description</label>
                <textarea className={inputClass} style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label style={labelStyle}>Level</label>
                  <select className={inputClass} style={inputStyle} value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as Scholarship['level'] }))}>
                    <option value="all">All Levels</option>
                    <option value="bachelor">Bachelor</option>
                    <option value="master">Master</option>
                    <option value="phd">PhD</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label style={labelStyle}>Deadline <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="date" className={inputClass} style={inputStyle} value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1">
                <label style={labelStyle}>Amount (free text)</label>
                <input className={inputClass} style={inputStyle} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="e.g. Full tuition" />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center transition"
                    style={{ background: form.is_active ? BRAND_COLORS.tropicalTeal : themeStyles.inputBg, border: `1px solid ${form.is_active ? BRAND_COLORS.tropicalTeal : themeStyles.inputBorder}` }}
                    onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  >
                    {form.is_active && <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="text-sm" style={{ color: themeStyles.textSecondary }}>Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center transition"
                    style={{ background: form.is_featured ? BRAND_COLORS.sandyOrange : themeStyles.inputBg, border: `1px solid ${form.is_featured ? BRAND_COLORS.sandyOrange : themeStyles.inputBorder}` }}
                    onClick={() => setForm((f) => ({ ...f, is_featured: !f.is_featured }))}
                  >
                    {form.is_featured && <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="text-sm" style={{ color: themeStyles.textSecondary }}>Featured</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: themeStyles.border }}>
              <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-70" style={{ background: themeStyles.inputBg, color: themeStyles.textSecondary }}>Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.destination_id}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: BRAND_COLORS.tropicalTeal }}
              >
                {saving && <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Scholarship'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
