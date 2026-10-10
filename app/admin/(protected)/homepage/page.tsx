'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPen, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { parseYouTubeId, youTubeThumb } from '@/lib/video/youtube';
import UrlWithPicker from '@/components/admin/UrlWithPicker';
import { Button, IconButton, ListSkeleton, Modal, StatusPill, TableCard, Tabs, Toolbar, confirmAction, reportError, rowClass } from '@/components/admin/ui';

type Tab = 'slides' | 'videos';

interface Slide {
  id: string; title: string; subtitle: string; image_url: string; button_link: string;
  is_active: boolean; sort_order: number;
}
interface VideoSection {
  id: string; title: string; description: string; category: string;
  card_type: string; media_type: string; video_url: string; image_url: string;
  is_active: boolean; sort_order: number;
}

const inputClass = 'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none';
const inputStyle = { background: 'var(--adm-bg)', borderColor: 'var(--adm-border)', color: 'var(--adm-text)' };
const labelStyle = { color: 'var(--adm-text-2)' };
const labelClass = 'block text-xs font-medium mb-1';

export default function HomepagePage() {
  const [tab, setTab] = useState<Tab>('slides');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [slideModal, setSlideModal] = useState<Partial<Slide> | null>(null);
  const [slideError, setSlideError] = useState('');
  const [videoSections, setVideoSections] = useState<VideoSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ytError, setYtError] = useState('');
  const [legacyUrl, setLegacyUrl] = useState(false);
  const [modal, setModal] = useState<Partial<VideoSection> | null>(null);

  const fetchAll = useCallback(async () => {
    const supabase = createBrowserClient();
    const [vs, sl] = await Promise.all([
      supabase.from('video_sections').select('id,title,description,category,card_type,media_type,video_url,image_url,is_active,sort_order').order('sort_order'),
      supabase.from('homepage_slides').select('id,title,subtitle,image_url,button_link,is_active,sort_order').order('sort_order'),
    ]);
    setVideoSections((vs.data ?? []) as VideoSection[]);
    setSlides((sl.data ?? []) as Slide[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function saveSlide() {
    if (!slideModal) return;
    if (!(slideModal.image_url ?? '').trim()) { setSlideError('Choose or paste a photo.'); return; }
    if (!(slideModal.title ?? '').trim()) { setSlideError('Add a place name for the caption.'); return; }
    setSaving(true);
    const supabase = createBrowserClient();
    const row = { title: slideModal.title ?? '', subtitle: slideModal.subtitle ?? '', image_url: slideModal.image_url ?? '', button_link: slideModal.button_link ?? '', is_active: slideModal.is_active ?? true, sort_order: Number(slideModal.sort_order) || 0 };
    const res = slideModal.id ? await supabase.from('homepage_slides').update(row).eq('id', slideModal.id) : await supabase.from('homepage_slides').insert(row);
    if (reportError(res.error)) { setSaving(false); return; }
    await fetchAll();
    setSaving(false);
    setSlideModal(null);
  }

  async function delSlide(id: string) {
    if (!(await confirmAction({ message: 'Delete this slide?', danger: true }))) return;
    const supabase = createBrowserClient();
    if (reportError((await supabase.from('homepage_slides').delete().eq('id', id)).error)) return;
    fetchAll();
  }

  async function saveVideo() {
    if (!modal) return;
    setSaving(true);
    const supabase = createBrowserClient();
    const data = modal;
    if (!legacyUrl && !parseYouTubeId(data.video_url ?? '')) {
      setYtError('Paste a YouTube link, for example https://www.youtube.com/watch?v=...');
      setSaving(false);
      return;
    }
    const row = { title: data.title ?? '', description: data.description ?? '', category: data.category ?? '', card_type: (data.card_type ?? 'wide') as 'wide' | 'short', media_type: (legacyUrl ? (data.media_type ?? 'none') : 'video') as 'video' | 'image' | 'none', video_url: data.video_url ?? '', image_url: data.image_url ?? '', is_active: data.is_active ?? true, sort_order: Number(data.sort_order) || 0 };
    const res = data.id ? await supabase.from('video_sections').update(row).eq('id', data.id) : await supabase.from('video_sections').insert(row);
    if (reportError(res.error)) { setSaving(false); return; }
    await fetchAll();
    setSaving(false);
    setModal(null);
  }

  async function delVideo(id: string) {
    if (!(await confirmAction({ message: 'Delete this video?', danger: true }))) return;
    const supabase = createBrowserClient();
    if (reportError((await supabase.from('video_sections').delete().eq('id', id)).error)) return;
    fetchAll();
  }

  const setSlideField = (key: string, value: unknown) => setSlideModal((m) => (m ? { ...m, [key]: value } : m));
  const setField = (key: string, value: unknown) => setModal((m) => (m ? { ...m, [key]: value } : m));

  if (loading) {
    return (
      <AdminLayout title="Homepage" subtitle="Hero photos and the Watch Ghana videos">
        <ListSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Homepage" subtitle="Hero photos and the Watch Ghana videos">
      <Toolbar
        actions={
          tab === 'slides' ? (
            <Button onClick={() => { setSlideError(''); setSlideModal({ title: '', subtitle: '', image_url: '', button_link: '', is_active: true, sort_order: slides.length }); }}>
              <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add slide
            </Button>
          ) : (
            <Button onClick={() => { setYtError(''); setLegacyUrl(false); setModal({ title: '', description: '', category: '', card_type: 'wide', media_type: 'video', video_url: '', image_url: '', is_active: true, sort_order: 0 }); }}>
              <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add video
            </Button>
          )
        }
      >
        <Tabs value={tab} onChange={setTab} tabs={[{ key: 'slides' as Tab, label: 'Hero slides', count: slides.length }, { key: 'videos' as Tab, label: 'Videos', count: videoSections.length }]} />
      </Toolbar>

      {tab === 'slides' && (
        <>
          <p className="mb-3 text-xs" style={{ color: 'var(--adm-muted)' }}>
            The headline and buttons on the hero are fixed. Each slide supplies the background photo and the place name shown in the corner. Landscape photos at least 1600px wide work best.
          </p>
          <TableCard loading={false} empty={slides.length === 0} emptyTitle="No hero slides yet" emptyBody="Add a photo to show behind the hero." headers={['Slide', 'Caption link', 'Order', 'Status', '']}>
            {slides.map((sl) => (
              <tr key={sl.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--adm-text)' }}>
                  <div className="flex items-center gap-3">
                    {sl.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sl.image_url} alt="" className="h-10 w-16 flex-none rounded object-cover" />
                    )}
                    <span>
                      <span className="block">{sl.title}</span>
                      <span className="block text-xs font-normal" style={{ color: 'var(--adm-muted)' }}>{sl.subtitle}</span>
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{sl.button_link || 'None'}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{sl.sort_order}</td>
                <td className="px-4 py-3"><StatusPill tone={sl.is_active ? 'success' : 'neutral'}>{sl.is_active ? 'Active' : 'Inactive'}</StatusPill></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <IconButton title="Edit" onClick={() => { setSlideError(''); setSlideModal({ ...sl }); }}><FontAwesomeIcon icon={faPen} className="h-3 w-3" /></IconButton>
                    <IconButton title="Delete" color="var(--adm-error)" onClick={() => delSlide(sl.id)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </TableCard>
        </>
      )}

      {tab === 'videos' && (
        <TableCard loading={false} empty={videoSections.length === 0} emptyTitle="No videos yet" emptyBody="Paste a YouTube link to add a video to the home page." headers={['Video', 'Category', 'Order', 'Status', '']}>
          {videoSections.map((v) => (
            <tr key={v.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
              <td className="px-4 py-3 font-medium" style={{ color: 'var(--adm-text)' }}>
                <div className="flex items-center gap-3">
                  {(() => { const yt = parseYouTubeId(v.video_url); const src = v.image_url || (yt ? youTubeThumb(yt) : ''); return src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" className="h-10 w-16 flex-none rounded object-cover" />
                  ) : null; })()}
                  <span>{v.title}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{v.category}</td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{v.sort_order}</td>
              <td className="px-4 py-3"><StatusPill tone={v.is_active ? 'success' : 'neutral'}>{v.is_active ? 'Active' : 'Inactive'}</StatusPill></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <IconButton title="Edit" onClick={() => { setYtError(''); setLegacyUrl(!!v.video_url && !parseYouTubeId(v.video_url)); setModal({ ...v }); }}><FontAwesomeIcon icon={faPen} className="h-3 w-3" /></IconButton>
                  <IconButton title="Delete" color="var(--adm-error)" onClick={() => delVideo(v.id)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                </div>
              </td>
            </tr>
          ))}
        </TableCard>
      )}

      {slideModal && (
        <Modal title={`${slideModal.id ? 'Edit' : 'Add'} hero slide`} maxWidth="max-w-md" onClose={() => setSlideModal(null)}
          footer={
            <>
              <Button className="flex-1" onClick={saveSlide} disabled={saving}>
                {saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Save'}
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setSlideModal(null)}>Cancel</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className={labelClass} style={labelStyle}>Photo</label>
              <UrlWithPicker inputStyle={inputStyle} value={slideModal.image_url ?? ''} onChange={(v) => { setSlideError(''); setSlideField('image_url', v); }} />
              {slideModal.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slideModal.image_url} alt="Slide preview" className="mt-2 aspect-video w-full rounded-lg object-cover" />
              )}
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Place name</label>
              <input className={inputClass} style={inputStyle} placeholder="Kakum National Park" value={slideModal.title ?? ''} onChange={(e) => { setSlideError(''); setSlideField('title', e.target.value); }} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Region</label>
              <input className={inputClass} style={inputStyle} placeholder="Central Region" value={slideModal.subtitle ?? ''} onChange={(e) => setSlideField('subtitle', e.target.value)} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Caption link (optional)</label>
              <input className={inputClass} style={inputStyle} placeholder="/tours" value={slideModal.button_link ?? ''} onChange={(e) => setSlideField('button_link', e.target.value)} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Sort Order</label>
              <input type="number" className={inputClass} style={inputStyle} value={Number(slideModal.sort_order) || 0} onChange={(e) => setSlideField('sort_order', e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={labelStyle}>
              <input type="checkbox" checked={slideModal.is_active ?? true} onChange={(e) => setSlideField('is_active', e.target.checked)} />Active
            </label>
            {slideError && <p role="alert" className="text-xs" style={{ color: 'var(--adm-error)' }}>{slideError}</p>}
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title={`${modal.id ? 'Edit' : 'Add'} video`} maxWidth="max-w-md" onClose={() => setModal(null)}
          footer={
            <>
              <Button className="flex-1" onClick={saveVideo} disabled={saving}>
                {saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Save'}
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>Cancel</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className={labelClass} style={labelStyle}>Title</label>
              <input className={inputClass} style={inputStyle} value={modal.title ?? ''} onChange={(e) => setField('title', e.target.value)} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Description</label>
              <textarea className={inputClass} style={inputStyle} rows={3} value={modal.description ?? ''} onChange={(e) => setField('description', e.target.value)} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Category</label>
              <input className={inputClass} style={inputStyle} list="video-categories" value={modal.category ?? ''} onChange={(e) => setField('category', e.target.value)} />
              <datalist id="video-categories"><option value="Destinations" /><option value="Interviews" /><option value="Experiences" /><option value="Student stories" /></datalist>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>YouTube link</label>
              <input className={inputClass} style={inputStyle} readOnly={legacyUrl} placeholder="https://www.youtube.com/watch?v=..." value={modal.video_url ?? ''} onChange={(e) => { setYtError(''); setField('video_url', e.target.value); }} />
              {legacyUrl && <p className="mt-1 text-xs" style={{ color: 'var(--adm-muted)' }}>Not a YouTube link, it will not appear in the carousel.</p>}
              {ytError && <p className="mt-1 text-xs" style={{ color: 'var(--adm-error)' }}>{ytError}</p>}
              {(() => { const yt = parseYouTubeId(modal.video_url ?? ''); return yt ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={youTubeThumb(yt)} alt="Video thumbnail preview" className="mt-2 aspect-video w-full rounded-lg object-cover" />
              ) : null; })()}
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Image URL</label>
              <UrlWithPicker inputStyle={inputStyle} value={modal.image_url ?? ''} onChange={(v) => setField('image_url', v)} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Sort Order</label>
              <input type="number" className={inputClass} style={inputStyle} value={Number(modal.sort_order) || 0} onChange={(e) => setField('sort_order', e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={labelStyle}>
              <input type="checkbox" checked={modal.is_active ?? true} onChange={(e) => setField('is_active', e.target.checked)} />Active
            </label>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
