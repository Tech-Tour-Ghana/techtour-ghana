'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faPencil,
  faTrash,
  faUsers,
  faBriefcase,
  faTags,
  faTimes,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import AdminLayout from '@/components/AdminLayout';

const BRAND_COLORS = { tropicalTeal: '#139EA2', sandyOrange: '#E6A64D' };

const toSlug = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ─── Types ───────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  name: string;
  position: string;
  email: string;
  bio: string;
  image_path: string | null;
  linkedin: string;
  sort_order: number;
  is_active: boolean;
}

interface JobCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}

interface JobOpening {
  id: string;
  title: string;
  slug: string;
  category_id: string | null;
  location: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'remote';
  description: string;
  requirements: string;
  closing_date: string | null;
  is_active: boolean;
}

type Tab = 'team' | 'jobs' | 'categories';

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' },
] as const;

// ─── Blank forms ─────────────────────────────────────────────────────────────

const blankMember = (): Omit<TeamMember, 'id'> => ({
  name: '', position: '', email: '', bio: '', image_path: null,
  linkedin: '', sort_order: 0, is_active: true,
});

const blankCategory = (): Omit<JobCategory, 'id'> => ({
  name: '', slug: '', sort_order: 0, is_active: true,
});

const blankOpening = (): Omit<JobOpening, 'id'> => ({
  title: '', slug: '', category_id: null, location: '',
  employment_type: 'full_time', description: '', requirements: '',
  closing_date: null, is_active: true,
});

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminTeamPage() {
  const { isDimMode } = useTheme();
  const [tab, setTab] = useState<Tab>('team');

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [openings, setOpenings] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [memberModal, setMemberModal] = useState<{ open: boolean; data: Omit<TeamMember, 'id'>; id: string | null }>({ open: false, data: blankMember(), id: null });
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; data: Omit<JobCategory, 'id'>; id: string | null }>({ open: false, data: blankCategory(), id: null });
  const [openingModal, setOpeningModal] = useState<{ open: boolean; data: Omit<JobOpening, 'id'>; id: string | null }>({ open: false, data: blankOpening(), id: null });

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
    const [m, c, o] = await Promise.all([
      supabase.from('team_members').select('*').order('sort_order'),
      supabase.from('job_categories').select('*').order('name'),
      supabase.from('job_openings').select('*').order('title'),
    ]);
    setMembers((m.data ?? []) as TeamMember[]);
    setCategories((c.data ?? []) as JobCategory[]);
    setOpenings((o.data ?? []) as JobOpening[]);
    setLoading(false);
  }, []); // ponytail: supabase is stable ref, no dep needed

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Delete helpers ─────────────────────────────────────────────────────────

  const deleteMember = async (id: string, name: string) => {
    if (!window.confirm(`Delete team member "${name}"?`)) return;
    await supabase.from('team_members').delete().eq('id', id);
    fetchAll();
  };

  const deleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    await supabase.from('job_categories').delete().eq('id', id);
    fetchAll();
  };

  const deleteOpening = async (id: string, title: string) => {
    if (!window.confirm(`Delete job opening "${title}"?`)) return;
    await supabase.from('job_openings').delete().eq('id', id);
    fetchAll();
  };

  // ── Save helpers ───────────────────────────────────────────────────────────

  const saveMember = async () => {
    setSaving(true);
    const d = memberModal.data;
    if (memberModal.id) {
      await supabase.from('team_members').update(d).eq('id', memberModal.id);
    } else {
      await supabase.from('team_members').insert(d);
    }
    setSaving(false);
    setMemberModal({ open: false, data: blankMember(), id: null });
    fetchAll();
  };

  const saveCategory = async () => {
    setSaving(true);
    const d = categoryModal.data;
    if (categoryModal.id) {
      await supabase.from('job_categories').update(d).eq('id', categoryModal.id);
    } else {
      await supabase.from('job_categories').insert(d);
    }
    setSaving(false);
    setCategoryModal({ open: false, data: blankCategory(), id: null });
    fetchAll();
  };

  const saveOpening = async () => {
    setSaving(true);
    const d = openingModal.data;
    if (openingModal.id) {
      await supabase.from('job_openings').update(d).eq('id', openingModal.id);
    } else {
      await supabase.from('job_openings').insert(d);
    }
    setSaving(false);
    setOpeningModal({ open: false, data: blankOpening(), id: null });
    fetchAll();
  };

  // ── Shared UI bits ─────────────────────────────────────────────────────────

  const Badge = ({ active }: { active: boolean }) => (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: active ? '#10B98122' : '#EF444422', color: active ? '#10B981' : '#EF4444' }}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );

  const inputStyle: React.CSSProperties = {
    background: ts.inputBg,
    border: `1px solid ${ts.inputBorder}`,
    color: ts.textPrimary,
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 13,
    width: '100%',
    outline: 'none',
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
      <AdminLayout title="Team & Careers" subtitle="Manage team members and job openings">
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND_COLORS.tropicalTeal, borderTopColor: 'transparent' }} />
        </div>
      </AdminLayout>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof faUsers; count: number }[] = [
    { key: 'team', label: 'Team Members', icon: faUsers, count: members.length },
    { key: 'jobs', label: 'Job Openings', icon: faBriefcase, count: openings.length },
    { key: 'categories', label: 'Job Categories', icon: faTags, count: categories.length },
  ];

  return (
    <AdminLayout title="Team & Careers" subtitle="Manage team members and job openings">
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

        {/* ── Team Members ── */}
        {tab === 'team' && (
          <div className="rounded-xl overflow-hidden" style={{ background: ts.cardBg, border: `1px solid ${ts.border}` }}>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: ts.border }}>
              <h2 className="text-sm font-semibold" style={{ color: ts.textPrimary }}>Team Members</h2>
              <button
                onClick={() => setMemberModal({ open: true, data: blankMember(), id: null })}
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
                    {['Name', 'Position', 'Email', 'Order', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-2.5 text-left font-semibold" style={{ color: ts.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-8 text-center" style={{ color: ts.textMuted }}>No team members yet.</td></tr>
                  ) : members.map((m) => (
                    <tr key={m.id} style={{ borderBottom: `1px solid ${ts.border}` }} className="transition" onMouseEnter={e => (e.currentTarget.style.background = ts.rowHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-5 py-2.5 font-medium" style={{ color: ts.textPrimary }}>{m.name}</td>
                      <td className="px-5 py-2.5" style={{ color: ts.textSecondary }}>{m.position}</td>
                      <td className="px-5 py-2.5" style={{ color: ts.textSecondary }}>{m.email}</td>
                      <td className="px-5 py-2.5" style={{ color: ts.textSecondary }}>{m.sort_order}</td>
                      <td className="px-5 py-2.5"><Badge active={m.is_active} /></td>
                      <td className="px-5 py-2.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setMemberModal({ open: true, data: { name: m.name, position: m.position, email: m.email, bio: m.bio, image_path: m.image_path, linkedin: m.linkedin, sort_order: m.sort_order, is_active: m.is_active }, id: m.id })}
                            className="p-1.5 rounded-lg transition hover:opacity-80"
                            style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}
                          >
                            <FontAwesomeIcon icon={faPencil} className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteMember(m.id, m.name)}
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

        {/* ── Job Openings ── */}
        {tab === 'jobs' && (
          <div className="rounded-xl overflow-hidden" style={{ background: ts.cardBg, border: `1px solid ${ts.border}` }}>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: ts.border }}>
              <h2 className="text-sm font-semibold" style={{ color: ts.textPrimary }}>Job Openings</h2>
              <button
                onClick={() => setOpeningModal({ open: true, data: blankOpening(), id: null })}
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
                    {['Title', 'Location', 'Type', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-2.5 text-left font-semibold" style={{ color: ts.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {openings.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center" style={{ color: ts.textMuted }}>No job openings yet.</td></tr>
                  ) : openings.map((o) => (
                    <tr key={o.id} style={{ borderBottom: `1px solid ${ts.border}` }} className="transition" onMouseEnter={e => (e.currentTarget.style.background = ts.rowHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-5 py-2.5 font-medium" style={{ color: ts.textPrimary }}>{o.title}</td>
                      <td className="px-5 py-2.5" style={{ color: ts.textSecondary }}>{o.location}</td>
                      <td className="px-5 py-2.5" style={{ color: ts.textSecondary }}>{o.employment_type.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-2.5"><Badge active={o.is_active} /></td>
                      <td className="px-5 py-2.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setOpeningModal({ open: true, data: { title: o.title, slug: o.slug, category_id: o.category_id, location: o.location, employment_type: o.employment_type, description: o.description, requirements: o.requirements, closing_date: o.closing_date, is_active: o.is_active }, id: o.id })}
                            className="p-1.5 rounded-lg transition hover:opacity-80"
                            style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}
                          >
                            <FontAwesomeIcon icon={faPencil} className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteOpening(o.id, o.title)}
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

        {/* ── Job Categories ── */}
        {tab === 'categories' && (
          <div className="rounded-xl overflow-hidden" style={{ background: ts.cardBg, border: `1px solid ${ts.border}` }}>
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: ts.border }}>
              <h2 className="text-sm font-semibold" style={{ color: ts.textPrimary }}>Job Categories</h2>
              <button
                onClick={() => setCategoryModal({ open: true, data: blankCategory(), id: null })}
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
                    {['Name', 'Slug', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-2.5 text-left font-semibold" style={{ color: ts.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center" style={{ color: ts.textMuted }}>No categories yet.</td></tr>
                  ) : categories.map((c) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${ts.border}` }} className="transition" onMouseEnter={e => (e.currentTarget.style.background = ts.rowHover)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-5 py-2.5 font-medium" style={{ color: ts.textPrimary }}>{c.name}</td>
                      <td className="px-5 py-2.5 font-mono" style={{ color: ts.textMuted }}>{c.slug}</td>
                      <td className="px-5 py-2.5"><Badge active={c.is_active} /></td>
                      <td className="px-5 py-2.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCategoryModal({ open: true, data: { name: c.name, slug: c.slug, sort_order: c.sort_order, is_active: c.is_active }, id: c.id })}
                            className="p-1.5 rounded-lg transition hover:opacity-80"
                            style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}
                          >
                            <FontAwesomeIcon icon={faPencil} className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteCategory(c.id, c.name)}
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
          Modal: Team Member
      ═══════════════════════════════════════════════ */}
      {memberModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" style={{ background: ts.cardBg, border: `1px solid ${ts.border}` }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: ts.border }}>
              <h3 className="font-semibold text-sm" style={{ color: ts.textPrimary }}>
                {memberModal.id ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <button onClick={() => setMemberModal({ open: false, data: blankMember(), id: null })} style={{ color: ts.textMuted }}>
                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Name *">
                  <input style={inputStyle} value={memberModal.data.name} onChange={e => setMemberModal(s => ({ ...s, data: { ...s.data, name: e.target.value } }))} />
                </Field>
                <Field label="Position *">
                  <input style={inputStyle} value={memberModal.data.position} onChange={e => setMemberModal(s => ({ ...s, data: { ...s.data, position: e.target.value } }))} />
                </Field>
              </div>
              <Field label="Email">
                <input type="email" style={inputStyle} value={memberModal.data.email} onChange={e => setMemberModal(s => ({ ...s, data: { ...s.data, email: e.target.value } }))} />
              </Field>
              <Field label="Bio">
                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={memberModal.data.bio} onChange={e => setMemberModal(s => ({ ...s, data: { ...s.data, bio: e.target.value } }))} />
              </Field>
              <Field label="Image Path">
                <input style={inputStyle} value={memberModal.data.image_path ?? ''} onChange={e => setMemberModal(s => ({ ...s, data: { ...s.data, image_path: e.target.value || null } }))} />
              </Field>
              <Field label="LinkedIn URL">
                <input style={inputStyle} value={memberModal.data.linkedin} onChange={e => setMemberModal(s => ({ ...s, data: { ...s.data, linkedin: e.target.value } }))} />
              </Field>
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Sort Order">
                  <input type="number" style={inputStyle} value={memberModal.data.sort_order} onChange={e => setMemberModal(s => ({ ...s, data: { ...s.data, sort_order: Number(e.target.value) } }))} />
                </Field>
                <Field label="Active">
                  <div className="flex items-center gap-2 mt-1">
                    <input type="checkbox" id="m-active" checked={memberModal.data.is_active} onChange={e => setMemberModal(s => ({ ...s, data: { ...s.data, is_active: e.target.checked } }))} className="w-4 h-4 cursor-pointer" style={{ accentColor: BRAND_COLORS.tropicalTeal }} />
                    <label htmlFor="m-active" className="text-xs cursor-pointer" style={{ color: ts.textSecondary }}>Visible on site</label>
                  </div>
                </Field>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button onClick={() => setMemberModal({ open: false, data: blankMember(), id: null })} className="px-4 py-2 rounded-lg text-xs font-medium transition" style={{ background: ts.inputBg, color: ts.textSecondary, border: `1px solid ${ts.inputBorder}` }}>
                  Cancel
                </button>
                <button onClick={saveMember} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-60" style={{ background: BRAND_COLORS.tropicalTeal }}>
                  {saving && <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />}
                  {memberModal.id ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          Modal: Job Opening
      ═══════════════════════════════════════════════ */}
      {openingModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" style={{ background: ts.cardBg, border: `1px solid ${ts.border}` }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: ts.border }}>
              <h3 className="font-semibold text-sm" style={{ color: ts.textPrimary }}>
                {openingModal.id ? 'Edit Job Opening' : 'Add Job Opening'}
              </h3>
              <button onClick={() => setOpeningModal({ open: false, data: blankOpening(), id: null })} style={{ color: ts.textMuted }}>
                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <Field label="Title *">
                <input
                  style={inputStyle}
                  value={openingModal.data.title}
                  onChange={e => setOpeningModal(s => ({ ...s, data: { ...s.data, title: e.target.value, slug: toSlug(e.target.value) } }))}
                />
              </Field>
              <Field label="Slug (auto-generated)">
                <input style={{ ...inputStyle, color: ts.textMuted }} value={openingModal.data.slug} onChange={e => setOpeningModal(s => ({ ...s, data: { ...s.data, slug: e.target.value } }))} />
              </Field>
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Category">
                  <select
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={openingModal.data.category_id ?? ''}
                    onChange={e => setOpeningModal(s => ({ ...s, data: { ...s.data, category_id: e.target.value || null } }))}
                  >
                    <option value="">— None —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Employment Type">
                  <select
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={openingModal.data.employment_type}
                    onChange={e => setOpeningModal(s => ({ ...s, data: { ...s.data, employment_type: e.target.value as JobOpening['employment_type'] } }))}
                  >
                    {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Location">
                  <input style={inputStyle} value={openingModal.data.location} onChange={e => setOpeningModal(s => ({ ...s, data: { ...s.data, location: e.target.value } }))} />
                </Field>
                <Field label="Closing Date">
                  <input type="date" style={inputStyle} value={openingModal.data.closing_date ?? ''} onChange={e => setOpeningModal(s => ({ ...s, data: { ...s.data, closing_date: e.target.value || null } }))} />
                </Field>
              </div>
              <Field label="Description *">
                <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={openingModal.data.description} onChange={e => setOpeningModal(s => ({ ...s, data: { ...s.data, description: e.target.value } }))} />
              </Field>
              <Field label="Requirements">
                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={openingModal.data.requirements ?? ''} onChange={e => setOpeningModal(s => ({ ...s, data: { ...s.data, requirements: e.target.value } }))} />
              </Field>
              <Field label="Active">
                <div className="flex items-center gap-2 mt-1">
                  <input type="checkbox" id="o-active" checked={openingModal.data.is_active} onChange={e => setOpeningModal(s => ({ ...s, data: { ...s.data, is_active: e.target.checked } }))} className="w-4 h-4 cursor-pointer" style={{ accentColor: BRAND_COLORS.tropicalTeal }} />
                  <label htmlFor="o-active" className="text-xs cursor-pointer" style={{ color: ts.textSecondary }}>Visible on site</label>
                </div>
              </Field>
              <div className="flex justify-end gap-3 mt-2">
                <button onClick={() => setOpeningModal({ open: false, data: blankOpening(), id: null })} className="px-4 py-2 rounded-lg text-xs font-medium transition" style={{ background: ts.inputBg, color: ts.textSecondary, border: `1px solid ${ts.inputBorder}` }}>
                  Cancel
                </button>
                <button onClick={saveOpening} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-60" style={{ background: BRAND_COLORS.tropicalTeal }}>
                  {saving && <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />}
                  {openingModal.id ? 'Save Changes' : 'Add Opening'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          Modal: Job Category
      ═══════════════════════════════════════════════ */}
      {categoryModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: ts.cardBg, border: `1px solid ${ts.border}` }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: ts.border }}>
              <h3 className="font-semibold text-sm" style={{ color: ts.textPrimary }}>
                {categoryModal.id ? 'Edit Category' : 'Add Category'}
              </h3>
              <button onClick={() => setCategoryModal({ open: false, data: blankCategory(), id: null })} style={{ color: ts.textMuted }}>
                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <Field label="Name *">
                <input
                  style={inputStyle}
                  value={categoryModal.data.name}
                  onChange={e => setCategoryModal(s => ({ ...s, data: { ...s.data, name: e.target.value, slug: toSlug(e.target.value) } }))}
                />
              </Field>
              <Field label="Slug (auto-generated)">
                <input style={{ ...inputStyle, color: ts.textMuted }} value={categoryModal.data.slug} onChange={e => setCategoryModal(s => ({ ...s, data: { ...s.data, slug: e.target.value } }))} />
              </Field>
              <Field label="Sort Order">
                <input type="number" style={inputStyle} value={categoryModal.data.sort_order} onChange={e => setCategoryModal(s => ({ ...s, data: { ...s.data, sort_order: Number(e.target.value) } }))} />
              </Field>
              <Field label="Active">
                <div className="flex items-center gap-2 mt-1">
                  <input type="checkbox" id="c-active" checked={categoryModal.data.is_active} onChange={e => setCategoryModal(s => ({ ...s, data: { ...s.data, is_active: e.target.checked } }))} className="w-4 h-4 cursor-pointer" style={{ accentColor: BRAND_COLORS.tropicalTeal }} />
                  <label htmlFor="c-active" className="text-xs cursor-pointer" style={{ color: ts.textSecondary }}>Visible on site</label>
                </div>
              </Field>
              <div className="flex justify-end gap-3 mt-2">
                <button onClick={() => setCategoryModal({ open: false, data: blankCategory(), id: null })} className="px-4 py-2 rounded-lg text-xs font-medium transition" style={{ background: ts.inputBg, color: ts.textSecondary, border: `1px solid ${ts.inputBorder}` }}>
                  Cancel
                </button>
                <button onClick={saveCategory} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-60" style={{ background: BRAND_COLORS.tropicalTeal }}>
                  {saving && <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />}
                  {categoryModal.id ? 'Save Changes' : 'Add Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
