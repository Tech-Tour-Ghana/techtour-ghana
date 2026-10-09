'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faPencil,
  faTrash,
  faUsers,
  faBriefcase,
  faTags,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import UrlWithPicker from '@/components/admin/UrlWithPicker';
import AdminLayout from '@/components/AdminLayout';
import { Avatar, Button, IconButton, ListSkeleton, Modal, SearchInput, StatusPill, TableCard, Tabs, Toolbar, confirmAction, reportError, rowClass } from '@/components/admin/ui';

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
  const [tab, setTab] = useState<Tab>('team');
  const [search, setSearch] = useState('');

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [openings, setOpenings] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [memberModal, setMemberModal] = useState<{ open: boolean; data: Omit<TeamMember, 'id'>; id: string | null }>({ open: false, data: blankMember(), id: null });
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; data: Omit<JobCategory, 'id'>; id: string | null }>({ open: false, data: blankCategory(), id: null });
  const [openingModal, setOpeningModal] = useState<{ open: boolean; data: Omit<JobOpening, 'id'>; id: string | null }>({ open: false, data: blankOpening(), id: null });

  const supabase = useMemo(() => createBrowserClient(), []);

  const ts = {
    cardBg: 'var(--adm-card)',
    textPrimary: 'var(--adm-text)',
    textSecondary: 'var(--adm-text-2)',
    textMuted: 'var(--adm-muted)',
    border: 'var(--adm-border)',
    inputBg: 'var(--adm-bg)',
    inputBorder: 'var(--adm-border)',
    rowHover: 'var(--adm-track)',
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
  }, [supabase]); // ponytail: supabase is stable ref, no dep needed

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Delete helpers ─────────────────────────────────────────────────────────

  const deleteMember = async (id: string, name: string) => {
    if (!(await confirmAction({ message: `Delete team member "${name}"?`, danger: true }))) return;
    if (reportError((await supabase.from('team_members').delete().eq('id', id)).error)) { return; }
    fetchAll();
  };

  const deleteCategory = async (id: string, name: string) => {
    if (!(await confirmAction({ message: `Delete category "${name}"?`, danger: true }))) return;
    if (reportError((await supabase.from('job_categories').delete().eq('id', id)).error)) { return; }
    fetchAll();
  };

  const deleteOpening = async (id: string, title: string) => {
    if (!(await confirmAction({ message: `Delete job opening "${title}"?`, danger: true }))) return;
    if (reportError((await supabase.from('job_openings').delete().eq('id', id)).error)) { return; }
    fetchAll();
  };

  // ── Save helpers ───────────────────────────────────────────────────────────

  const saveMember = async () => {
    setSaving(true);
    const d = memberModal.data;
    if (memberModal.id) {
      if (reportError((await supabase.from('team_members').update(d).eq('id', memberModal.id)).error)) { setSaving(false); return; }
    } else {
      if (reportError((await supabase.from('team_members').insert(d)).error)) { setSaving(false); return; }
    }
    setSaving(false);
    setMemberModal({ open: false, data: blankMember(), id: null });
    fetchAll();
  };

  const saveCategory = async () => {
    setSaving(true);
    const d = categoryModal.data;
    if (categoryModal.id) {
      if (reportError((await supabase.from('job_categories').update(d).eq('id', categoryModal.id)).error)) { setSaving(false); return; }
    } else {
      if (reportError((await supabase.from('job_categories').insert(d)).error)) { setSaving(false); return; }
    }
    setSaving(false);
    setCategoryModal({ open: false, data: blankCategory(), id: null });
    fetchAll();
  };

  const saveOpening = async () => {
    setSaving(true);
    const d = openingModal.data;
    if (openingModal.id) {
      if (reportError((await supabase.from('job_openings').update(d).eq('id', openingModal.id)).error)) { setSaving(false); return; }
    } else {
      if (reportError((await supabase.from('job_openings').insert(d)).error)) { setSaving(false); return; }
    }
    setSaving(false);
    setOpeningModal({ open: false, data: blankOpening(), id: null });
    fetchAll();
  };

  // ── Shared UI bits ─────────────────────────────────────────────────────────

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
        <ListSkeleton />
      </AdminLayout>
    );
  }

  const q = search.trim().toLowerCase();
  const has = (...t: (string | null | undefined)[]) => !q || t.some((x) => (x ?? '').toLowerCase().includes(q));
  const vMembers = members.filter((m) => has(m.name, m.position, m.email));
  const vOpenings = openings.filter((o) => has(o.title, o.location, o.employment_type));
  const vCategories = categories.filter((c) => has(c.name, c.slug));

  const tabs: { key: Tab; label: string; icon: typeof faUsers; count: number }[] = [
    { key: 'team', label: 'Team Members', icon: faUsers, count: members.length },
    { key: 'jobs', label: 'Job Openings', icon: faBriefcase, count: openings.length },
    { key: 'categories', label: 'Job Categories', icon: faTags, count: categories.length },
  ];

  return (
    <AdminLayout title="Team & Careers" subtitle="Manage team members and job openings">
      <Toolbar
        actions={
          <Button onClick={() => (tab === 'team' ? setMemberModal({ open: true, data: blankMember(), id: null }) : tab === 'jobs' ? setOpeningModal({ open: true, data: blankOpening(), id: null }) : setCategoryModal({ open: true, data: blankCategory(), id: null }))}>
            <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />{tab === 'team' ? 'Add member' : tab === 'jobs' ? 'Add opening' : 'Add category'}
          </Button>
        }
      >
        <Tabs value={tab} onChange={(t) => { setTab(t); setSearch(''); }} tabs={tabs.map((t) => ({ key: t.key, label: t.label, count: t.count }))} />
        <SearchInput className="min-w-[12rem] flex-1 sm:max-w-xs" value={search} onChange={setSearch} placeholder="Search" label="Search" />
      </Toolbar>

      {tab === 'team' && (
        <TableCard loading={false} empty={vMembers.length === 0} emptyTitle={members.length === 0 ? 'No team members yet' : 'No team members match'} headers={['Member', 'Email', 'Order', 'Status', '']}>
          {vMembers.map((m) => (
            <tr key={m.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} size={36} />
                  <div className="min-w-0">
                    <p className="truncate font-medium" style={{ color: 'var(--adm-text)' }}>{m.name}</p>
                    <p className="truncate text-xs" style={{ color: 'var(--adm-muted)' }}>{m.position}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{m.email}</td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{m.sort_order}</td>
              <td className="px-4 py-3"><StatusPill tone={m.is_active ? 'success' : 'neutral'}>{m.is_active ? 'Active' : 'Inactive'}</StatusPill></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="Edit" onClick={() => setMemberModal({ open: true, data: { name: m.name, position: m.position, email: m.email, bio: m.bio, image_path: m.image_path, linkedin: m.linkedin, sort_order: m.sort_order, is_active: m.is_active }, id: m.id })}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                  <IconButton title="Delete" color="var(--adm-error)" onClick={() => deleteMember(m.id, m.name)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      )}

      {tab === 'jobs' && (
        <TableCard loading={false} empty={vOpenings.length === 0} emptyTitle={openings.length === 0 ? 'No job openings yet' : 'No openings match'} headers={['Opening', 'Location', 'Type', 'Status', '']}>
          {vOpenings.map((o) => (
            <tr key={o.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--adm-text)' }}>{o.title}</td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{o.location}</td>
              <td className="px-4 py-3 text-xs capitalize" style={{ color: 'var(--adm-text-2)' }}>{o.employment_type.replace(/_/g, ' ')}</td>
              <td className="px-4 py-3"><StatusPill tone={o.is_active ? 'success' : 'neutral'}>{o.is_active ? 'Open' : 'Closed'}</StatusPill></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="Edit" onClick={() => setOpeningModal({ open: true, data: { title: o.title, slug: o.slug, category_id: o.category_id, location: o.location, employment_type: o.employment_type, description: o.description, requirements: o.requirements, closing_date: o.closing_date, is_active: o.is_active }, id: o.id })}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                  <IconButton title="Delete" color="var(--adm-error)" onClick={() => deleteOpening(o.id, o.title)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      )}

      {tab === 'categories' && (
        <TableCard loading={false} empty={vCategories.length === 0} emptyTitle={categories.length === 0 ? 'No categories yet' : 'No categories match'} headers={['Category', 'Slug', 'Status', '']}>
          {vCategories.map((c) => (
            <tr key={c.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--adm-text)' }}>{c.name}</td>
              <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--adm-muted)' }}>{c.slug}</td>
              <td className="px-4 py-3"><StatusPill tone={c.is_active ? 'success' : 'neutral'}>{c.is_active ? 'Active' : 'Inactive'}</StatusPill></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="Edit" onClick={() => setCategoryModal({ open: true, data: { name: c.name, slug: c.slug, sort_order: c.sort_order, is_active: c.is_active }, id: c.id })}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                  <IconButton title="Delete" color="var(--adm-error)" onClick={() => deleteCategory(c.id, c.name)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      )}

      {/* ═══════════════════════════════════════════════
          Modal: Team Member
      ═══════════════════════════════════════════════ */}
      {memberModal.open && (
        <Modal title={memberModal.id ? 'Edit Team Member' : 'Add Team Member'} maxWidth="max-w-lg" onClose={() => setMemberModal({ open: false, data: blankMember(), id: null })}
          footer={
            <>
                <Button variant="secondary" onClick={() => setMemberModal({ open: false, data: blankMember(), id: null })}>
Cancel
</Button>
                <Button onClick={saveMember} disabled={saving}>
{saving && <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />}
                  {memberModal.id ? 'Save Changes' : 'Add Member'}
</Button>
              
            </>
          }
        >
<div className="">
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
                <UrlWithPicker inputStyle={inputStyle} value={memberModal.data.image_path ?? ''} onChange={v => setMemberModal(s => ({ ...s, data: { ...s.data, image_path: v || null } }))} />
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
                    <input type="checkbox" id="m-active" checked={memberModal.data.is_active} onChange={e => setMemberModal(s => ({ ...s, data: { ...s.data, is_active: e.target.checked } }))} className="w-4 h-4 cursor-pointer" style={{ accentColor: 'var(--adm-primary)' }} />
                    <label htmlFor="m-active" className="text-xs cursor-pointer" style={{ color: ts.textSecondary }}>Visible on site</label>
                  </div>
                </Field>
              </div>
              
            
</div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════
          Modal: Job Opening
      ═══════════════════════════════════════════════ */}
      {openingModal.open && (
        <Modal title={openingModal.id ? 'Edit Job Opening' : 'Add Job Opening'} maxWidth="max-w-lg" onClose={() => setOpeningModal({ open: false, data: blankOpening(), id: null })}
          footer={
            <>
                <Button variant="secondary" onClick={() => setOpeningModal({ open: false, data: blankOpening(), id: null })}>
Cancel
</Button>
                <Button onClick={saveOpening} disabled={saving}>
{saving && <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />}
                  {openingModal.id ? 'Save Changes' : 'Add Opening'}
</Button>
              
            </>
          }
        >
<div className="">
              <Field label="Title *">
                <input
                  style={inputStyle}
                  value={openingModal.data.title}
                  onChange={e => setOpeningModal(s => ({ ...s, data: { ...s.data, title: e.target.value, slug: s.id ? s.data.slug : toSlug(e.target.value) } }))}
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
                    <option value="">None</option>
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
                  <input type="checkbox" id="o-active" checked={openingModal.data.is_active} onChange={e => setOpeningModal(s => ({ ...s, data: { ...s.data, is_active: e.target.checked } }))} className="w-4 h-4 cursor-pointer" style={{ accentColor: 'var(--adm-primary)' }} />
                  <label htmlFor="o-active" className="text-xs cursor-pointer" style={{ color: ts.textSecondary }}>Visible on site</label>
                </div>
              </Field>
              
            
</div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════
          Modal: Job Category
      ═══════════════════════════════════════════════ */}
      {categoryModal.open && (
        <Modal title={categoryModal.id ? 'Edit Category' : 'Add Category'} maxWidth="max-w-md" onClose={() => setCategoryModal({ open: false, data: blankCategory(), id: null })}
          footer={
            <>
                <Button variant="secondary" onClick={() => setCategoryModal({ open: false, data: blankCategory(), id: null })}>
Cancel
</Button>
                <Button onClick={saveCategory} disabled={saving}>
{saving && <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />}
                  {categoryModal.id ? 'Save Changes' : 'Add Category'}
</Button>
              
            </>
          }
        >
<div className="">
              <Field label="Name *">
                <input
                  style={inputStyle}
                  value={categoryModal.data.name}
                  onChange={e => setCategoryModal(s => ({ ...s, data: { ...s.data, name: e.target.value, slug: s.id ? s.data.slug : toSlug(e.target.value) } }))}
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
                  <input type="checkbox" id="c-active" checked={categoryModal.data.is_active} onChange={e => setCategoryModal(s => ({ ...s, data: { ...s.data, is_active: e.target.checked } }))} className="w-4 h-4 cursor-pointer" style={{ accentColor: 'var(--adm-primary)' }} />
                  <label htmlFor="c-active" className="text-xs cursor-pointer" style={{ color: ts.textSecondary }}>Visible on site</label>
                </div>
              </Field>
              
            
</div>
        </Modal>
      )}
    </AdminLayout>
  );
}
