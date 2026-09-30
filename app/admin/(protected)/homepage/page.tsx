'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPen, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import UrlWithPicker from '@/components/admin/UrlWithPicker';
import { Button, IconButton, ListSkeleton, Modal, StatusPill, TableCard, Tabs, Toolbar, confirmAction, reportError, rowClass } from '@/components/admin/ui';

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
    cardBg: 'var(--adm-card)',
    textPrimary: 'var(--adm-text)',
    textSecondary: 'var(--adm-text-2)',
    textMuted: 'var(--adm-muted)',
    border: 'var(--adm-border)',
    inputBg: 'var(--adm-bg)',
    inputBorder: 'var(--adm-border)',
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
      if (data.id) { if (reportError((await supabase.from('main_feature_cards').update(row).eq('id', data.id)).error)) { setSaving(false); return; } }
      else { if (reportError((await supabase.from('main_feature_cards').insert(row)).error)) { setSaving(false); return; } }
    } else {
      const row = { title: data.title ?? '', description: data.description ?? '', category: data.category ?? '', card_type: (data.card_type ?? 'wide') as 'wide' | 'short', media_type: (data.media_type ?? 'none') as 'video' | 'image' | 'none', video_url: data.video_url ?? '', image_url: data.image_url ?? '', is_active: data.is_active ?? true, sort_order: Number(data.sort_order) || 0 };
      if (data.id) { if (reportError((await supabase.from('video_sections').update(row).eq('id', data.id)).error)) { setSaving(false); return; } }
      else { if (reportError((await supabase.from('video_sections').insert(row)).error)) { setSaving(false); return; } }
    }
    await fetchAll();
    setSaving(false);
    setModal(null);
  }

  async function del(table: 'main_feature_cards' | 'video_sections', id: string) {
    if (!(await confirmAction({ message: 'Delete this item?', danger: true }))) return;
    const supabase = createBrowserClient();
    if (reportError((await supabase.from(table).delete().eq('id', id)).error)) { return; }
    fetchAll();
  }

  const setField = (key: string, value: unknown) =>
    setModal((m) => m ? { ...m, data: { ...m.data, [key]: value } } : m);

  if (loading) {
    return (
      <AdminLayout title="Homepage" subtitle="Manage homepage sections">
        <ListSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Homepage" subtitle="Manage homepage feature cards and video sections">
      <Toolbar
        actions={
          tab === 'feature_cards' ? (
            <Button onClick={() => setModal({ type: 'feature_cards', data: { title: '', subtitle: '', description: '', button_text: 'Learn More', button_link: '', is_active: true, sort_order: 0 } })}>
              <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add card
            </Button>
          ) : (
            <Button onClick={() => setModal({ type: 'video_sections', data: { title: '', description: '', category: '', card_type: 'wide', media_type: 'none', video_url: '', image_url: '', is_active: true, sort_order: 0 } })}>
              <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add section
            </Button>
          )
        }
      >
        <Tabs value={tab} onChange={setTab} tabs={[{ key: 'feature_cards' as Tab, label: 'Feature Cards', count: featureCards.length }, { key: 'video_sections' as Tab, label: 'Video Sections', count: videoSections.length }]} />
      </Toolbar>

      {tab === 'feature_cards' && (
        <TableCard loading={false} empty={featureCards.length === 0} emptyTitle="No feature cards yet" emptyBody="Feature cards appear on the home page." headers={['Card', 'Button', 'Order', 'Status', '']}>
          {featureCards.map((c) => (
            <tr key={c.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="max-w-xs px-4 py-3">
                <p className="truncate font-medium" style={{ color: 'var(--adm-text)' }}>{c.title}</p>
                <p className="truncate text-xs" style={{ color: 'var(--adm-muted)' }}>{c.subtitle}</p>
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{c.button_text}</td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{c.sort_order}</td>
              <td className="px-4 py-3"><StatusPill tone={c.is_active ? 'success' : 'neutral'}>{c.is_active ? 'Active' : 'Inactive'}</StatusPill></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="Edit" onClick={() => setModal({ type: 'feature_cards', data: { ...c } })}><FontAwesomeIcon icon={faPen} className="h-3 w-3" /></IconButton>
                  <IconButton title="Delete" color="var(--adm-error)" onClick={() => del('main_feature_cards', c.id)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      )}

      {tab === 'video_sections' && (
        <TableCard loading={false} empty={videoSections.length === 0} emptyTitle="No video sections yet" emptyBody="Video sections appear on the home page." headers={['Section', 'Layout', 'Media', 'Order', 'Status', '']}>
          {videoSections.map((v) => (
            <tr key={v.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--adm-text)' }}>{v.title}</td>
              <td className="px-4 py-3"><StatusPill tone="info"><span className="capitalize">{v.card_type}</span></StatusPill></td>
              <td className="px-4 py-3"><StatusPill tone="warning"><span className="capitalize">{v.media_type}</span></StatusPill></td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{v.sort_order}</td>
              <td className="px-4 py-3"><StatusPill tone={v.is_active ? 'success' : 'neutral'}>{v.is_active ? 'Active' : 'Inactive'}</StatusPill></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="Edit" onClick={() => setModal({ type: 'video_sections', data: { ...v } })}><FontAwesomeIcon icon={faPen} className="h-3 w-3" /></IconButton>
                  <IconButton title="Delete" color="var(--adm-error)" onClick={() => del('video_sections', v.id)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      )}

      {/* Modal */}
      {modal && (
        <Modal title={`${modal.data.id ? 'Edit' : 'Add'} ${modal.type === 'feature_cards' ? 'Feature Card' : 'Video Section'}`} maxWidth="max-w-md" onClose={() => setModal(null)}
          footer={
            <>
              <Button className="flex-1" onClick={save} disabled={saving}>
{saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Save'}
</Button>
              <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>
Cancel
</Button>
            
            </>
          }
        >
<div className="space-y-4">
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
                <UrlWithPicker inputStyle={inputStyle} value={modal.data.image_url ?? ''} onChange={(v) => setField('image_url', v)} /></div>
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

            
          
</div>
        </Modal>
      )}
    </AdminLayout>
  );
}
