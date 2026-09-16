'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPen, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import AdminLayout from '@/components/AdminLayout';

const BRAND_COLORS = { tropicalTeal: '#139EA2', sandyOrange: '#E6A64D' };

type Tab = 'feature_cards' | 'video_sections';

interface MainFeatureCard {
  id: string; title: string; subtitle: string; description: string;
  button_text: string; button_link: string; is_active: boolean; sort_order: number;
}
interface VideoSection {
  id: string; title: string; description: string; category: string;
  card_type: string; media_type: string; video_url: string; image_url: string;
  is_active: boolean; sort_order: number;
}

export default function HomepagePage() {
  const { isDimMode } = useTheme();
  const [tab, setTab] = useState<Tab>('feature_cards');
  const [featureCards, setFeatureCards] = useState<MainFeatureCard[]>([]);
  const [videoSections, setVideoSections] = useState<VideoSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ type: Tab; data: Partial<MainFeatureCard & VideoSection> } | null>(null);

  const fetchAll = useCallback(async () => {
    const supabase = createBrowserClient();
    const [fc, vs] = await Promise.all([
      supabase.from('main_feature_cards').select('id,title,subtitle,description,button_text,button_link,is_active,sort_order').order('sort_order'),
      supabase.from('video_sections').select('id,title,description,category,card_type,media_type,video_url,image_url,is_active,sort_order').order('sort_order'),
    ]);
    setFeatureCards((fc.data ?? []) as MainFeatureCard[]);
    setVideoSections((vs.data ?? []) as VideoSection[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const themeStyles = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#111827',
    textSecondary: isDimMode ? '#B0B0B0' : '#4B5563',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    inputBg: isDimMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    inputBorder: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none';
  const inputStyle = { background: themeStyles.inputBg, borderColor: themeStyles.inputBorder, color: themeStyles.textPrimary };
  const labelStyle = { color: themeStyles.textSecondary };

  async function save() {
    if (!modal) return;
    setSaving(true);
    const supabase = createBrowserClient();
    const { type, data } = modal;
    if (type === 'feature_cards') {
      const row = { title: data.title ?? '', subtitle: data.subtitle ?? '', description: data.description ?? '', button_text: data.button_text ?? '', button_link: data.button_link ?? '', is_active: data.is_active ?? true, sort_order: Number(data.sort_order) || 0 };
      if (data.id) await supabase.from('main_feature_cards').update(row).eq('id', data.id);
      else await supabase.from('main_feature_cards').insert(row);
    } else {
      const row = { title: data.title ?? '', description: data.description ?? '', category: data.category ?? '', card_type: (data.card_type ?? 'wide') as 'wide' | 'short', media_type: (data.media_type ?? 'none') as 'video' | 'image' | 'none', video_url: data.video_url ?? '', image_url: data.image_url ?? '', is_active: data.is_active ?? true, sort_order: Number(data.sort_order) || 0 };
      if (data.id) await supabase.from('video_sections').update(row).eq('id', data.id);
      else await supabase.from('video_sections').insert(row);
    }
    await fetchAll();
    setSaving(false);
    setModal(null);
  }

  async function del(table: 'main_feature_cards' | 'video_sections', id: string) {
    if (!window.confirm('Delete this item?')) return;
    const supabase = createBrowserClient();
    await supabase.from(table).delete().eq('id', id);
    fetchAll();
  }

  const setField = (key: string, value: unknown) =>
    setModal((m) => m ? { ...m, data: { ...m.data, [key]: value } } : m);

  const Badge = ({ active }: { active: boolean }) => (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: active ? '#10B98122' : '#EF444422', color: active ? '#10B981' : '#EF4444' }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );

  if (loading) {
    return (
      <AdminLayout title="Homepage" subtitle="Manage homepage sections">
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND_COLORS.tropicalTeal, borderTopColor: 'transparent' }} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Homepage" subtitle="Manage homepage feature cards and video sections">
      <div className="flex gap-1 mb-6 rounded-xl p-1" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
        {[{ key: 'feature_cards' as Tab, label: 'Feature Cards' }, { key: 'video_sections' as Tab, label: 'Video Sections' }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-xs font-medium transition flex-1"
            style={{ background: tab === t.key ? BRAND_COLORS.tropicalTeal : 'transparent', color: tab === t.key ? '#fff' : themeStyles.textSecondary }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Feature Cards */}
      {tab === 'feature_cards' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>Feature Cards ({featureCards.length})</h2>
            <button onClick={() => setModal({ type: 'feature_cards', data: { title: '', subtitle: '', description: '', button_text: 'Learn More', button_link: '', is_active: true, sort_order: 0 } })}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: BRAND_COLORS.tropicalTeal, color: 'white' }}>
              <FontAwesomeIcon icon={faPlus} className="w-3 h-3" /> Add Card
            </button>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
            <table className="w-full text-xs">
              <thead><tr style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                {['Title', 'Subtitle', 'Button', 'Order', 'Status', ''].map((h) => <th key={h} className="px-4 py-2 text-left font-medium" style={{ color: themeStyles.textMuted }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {featureCards.map((c) => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                    <td className="px-4 py-2 font-medium" style={{ color: themeStyles.textPrimary }}>{c.title}</td>
                    <td className="px-4 py-2 max-w-xs truncate" style={{ color: themeStyles.textSecondary }}>{c.subtitle}</td>
                    <td className="px-4 py-2" style={{ color: themeStyles.textMuted }}>{c.button_text}</td>
                    <td className="px-4 py-2" style={{ color: themeStyles.textMuted }}>{c.sort_order}</td>
                    <td className="px-4 py-2"><Badge active={c.is_active} /></td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => setModal({ type: 'feature_cards', data: { ...c } })} className="px-2 py-1 rounded text-xs" style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}><FontAwesomeIcon icon={faPen} className="w-3 h-3" /></button>
                        <button onClick={() => del('main_feature_cards', c.id)} className="px-2 py-1 rounded text-xs" style={{ background: '#EF444422', color: '#EF4444' }}><FontAwesomeIcon icon={faTrash} className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Video Sections */}
      {tab === 'video_sections' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>Video Sections ({videoSections.length})</h2>
            <button onClick={() => setModal({ type: 'video_sections', data: { title: '', description: '', category: '', card_type: 'wide', media_type: 'none', video_url: '', image_url: '', is_active: true, sort_order: 0 } })}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: BRAND_COLORS.tropicalTeal, color: 'white' }}>
              <FontAwesomeIcon icon={faPlus} className="w-3 h-3" /> Add Section
            </button>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
            <table className="w-full text-xs">
              <thead><tr style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                {['Title', 'Card Type', 'Media Type', 'Order', 'Status', ''].map((h) => <th key={h} className="px-4 py-2 text-left font-medium" style={{ color: themeStyles.textMuted }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {videoSections.map((v) => (
                  <tr key={v.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                    <td className="px-4 py-2 font-medium" style={{ color: themeStyles.textPrimary }}>{v.title}</td>
                    <td className="px-4 py-2"><span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}>{v.card_type}</span></td>
                    <td className="px-4 py-2"><span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: `${BRAND_COLORS.sandyOrange}22`, color: BRAND_COLORS.sandyOrange }}>{v.media_type}</span></td>
                    <td className="px-4 py-2" style={{ color: themeStyles.textMuted }}>{v.sort_order}</td>
                    <td className="px-4 py-2"><Badge active={v.is_active} /></td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => setModal({ type: 'video_sections', data: { ...v } })} className="px-2 py-1 rounded text-xs" style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}><FontAwesomeIcon icon={faPen} className="w-3 h-3" /></button>
                        <button onClick={() => del('video_sections', v.id)} className="px-2 py-1 rounded text-xs" style={{ background: '#EF444422', color: '#EF4444' }}><FontAwesomeIcon icon={faTrash} className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" style={{ background: themeStyles.cardBg }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold" style={{ color: themeStyles.textPrimary }}>
              {modal.data.id ? 'Edit' : 'Add'} {modal.type === 'feature_cards' ? 'Feature Card' : 'Video Section'}
            </h3>

            <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Title</label>
              <input className={inputClass} style={inputStyle} value={modal.data.title ?? ''} onChange={(e) => setField('title', e.target.value)} /></div>
            <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Subtitle</label>
              <input className={inputClass} style={inputStyle} value={modal.data.subtitle ?? ''} onChange={(e) => setField('subtitle', e.target.value)} /></div>
            <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Description</label>
              <textarea className={inputClass} style={inputStyle} rows={3} value={modal.data.description ?? ''} onChange={(e) => setField('description', e.target.value)} /></div>

            {modal.type === 'video_sections' && <>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Category</label>
                <input className={inputClass} style={inputStyle} value={modal.data.category ?? ''} onChange={(e) => setField('category', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Card Type</label>
                  <select className={inputClass} style={inputStyle} value={modal.data.card_type ?? 'wide'} onChange={(e) => setField('card_type', e.target.value)}>
                    <option value="wide">Wide</option><option value="short">Short</option>
                  </select></div>
                <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Media Type</label>
                  <select className={inputClass} style={inputStyle} value={modal.data.media_type ?? 'none'} onChange={(e) => setField('media_type', e.target.value)}>
                    <option value="none">None</option><option value="video">Video</option><option value="image">Image</option>
                  </select></div>
              </div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Video URL</label>
                <input className={inputClass} style={inputStyle} value={modal.data.video_url ?? ''} onChange={(e) => setField('video_url', e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Image URL</label>
                <input className={inputClass} style={inputStyle} value={modal.data.image_url ?? ''} onChange={(e) => setField('image_url', e.target.value)} /></div>
            </>}

            {modal.type === 'feature_cards' && (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Button Text</label>
                  <input className={inputClass} style={inputStyle} value={modal.data.button_text ?? ''} onChange={(e) => setField('button_text', e.target.value)} /></div>
                <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Button Link</label>
                  <input className={inputClass} style={inputStyle} value={modal.data.button_link ?? ''} onChange={(e) => setField('button_link', e.target.value)} /></div>
              </div>
            )}
            <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Sort Order</label>
              <input type="number" className={inputClass} style={inputStyle} value={Number(modal.data.sort_order) || 0} onChange={(e) => setField('sort_order', e.target.value)} /></div>
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={labelStyle}>
              <input type="checkbox" checked={modal.data.is_active ?? true} onChange={(e) => setField('is_active', e.target.checked)} />Active
            </label>

            <div className="flex gap-2 pt-2">
              <button onClick={save} disabled={saving}
                className="flex-1 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
                style={{ background: BRAND_COLORS.tropicalTeal, color: 'white' }}>
                {saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Save'}
              </button>
              <button onClick={() => setModal(null)} className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ background: themeStyles.border, color: themeStyles.textSecondary }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
