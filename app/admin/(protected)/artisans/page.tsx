'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faPencil,
  faTrash,
  faSpinner,
  faStar,
  faCheck,
  faXmark,
  } from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import UrlWithPicker from '@/components/admin/UrlWithPicker';
import { Avatar, Button, IconButton, Modal, SearchInput, StatusPill, TableCard, Toolbar, confirmAction, reportError, rowClass } from '@/components/admin/ui';

interface Artisan {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  bio: string | null;
  location: string | null;
  craft_type: string | null;
  specialties: string | null;
  years_of_experience: number | null;
  email: string;
  phone: string;
  website: string;
  instagram: string;
  facebook: string;
  twitter: string;
  profile_image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number | null;
}

type FormData = Omit<Artisan, 'id'>;

// Contact details are private: they live in their own admin-only table so the
// public artisans page can never expose them.
const CONTACT_KEYS = ['email', 'phone', 'website', 'instagram', 'facebook', 'twitter'] as const;
type ContactKey = (typeof CONTACT_KEYS)[number];
const contactFields = (row?: Partial<Record<ContactKey, string>>): Record<ContactKey, string> =>
  Object.fromEntries(CONTACT_KEYS.map((k) => [k, row?.[k] ?? ''])) as Record<ContactKey, string>;

const EMPTY_FORM: FormData = {
  name: '',
  slug: '',
  title: '',
  bio: '',
  location: '',
  craft_type: '',
  specialties: '',
  years_of_experience: null,
  email: '',
  phone: '',
  website: '',
  instagram: '',
  facebook: '',
  twitter: '',
  profile_image_url: '',
  is_featured: false,
  is_active: true,
  sort_order: null,
};

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function AdminArtisansPage() {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [search, setSearch] = useState('');

  const themeStyles = {
    cardBg: 'var(--adm-card)',
    textPrimary: 'var(--adm-text)',
    textSecondary: 'var(--adm-text-2)',
    textMuted: 'var(--adm-muted)',
    border: 'var(--adm-border)',
    inputBg: 'var(--adm-bg)',
    inputBorder: 'var(--adm-border)',
  };

  const fetch = useCallback(async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('artisans')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });
    const { data: contacts } = await createBrowserClient().from('artisan_private_contacts').select('*');
    const byId = new Map((contacts ?? []).map((c) => [c.artisan_id, c]));
    setArtisans(((data ?? []) as Omit<Artisan, ContactKey>[]).map((a) => ({ ...a, ...contactFields(byId.get(a.id)) })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(a: Artisan) {
    setEditingId(a.id);
    const { id, ...rest } = a; // eslint-disable-line @typescript-eslint/no-unused-vars
    setForm(rest);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleName(value: string) {
    setForm((f) => ({
      ...f,
      name: value,
      // Only auto-generate slug if it's still derived from the old name (i.e. user hasn't manually edited it)
      slug: editingId ? f.slug : toSlug(value),
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const supabase = createBrowserClient();
    const n = (v: string | null | undefined) => (v ?? '').trim() || undefined;
    const payload = {
      name: form.name,
      slug: form.slug.trim() || toSlug(form.name),
      years_of_experience: form.years_of_experience ?? 0,
      sort_order: form.sort_order ?? 0,
      is_active: form.is_active,
      is_featured: form.is_featured,
      title: n(form.title),
      bio: n(form.bio),
      location: n(form.location),
      craft_type: n(form.craft_type),
      specialties: n(form.specialties),
      profile_image_url: n(form.profile_image_url),
    };

    let artisanId = editingId;
    if (editingId) {
      if (reportError((await supabase.from('artisans').update(payload).eq('id', editingId)).error)) { setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from('artisans').insert(payload).select('id').single();
      if (reportError(error) || !data) { setSaving(false); return; }
      artisanId = data.id;
    }
    const contacts = Object.fromEntries(CONTACT_KEYS.map((k) => [k, (form[k] ?? '').trim()])) as Record<ContactKey, string>;
    if (reportError((await supabase.from('artisan_private_contacts').upsert({ artisan_id: artisanId!, ...contacts })).error)) { setSaving(false); return; }

    setSaving(false);
    closeModal();
    setLoading(true);
    fetch();
  }

  async function handleDelete(a: Artisan) {
    if (!(await confirmAction({ message: `Delete "${a.name}"? You can restore it from Trash.`, danger: true }))) return;
    const supabase = createBrowserClient();
    if (reportError((await supabase.from('artisans').delete().eq('id', a.id)).error)) { return; }
    setLoading(true);
    fetch();
  }

  const q = search.trim().toLowerCase();
  const visible = artisans.filter((a) => !q || [a.name, a.craft_type, a.location, a.title].some((t) => (t ?? '').toLowerCase().includes(q)));

  const inputClass = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2';
  const inputStyle = {
    background: themeStyles.inputBg,
    border: `1px solid ${themeStyles.inputBorder}`,
    color: themeStyles.textPrimary,
  };
  const labelStyle = { color: themeStyles.textSecondary, fontSize: '0.75rem', fontWeight: 600 };

  return (
    <AdminLayout title="Artisans" subtitle="Manage artisan profiles">
      <Toolbar
        actions={<Button onClick={openAdd}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add new artisan</Button>}
      >
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-sm" value={search} onChange={setSearch} placeholder="Search name, craft or location" label="Search artisans" />
        <span className="text-xs" style={{ color: 'var(--adm-muted)' }}>{visible.length} of {artisans.length} artisan{artisans.length !== 1 ? 's' : ''}</span>
      </Toolbar>

      <TableCard
        loading={loading}
        empty={visible.length === 0}
        emptyTitle={artisans.length === 0 ? 'No artisans yet' : 'No artisans match'}
        emptyBody={artisans.length === 0 ? 'Add an artisan to get started.' : 'Try a different search.'}
        headers={['Artisan', 'Craft', 'Location', 'Status', '']}
      >
        {visible.map((a) => (
          <tr key={a.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar name={a.name} src={a.profile_image_url} size={36} />
                <div className="min-w-0">
                  <p className="truncate font-medium" style={{ color: 'var(--adm-text)' }}>{a.name}</p>
                  <p className="truncate text-xs" style={{ color: 'var(--adm-muted)' }}>{a.title || a.slug}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{a.craft_type || '-'}</td>
            <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{a.location || '-'}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1.5">
                <StatusPill tone={a.is_active ? 'success' : 'neutral'} icon={a.is_active ? faCheck : faXmark}>{a.is_active ? 'Active' : 'Inactive'}</StatusPill>
                {a.is_featured && <StatusPill tone="warning" icon={faStar}>Featured</StatusPill>}
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <IconButton title="Edit" onClick={() => openEdit(a)}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                <IconButton title="Delete" color="var(--adm-error)" onClick={() => handleDelete(a)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
              </div>
            </td>
          </tr>
        ))}
      </TableCard>

      {/* Modal */}
      {modalOpen && (
        <Modal title={editingId ? 'Edit Artisan' : 'Add New Artisan'} maxWidth="max-w-2xl" onClose={() => closeModal()}
          footer={
            <>
              <Button variant="secondary" onClick={closeModal}>
Cancel
</Button>
              <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
{saving && <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Artisan'}
</Button>
            
            </>
          }
        >
<div className="space-y-4">
            {/* Modal body */}
            <div className="space-y-4">
              {/* Name + Slug */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label style={labelStyle}>Name <span style={{ color: 'var(--adm-error)' }}>*</span></label>
                  <input
                    className={inputClass}
                    style={inputStyle}
                    value={form.name}
                    onChange={(e) => handleName(e.target.value)}
                    placeholder="e.g. Kwame Asante"
                  />
                </div>
                <div className="space-y-1">
                  <label style={labelStyle}>Slug</label>
                  <input
                    className={inputClass}
                    style={inputStyle}
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="auto-generated"
                  />
                </div>
              </div>

              {/* Title + Craft Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label style={labelStyle}>Title</label>
                  <input className={inputClass} style={inputStyle} value={form.title ?? ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Master Weaver" />
                </div>
                <div className="space-y-1">
                  <label style={labelStyle}>Craft Type</label>
                  <input className={inputClass} style={inputStyle} value={form.craft_type ?? ''} onChange={(e) => setForm((f) => ({ ...f, craft_type: e.target.value }))} placeholder="e.g. Kente Weaving" />
                </div>
              </div>

              {/* Specialties */}
              <div className="space-y-1">
                <label style={labelStyle}>Specialties</label>
                <input className={inputClass} style={inputStyle} value={form.specialties ?? ''} onChange={(e) => setForm((f) => ({ ...f, specialties: e.target.value }))} placeholder="e.g. Traditional patterns, Custom orders" />
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label style={labelStyle}>Bio</label>
                <textarea
                  className={inputClass}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  rows={4}
                  value={form.bio ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Short biography..."
                />
              </div>

              {/* Location + Years */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label style={labelStyle}>Location</label>
                  <input className={inputClass} style={inputStyle} value={form.location ?? ''} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Kumasi, Ghana" />
                </div>
                <div className="space-y-1">
                  <label style={labelStyle}>Years of Experience</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    style={inputStyle}
                    value={form.years_of_experience ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, years_of_experience: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="e.g. 15"
                  />
                </div>
              </div>

              {/* Contact (private: never shown on the public site) */}
              <p className="text-xs" style={{ color: themeStyles.textMuted }}>Contact details are private. Only admins can see them, they are never shown on the public site.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label style={labelStyle}>Email</label>
                  <input type="email" className={inputClass} style={inputStyle} value={form.email ?? ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="artisan@example.com" />
                </div>
                <div className="space-y-1">
                  <label style={labelStyle}>Phone</label>
                  <input className={inputClass} style={inputStyle} value={form.phone ?? ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+233 ..." />
                </div>
              </div>

              {/* Web + Instagram */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label style={labelStyle}>Website</label>
                  <input className={inputClass} style={inputStyle} value={form.website ?? ''} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="space-y-1">
                  <label style={labelStyle}>Instagram</label>
                  <input className={inputClass} style={inputStyle} value={form.instagram ?? ''} onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))} placeholder="@handle" />
                </div>
              </div>

              {/* Profile image */}
              <div className="space-y-1">
                <label style={labelStyle}>Profile Image URL</label>
                <UrlWithPicker inputStyle={inputStyle} value={form.profile_image_url ?? ''} onChange={(v) => setForm((f) => ({ ...f, profile_image_url: v }))} />
              </div>

              {/* Sort order */}
              <div className="space-y-1">
                <label style={labelStyle}>Sort Order</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  style={inputStyle}
                  value={form.sort_order ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value ? Number(e.target.value) : null }))}
                  placeholder="e.g. 1"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6">
                {[
                  { key: 'is_active', label: 'Active' },
                  { key: 'is_featured', label: 'Featured' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center transition"
                      style={{
                        background: form[key as keyof FormData] ? 'var(--adm-primary)' : themeStyles.inputBg,
                        border: `1px solid ${form[key as keyof FormData] ? 'var(--adm-primary)' : themeStyles.inputBorder}`,
                      }}
                      onClick={() => setForm((f) => ({ ...f, [key]: !f[key as keyof FormData] }))}
                    >
                      {form[key as keyof FormData] && <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="text-sm" style={{ color: themeStyles.textSecondary }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Modal footer */}
            
          
</div>
        </Modal>
      )}
    </AdminLayout>
  );
}
