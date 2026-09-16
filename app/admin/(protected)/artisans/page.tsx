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
  faTimes,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import AdminLayout from '@/components/AdminLayout';

const BRAND_COLORS = { tropicalTeal: '#139EA2', sandyOrange: '#E6A64D' };

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
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  profile_image_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number | null;
}

type FormData = Omit<Artisan, 'id'>;

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
  const { isDimMode } = useTheme();
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#111827',
    textSecondary: isDimMode ? '#B0B0B0' : '#4B5563',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    inputBg: isDimMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    inputBorder: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
  };

  const fetch = useCallback(async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('artisans')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true });
    setArtisans((data as Artisan[]) ?? []);
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
      email: n(form.email),
      phone: n(form.phone),
      website: n(form.website),
      instagram: n(form.instagram),
      facebook: n(form.facebook),
      twitter: n(form.twitter),
      profile_image_url: n(form.profile_image_url),
    };

    if (editingId) {
      await supabase.from('artisans').update(payload).eq('id', editingId);
    } else {
      await supabase.from('artisans').insert(payload);
    }

    setSaving(false);
    closeModal();
    setLoading(true);
    fetch();
  }

  async function handleDelete(a: Artisan) {
    if (!window.confirm(`Delete "${a.name}"? This cannot be undone.`)) return;
    const supabase = createBrowserClient();
    await supabase.from('artisans').delete().eq('id', a.id);
    setLoading(true);
    fetch();
  }

  const inputClass = 'w-full rounded-lg px-3 py-2 text-sm outline-none transition focus:ring-2';
  const inputStyle = {
    background: themeStyles.inputBg,
    border: `1px solid ${themeStyles.inputBorder}`,
    color: themeStyles.textPrimary,
  };
  const labelStyle = { color: themeStyles.textSecondary, fontSize: '0.75rem', fontWeight: 600 };

  return (
    <AdminLayout title="Artisans" subtitle="Manage artisan profiles">
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: themeStyles.textMuted }}>
            {artisans.length} artisan{artisans.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90"
            style={{ background: BRAND_COLORS.tropicalTeal }}
          >
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            Add New Artisan
          </button>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 animate-spin" style={{ color: BRAND_COLORS.tropicalTeal }} />
            </div>
          ) : artisans.length === 0 ? (
            <p className="p-6 text-sm text-center" style={{ color: themeStyles.textMuted }}>No artisans yet. Add one to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: themeStyles.border }}>
                    {['Name', 'Title / Craft', 'Location', 'Active', 'Featured', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: themeStyles.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {artisans.map((a, i) => (
                    <tr
                      key={a.id}
                      className="border-b last:border-b-0 transition hover:bg-black/5"
                      style={{ borderColor: themeStyles.border }}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: themeStyles.textPrimary }}>{a.name}</p>
                        <p className="text-xs" style={{ color: themeStyles.textMuted }}>{a.slug}</p>
                      </td>
                      <td className="px-4 py-3" style={{ color: themeStyles.textSecondary }}>
                        {[a.title, a.craft_type].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: themeStyles.textSecondary }}>{a.location || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={a.is_active
                            ? { background: '#10B98122', color: '#10B981' }
                            : { background: isDimMode ? 'rgba(255,255,255,0.05)' : '#F3F4F6', color: themeStyles.textMuted }
                          }
                        >
                          <FontAwesomeIcon icon={a.is_active ? faCheck : faTimes} className="w-2.5 h-2.5" />
                          {a.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {a.is_featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: `${BRAND_COLORS.sandyOrange}22`, color: BRAND_COLORS.sandyOrange }}>
                            <FontAwesomeIcon icon={faStar} className="w-2.5 h-2.5" />
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(a)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80"
                            style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faPencil} className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(a)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80"
                            style={{ background: '#EF444422', color: '#EF4444' }}
                            title="Delete"
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
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
            style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10" style={{ borderColor: themeStyles.border, background: themeStyles.cardBg }}>
              <h2 className="text-base font-bold" style={{ color: themeStyles.textPrimary }}>
                {editingId ? 'Edit Artisan' : 'Add New Artisan'}
              </h2>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-70" style={{ background: themeStyles.inputBg, color: themeStyles.textMuted }}>
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {/* Name + Slug */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label style={labelStyle}>Name <span style={{ color: '#EF4444' }}>*</span></label>
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

              {/* Contact */}
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
                <input className={inputClass} style={inputStyle} value={form.profile_image_url ?? ''} onChange={(e) => setForm((f) => ({ ...f, profile_image_url: e.target.value }))} placeholder="https://..." />
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
                        background: form[key as keyof FormData] ? BRAND_COLORS.tropicalTeal : themeStyles.inputBg,
                        border: `1px solid ${form[key as keyof FormData] ? BRAND_COLORS.tropicalTeal : themeStyles.inputBorder}`,
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
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: themeStyles.border }}>
              <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-70" style={{ background: themeStyles.inputBg, color: themeStyles.textSecondary }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: BRAND_COLORS.tropicalTeal }}
              >
                {saving && <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Artisan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
