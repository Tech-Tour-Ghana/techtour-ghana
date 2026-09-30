'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faPencil, faTrash, faSpinner, faCheck, } from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import UrlWithPicker from '@/components/admin/UrlWithPicker';
import { useTheme } from '@/context/ThemeContext';
import AdminLayout from '@/components/AdminLayout';
import { Button, IconButton, Modal, SearchInput, StatusPill, TableCard, Tabs, Toolbar, confirmAction, reportError, rowClass, type Tone } from '@/components/admin/ui';

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

const LEVEL_TONE: Record<Scholarship['level'], Tone> = { bachelor: 'info', master: 'warning', phd: 'danger', all: 'success' };

export default function AdminStudyPage() {
  const { isDimMode } = useTheme();
  const [tab, setTab] = useState<'destinations' | 'scholarships'>('destinations');

  const themeStyles = {
    cardBg: 'var(--adm-card)',
    textPrimary: 'var(--adm-text)',
    textSecondary: 'var(--adm-text-2)',
    textMuted: 'var(--adm-muted)',
    border: 'var(--adm-border)',
    inputBg: 'var(--adm-bg)',
    inputBorder: 'var(--adm-border)',
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
        <Tabs value={tab} onChange={setTab} tabs={[{ key: 'destinations' as const, label: 'Destinations' }, { key: 'scholarships' as const, label: 'Scholarships' }]} />

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

function DestinationsTab({ themeStyles, inputClass, inputStyle, labelStyle }: TabProps) {
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
      if (reportError((await supabase.from('study_destinations').update(payload).eq('id', editingId)).error)) { setSaving(false); return; }
    } else {
      if (reportError((await supabase.from('study_destinations').insert(payload)).error)) { setSaving(false); return; }
    }
    setSaving(false);
    closeModal();
    setLoading(true);
    fetchRows();
  }

  async function handleDelete(r: Destination) {
    if (!(await confirmAction({ message: `Delete "${r.country_name}"? This cannot be undone.`, danger: true }))) return;
    const supabase = createBrowserClient();
    if (reportError((await supabase.from('study_destinations').delete().eq('id', r.id)).error)) { return; }
    setLoading(true);
    fetchRows();
  }

  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const visible = rows.filter((r) => !q || String(r.country_name).toLowerCase().includes(q));

  return (
    <>
      <Toolbar
        actions={<Button onClick={openAdd}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add destination</Button>}
      >
        <SearchInput className="min-w-[12rem] flex-1 sm:max-w-xs" value={search} onChange={setSearch} placeholder="Search destinations" label="Search destinations" />
        <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>{visible.length} of {rows.length}</span>
      </Toolbar>

      <TableCard loading={loading} empty={visible.length === 0} emptyTitle={rows.length === 0 ? 'No destinations yet' : 'No destinations match'} headers={['Country', 'Slug', 'Status', '']}>
        {visible.map((r) => (
          <tr key={r.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl leading-none" aria-hidden>{r.flag}</span>
                <span className="font-medium" style={{ color: 'var(--adm-text)' }}>{r.country_name}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-muted)' }}>{r.slug}</td>
            <td className="px-4 py-3"><StatusPill tone={r.is_active ? 'success' : 'neutral'}>{r.is_active ? 'Active' : 'Inactive'}</StatusPill></td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <IconButton title="Edit" onClick={() => openEdit(r)}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                <IconButton title="Delete" color="var(--adm-error)" onClick={() => handleDelete(r)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
              </div>
            </td>
          </tr>
        ))}
      </TableCard>

      {modalOpen && (
        <Modal title={editingId ? 'Edit Destination' : 'Add Destination'} maxWidth="max-w-lg" onClose={() => closeModal()}
          footer={
            <>
              <Button variant="secondary" onClick={closeModal}>
Cancel
</Button>
              <Button onClick={handleSave} disabled={saving || !form.country_name.trim()}>
{saving && <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Destination'}
</Button>
            
            </>
          }
        >
<div className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label style={labelStyle}>Country Name <span style={{ color: 'var(--adm-error)' }}>*</span></label>
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
                <UrlWithPicker inputStyle={inputStyle} value={form.image_url} onChange={v => setForm(f => ({ ...f, image_url: v }))} />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  className="w-4 h-4 rounded flex items-center justify-center transition"
                  style={{ background: form.is_active ? 'var(--adm-primary)' : themeStyles.inputBg, border: `1px solid ${form.is_active ? 'var(--adm-primary)' : themeStyles.inputBorder}` }}
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                >
                  {form.is_active && <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className="text-sm" style={{ color: themeStyles.textSecondary }}>Active</span>
              </label>
            </div>

            
          
</div>
        </Modal>
      )}
    </>
  );
}

function ScholarshipsTab({ themeStyles, inputClass, inputStyle, labelStyle }: TabProps) {
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
      if (reportError((await supabase.from('scholarships').update(payload).eq('id', editingId)).error)) { setSaving(false); return; }
    } else {
      if (reportError((await supabase.from('scholarships').insert(payload)).error)) { setSaving(false); return; }
    }
    setSaving(false);
    closeModal();
    setLoading(true);
    fetchRows();
  }

  async function handleDelete(r: Scholarship) {
    if (!(await confirmAction({ message: `Delete "${r.title}"? This cannot be undone.`, danger: true }))) return;
    const supabase = createBrowserClient();
    if (reportError((await supabase.from('scholarships').delete().eq('id', r.id)).error)) { return; }
    setLoading(true);
    fetchRows();
  }

  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const visible = rows.filter((r) => !q || String(r.title).toLowerCase().includes(q));

  return (
    <>
      <Toolbar
        actions={<Button onClick={openAdd}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add scholarship</Button>}
      >
        <SearchInput className="min-w-[12rem] flex-1 sm:max-w-xs" value={search} onChange={setSearch} placeholder="Search scholarships" label="Search scholarships" />
        <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>{visible.length} of {rows.length}</span>
      </Toolbar>

      <TableCard loading={loading} empty={visible.length === 0} emptyTitle={rows.length === 0 ? 'No scholarships yet' : 'No scholarships match'} headers={['Scholarship', 'Level', 'Deadline', 'Status', '']}>
        {visible.map((r) => (
          <tr key={r.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
            <td className="px-4 py-3">
              <p className="font-medium" style={{ color: 'var(--adm-text)' }}>{r.title}</p>
              <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>{r.amount || '-'}</p>
            </td>
            <td className="px-4 py-3"><StatusPill tone={LEVEL_TONE[r.level]}>{LEVEL_LABELS[r.level]}</StatusPill></td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{formatDeadline(r.deadline)}</td>
            <td className="px-4 py-3"><StatusPill tone={r.is_active ? 'success' : 'neutral'}>{r.is_active ? 'Active' : 'Inactive'}</StatusPill></td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <IconButton title="Edit" onClick={() => openEdit(r)}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                <IconButton title="Delete" color="var(--adm-error)" onClick={() => handleDelete(r)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
              </div>
            </td>
          </tr>
        ))}
      </TableCard>

      {modalOpen && (
        <Modal title={editingId ? 'Edit Scholarship' : 'Add Scholarship'} maxWidth="max-w-2xl" onClose={() => closeModal()}
          footer={
            <>
              <Button variant="secondary" onClick={closeModal}>
Cancel
</Button>
              <Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.destination_id}>
{saving && <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Scholarship'}
</Button>
            
            </>
          }
        >
<div className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label style={labelStyle}>Title <span style={{ color: 'var(--adm-error)' }}>*</span></label>
                  <input className={inputClass} style={inputStyle} value={form.title} onChange={(e) => handleTitle(e.target.value)} placeholder="e.g. Commonwealth Scholarship" />
                </div>
                <div className="space-y-1">
                  <label style={labelStyle}>Slug</label>
                  <input className={inputClass} style={inputStyle} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" />
                </div>
              </div>

              <div className="space-y-1">
                <label style={labelStyle}>Destination <span style={{ color: 'var(--adm-error)' }}>*</span></label>
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
                  <label style={labelStyle}>Deadline <span style={{ color: 'var(--adm-error)' }}>*</span></label>
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
                    style={{ background: form.is_active ? 'var(--adm-primary)' : themeStyles.inputBg, border: `1px solid ${form.is_active ? 'var(--adm-primary)' : themeStyles.inputBorder}` }}
                    onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  >
                    {form.is_active && <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="text-sm" style={{ color: themeStyles.textSecondary }}>Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center transition"
                    style={{ background: form.is_featured ? 'var(--adm-accent)' : themeStyles.inputBg, border: `1px solid ${form.is_featured ? 'var(--adm-accent)' : themeStyles.inputBorder}` }}
                    onClick={() => setForm((f) => ({ ...f, is_featured: !f.is_featured }))}
                  >
                    {form.is_featured && <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="text-sm" style={{ color: themeStyles.textSecondary }}>Featured</span>
                </label>
              </div>
            </div>

            
          
</div>
        </Modal>
      )}
    </>
  );
}
