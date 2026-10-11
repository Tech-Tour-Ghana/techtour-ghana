'use client';

// Everything deleted in the admin lands here first (database trigger, 0029, 0044).
// Items deleted together (a tour and its departures, a folder and its files) are
// one card. Deleted media files stay in storage under _trash/ so they can be
// previewed and put back. Permanent delete and Empty trash cannot be undone.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBox, faClipboardList, faEnvelope, faFile, faFileLines, faFilePdf, faFileVideo, faFolder, faImage, faMap, faNewspaper,
  faRotateLeft, faTable, faTableCells, faTrash, faTrashCan, faEye, type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

import AdminLayout from '@/components/AdminLayout';
import { notify } from '@/components/admin/toast';
import { Button, ListSkeleton, Modal, SearchInput, StatTile, StatusPill, Surface, Tabs, confirmAction, fieldStyle } from '@/components/admin/ui';
import { TRASH_PREFIX } from '@/lib/media/client';
import { createBrowserClient } from '@/lib/supabase/client';
import { announceAdminCounts } from '@/lib/useAdminCounts';

interface Row {
  id: number; table_name: string; record_id: string; label: string; batch: number; deleted_at: string;
  path: string | null; mime: string | null; size: string | null;
  i1: string | null; i2: string | null; i3: string | null; i4: string | null; i5: string | null; i6: string | null;
}
interface Group { batch: number; main: Row; rows: Row[]; deleted_at: string }

// Only the fields the cards need are read, so a long blog post is not downloaded for every row.
const SELECT = 'id, table_name, record_id, label, batch, deleted_at, path:data->>storage_path, mime:data->>mime_type, size:data->>size_bytes, i1:data->>image_url, i2:data->>featured_image_url, i3:data->>main_image_url, i4:data->>author_image_path, i5:data->>avatar_url, i6:data->>image';

const KINDS: Record<string, string> = {
  tours: 'Tour', tour_categories: 'Tour category', tour_schedules: 'Departure', tour_reviews: 'Review', bookings: 'Booking',
  blog_posts: 'Blog post', market_products: 'Product', market_categories: 'Product category', artisans: 'Artisan',
  destinations: 'Destination', testimonials: 'Testimonial', team_members: 'Team member', job_openings: 'Job opening',
  tech_innovations: 'Innovation', tech_events: 'Tech event', tech_resources: 'Tech resource', study_destinations: 'Study destination',
  notices: 'Notice', scholarships: 'Scholarship', contact_messages: 'Contact message', newsletter_subscribers: 'Subscriber',
  artisan_private_contacts: 'Artisan contacts', artisan_products: 'Artisan product', product_gallery: 'Product image', seo_metadata: 'SEO settings',
  main_feature_cards: 'Homepage card', video_sections: 'Video section', homepage_slides: 'Hero slide', small_glass_cards: 'Small card',
  navbar_menus: 'Menu item', navbar_dropdowns: 'Dropdown item', footer_quick_links: 'Footer link', social_links: 'Social link', legal_links: 'Legal link',
  job_categories: 'Job category', study_applications: 'Study application', suggestions: 'Suggestion', issue_reports: 'Issue report', vacation_rentals: 'Vacation rental',
  vacation_bookings: 'Stay request', media_assets: 'File', media_folders: 'Media folder',
};
const kind = (t: string) => KINDS[t] ?? t;

type Tab = 'all' | 'files' | 'content' | 'records';
const FILES = new Set(['media_assets', 'media_folders']);
const RECORDS = new Set(['bookings', 'vacation_bookings', 'tour_reviews', 'contact_messages', 'newsletter_subscribers', 'study_applications', 'suggestions', 'issue_reports']);
const tabOf = (t: string): Exclude<Tab, 'all'> => (FILES.has(t) ? 'files' : RECORDS.has(t) ? 'records' : 'content');

const ICONS: Record<string, IconDefinition> = {
  media_folders: faFolder, tours: faMap, destinations: faMap, blog_posts: faNewspaper, market_products: faBox,
  bookings: faClipboardList, vacation_bookings: faClipboardList, study_applications: faClipboardList, contact_messages: faEnvelope,
};
function iconFor(r: Row): IconDefinition {
  if (r.table_name === 'media_assets') {
    const m = r.mime ?? '';
    return m.startsWith('image/') ? faImage : m === 'application/pdf' ? faFilePdf : m.startsWith('video/') ? faFileVideo : faFile;
  }
  return ICONS[r.table_name] ?? faFileLines;
}

const looksLikeUrl = (v: string | null) => !!v && (/^https?:\/\//.test(v) || v.startsWith('/'));

function ago(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const formatBytes = (n: string | null) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return '';
  return v < 1024 * 1024 ? `${Math.max(1, Math.round(v / 1024))} KB` : `${(v / 1024 / 1024).toFixed(1)} MB`;
};

export default function AdminTrashPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [type, setType] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [preview, setPreview] = useState<Group | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    try { if (localStorage.getItem('admin_trash_view') === 'list') setView('list'); } catch { /* storage blocked */ }
  }, []);
  const chooseView = (v: 'grid' | 'list') => {
    setView(v);
    try { localStorage.setItem('admin_trash_view', v); } catch { /* not remembered */ }
  };

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.from('trash_items').select(SELECT).order('deleted_at', { ascending: false }).limit(1000);
    if (err) setError('Could not load the trash.');
    else { setRows((data as unknown as Row[]) ?? []); setError(''); }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const groups: Group[] = useMemo(() => {
    const byBatch = new Map<number, Row[]>();
    for (const r of rows) byBatch.set(r.batch, [...(byBatch.get(r.batch) ?? []), r]);
    return [...byBatch.entries()]
      .map(([batch, list]) => {
        const sorted = [...list].sort((a, b) => a.id - b.id);
        return { batch, rows: sorted, main: sorted[0]!, deleted_at: sorted[0]!.deleted_at };
      })
      .sort((a, b) => b.deleted_at.localeCompare(a.deleted_at));
  }, [rows]);

  const trashUrl = useCallback((path: string) => supabase.storage.from('media').getPublicUrl(TRASH_PREFIX + path).data.publicUrl, [supabase]);
  const thumbOf = useCallback((r: Row): string | null => {
    if (r.table_name === 'media_assets') return r.path && (r.mime ?? '').startsWith('image/') ? trashUrl(r.path) : null;
    return [r.i1, r.i2, r.i3, r.i4, r.i5, r.i6].find(looksLikeUrl) ?? null;
  }, [trashUrl]);

  async function restoreGroups(gs: Group[]) {
    if (gs.length === 0) return;
    const related = gs.reduce((n, g) => n + g.rows.length - 1, 0);
    const one = gs[0]!;
    const message = gs.length === 1
      ? `Restore ${kind(one.main.table_name).toLowerCase()} "${one.main.label}"${related ? ` and the ${related} related item${related === 1 ? '' : 's'} deleted with it` : ''}?`
      : `Restore ${gs.length} items${related ? ` and the ${related} related item${related === 1 ? '' : 's'} deleted with them` : ''}?`;
    if (!(await confirmAction({ message, confirmLabel: gs.length === 1 ? 'Restore' : `Restore ${gs.length}` }))) return;
    setBusy(one.main.id);
    const bucket = supabase.storage.from('media');
    let restored = 0;
    let failed = 0;
    for (const g of gs) {
      // Put the files back first, so a restored library entry never points at nothing.
      const files = g.rows.filter((r) => r.table_name === 'media_assets' && r.path);
      const moved: string[] = [];
      let ok = true;
      for (const f of files) {
        const { error: mv } = await bucket.move(TRASH_PREFIX + f.path!, f.path!);
        if (mv && !/not found/i.test(mv.message)) { ok = false; break; }
        if (!mv) moved.push(f.path!);
      }
      if (ok) {
        const { error: err } = await supabase.rpc('restore_trash', { p_id: g.main.id });
        if (err) ok = false;
      }
      if (!ok) await Promise.all(moved.map((p) => bucket.move(p, TRASH_PREFIX + p)));
      if (ok) restored += 1; else failed += 1;
    }
    setBusy(null);
    if (failed) notify(`${restored} restored, ${failed} could not be restored. The item they belong to may be missing.`);
    else notify(restored === 1 ? 'Restored.' : `${restored} items restored.`, 'success');
    setPreview(null);
    setSelected(new Set());
    announceAdminCounts();
    load();
  }

  /** gs null empties the whole trash. */
  async function purgeGroups(gs: Group[] | null) {
    const list = gs ?? groups;
    if (list.length === 0) return;
    const extra = list.reduce((n, g) => n + g.rows.length - 1, 0);
    const message = gs === null
      ? `Permanently delete everything in the trash (${list.length} item${list.length === 1 ? '' : 's'})? This cannot be undone.`
      : list.length === 1
        ? `Permanently delete "${list[0]!.main.label}"${extra ? ` and the ${extra} item${extra === 1 ? '' : 's'} deleted with it` : ''}? This cannot be undone.`
        : `Permanently delete ${list.length} items${extra ? ` and the ${extra} item${extra === 1 ? '' : 's'} deleted with them` : ''}? This cannot be undone.`;
    if (!(await confirmAction({ message, danger: true, confirmLabel: gs === null ? 'Empty trash' : list.length === 1 ? 'Delete forever' : `Delete ${list.length} forever` }))) return;
    setBusy(gs === null ? -1 : list[0]!.main.id);
    const target = gs === null ? rows : list.flatMap((g) => g.rows);
    const paths = target.filter((r) => r.table_name === 'media_assets' && r.path).map((r) => TRASH_PREFIX + r.path!);
    if (paths.length) await supabase.storage.from('media').remove(paths);
    let failed = false;
    if (gs === null) { const { error: err } = await supabase.rpc('purge_trash', {}); failed = !!err; }
    else for (const r of target) { const { error: err } = await supabase.rpc('purge_trash', { p_id: r.id }); if (err) failed = true; }
    setBusy(null);
    if (failed) return notify('Some items could not be deleted.');
    notify(gs === null ? 'Trash emptied.' : list.length === 1 ? 'Deleted permanently.' : `${list.length} items deleted permanently.`, 'success');
    setPreview(null);
    setSelected(new Set());
    announceAdminCounts();
    load();
  }
  const restore = (g: Group) => restoreGroups([g]);
  const purge = (g: Group | null) => purgeGroups(g ? [g] : null);

  const types = [...new Set(groups.map((g) => g.main.table_name))].sort();
  const q = search.trim().toLowerCase();
  const visible = groups.filter((g) => (tab === 'all' || tabOf(g.main.table_name) === tab) && (type === 'all' || g.main.table_name === type) && (!q || g.rows.some((r) => r.label.toLowerCase().includes(q))));
  const count = (t: Tab) => (t === 'all' ? groups.length : groups.filter((g) => tabOf(g.main.table_name) === t).length);

  const chosen = groups.filter((g) => selected.has(g.batch));
  const allShownSelected = visible.length > 0 && visible.every((g) => selected.has(g.batch));
  const toggle = (g: Group) => setSelected((cur) => { const next = new Set(cur); if (next.has(g.batch)) next.delete(g.batch); else next.add(g.batch); return next; });
  const toggleAllShown = () => setSelected((cur) => { const next = new Set(cur); if (allShownSelected) visible.forEach((g) => next.delete(g.batch)); else visible.forEach((g) => next.add(g.batch)); return next; });

  const Check = ({ g }: { g: Group }) => (
    <input type="checkbox" checked={selected.has(g.batch)} onChange={() => toggle(g)} aria-label={`Select ${g.main.label}`} className="h-4 w-4 cursor-pointer" style={{ accentColor: 'var(--adm-primary)' }} />
  );

  const Actions = ({ g }: { g: Group }) => (
    <div className="flex gap-2">
      <Button variant="secondary" onClick={() => setPreview(g)}><FontAwesomeIcon icon={faEye} className="mr-2 h-3 w-3" />Preview</Button>
      <Button disabled={busy === g.main.id} onClick={() => restore(g)}><FontAwesomeIcon icon={faRotateLeft} className="mr-2 h-3 w-3" />Restore</Button>
      <button type="button" aria-label={`Delete ${g.main.label} forever`} title="Delete forever" disabled={busy === g.main.id} onClick={() => purge(g)} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition hover:opacity-80 disabled:opacity-40" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>
        <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <AdminLayout title="Trash" subtitle="Deleted items can be previewed, restored or removed for good">
      <div className="mb-4 grid max-w-xl grid-cols-3 gap-3">
        <StatTile icon={faTrashCan} label="Items in trash" value={groups.length} tone="warning" />
        <StatTile icon={faImage} label="Files" value={count('files')} tone="info" />
        <StatTile icon={faNewspaper} label="Content" value={count('content')} tone="neutral" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onChange={setTab} tabs={[{ key: 'all' as const, label: 'All', count: count('all') }, { key: 'files' as const, label: 'Files', count: count('files') }, { key: 'content' as const, label: 'Content', count: count('content') }, { key: 'records' as const, label: 'Records', count: count('records') }]} />
        <Button variant="secondary" disabled={groups.length === 0 || busy === -1} onClick={() => purge(null)}><FontAwesomeIcon icon={faTrash} className="mr-2 h-3 w-3" />Empty trash</Button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-sm" value={search} onChange={setSearch} placeholder="Search deleted items" label="Search trash" />
        <select aria-label="Filter by type" value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 text-sm" style={fieldStyle}>
          <option value="all">All types</option>
          {types.map((t) => <option key={t} value={t}>{kind(t)}</option>)}
        </select>
        <div role="group" aria-label="Layout" className="ml-auto inline-flex rounded-[var(--adm-radius-control)] p-1" style={{ background: 'var(--adm-track)' }}>
          {([['grid', faTableCells, 'Grid'], ['list', faTable, 'List']] as const).map(([v, icon, label]) => (
            <button key={v} type="button" aria-pressed={view === v} aria-label={`${label} layout`} onClick={() => chooseView(v)} className="flex h-8 w-9 items-center justify-center rounded-lg" style={view === v ? { background: 'var(--adm-card)', color: 'var(--adm-primary)', boxShadow: 'var(--adm-shadow)' } : { color: 'var(--adm-text-2)' }}>
              <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>

      {visible.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[var(--adm-radius-control)] px-4 py-2.5 text-sm" style={{ background: chosen.length ? 'var(--adm-primary-soft)' : 'var(--adm-track)', color: 'var(--adm-text)' }}>
          <label className="flex cursor-pointer items-center gap-2 font-medium">
            <input type="checkbox" checked={allShownSelected} onChange={toggleAllShown} className="h-4 w-4" style={{ accentColor: 'var(--adm-primary)' }} />
            {allShownSelected ? 'Deselect all' : `Select all ${visible.length}`}
          </label>
          {chosen.length > 0 && (
            <>
              <span aria-live="polite" className="text-xs" style={{ color: 'var(--adm-text-2)' }}>{chosen.length} selected</span>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button onClick={() => restoreGroups(chosen)} disabled={busy !== null}><FontAwesomeIcon icon={faRotateLeft} className="mr-2 h-3 w-3" />Restore {chosen.length}</Button>
                <Button variant="danger" onClick={() => purgeGroups(chosen)} disabled={busy !== null}><FontAwesomeIcon icon={faTrash} className="mr-2 h-3 w-3" />Delete {chosen.length} forever</Button>
                <Button variant="secondary" onClick={() => setSelected(new Set())}>Clear</Button>
              </div>
            </>
          )}
        </div>
      )}

      {error ? (
        <p role="alert" className="rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>
      ) : loading ? (
        <ListSkeleton />
      ) : visible.length === 0 ? (
        <Surface className="p-12 text-center">
          <FontAwesomeIcon icon={faTrashCan} className="mb-3 h-8 w-8" style={{ color: 'var(--adm-muted)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>{groups.length === 0 ? 'Trash is empty' : 'Nothing matches'}</h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--adm-text-2)' }}>{groups.length === 0 ? 'Items you delete in the admin appear here.' : 'Try a different search, tab or type.'}</p>
        </Surface>
      ) : view === 'grid' ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visible.map((g) => {
            const thumb = thumbOf(g.main);
            return (
              <li key={g.batch}>
                <Surface className="relative flex h-full flex-col overflow-hidden" style={selected.has(g.batch) ? { outline: '2px solid var(--adm-primary)' } : undefined}>
                  <div className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md" style={{ background: 'var(--adm-card)', boxShadow: 'var(--adm-shadow)' }}><Check g={g} /></div>
                  <button type="button" onClick={() => setPreview(g)} aria-label={`Preview ${g.main.label}`} className="relative block aspect-[16/10] w-full overflow-hidden" style={{ background: 'var(--adm-track)' }}>
                    {thumb
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
                      : <span className="flex h-full w-full items-center justify-center"><FontAwesomeIcon icon={iconFor(g.main)} className="h-10 w-10" style={{ color: 'var(--adm-muted)' }} /></span>}
                    <span className="absolute bottom-2 left-2"><StatusPill tone="neutral">{kind(g.main.table_name)}</StatusPill></span>
                    {g.rows.length > 1 && <span className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(var(--brand-black-rgb), 0.65)', color: 'var(--brand-white)' }}>+{g.rows.length - 1} related</span>}
                  </button>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: 'var(--adm-text)' }} title={g.main.label}>{g.main.label || g.main.record_id}</p>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--adm-muted)' }}>
                        Deleted {ago(g.deleted_at).toLowerCase()}{g.main.table_name === 'media_assets' && formatBytes(g.main.size) ? ` · ${formatBytes(g.main.size)}` : ''}
                      </p>
                    </div>
                    <div className="mt-auto"><Actions g={g} /></div>
                  </div>
                </Surface>
              </li>
            );
          })}
        </ul>
      ) : (
        <Surface className="overflow-hidden">
          <ul>
            {visible.map((g) => {
              const thumb = thumbOf(g.main);
              return (
                <li key={g.batch} className="flex flex-wrap items-center gap-4 border-b px-4 py-3 last:border-b-0" style={{ borderColor: 'var(--adm-border)', background: selected.has(g.batch) ? 'var(--adm-primary-soft)' : undefined }}>
                  <Check g={g} />
                  <button type="button" onClick={() => setPreview(g)} aria-label={`Preview ${g.main.label}`} className="flex h-12 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ background: 'var(--adm-track)' }}>
                    {thumb
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
                      : <FontAwesomeIcon icon={iconFor(g.main)} className="h-5 w-5" style={{ color: 'var(--adm-muted)' }} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>{g.main.label || g.main.record_id}</p>
                    <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>{kind(g.main.table_name)}{g.rows.length > 1 ? ` · +${g.rows.length - 1} related` : ''} · Deleted {ago(g.deleted_at).toLowerCase()}</p>
                  </div>
                  <Actions g={g} />
                </li>
              );
            })}
          </ul>
        </Surface>
      )}

      {preview && <PreviewModal group={preview} thumb={thumbOf(preview.main)} trashUrl={trashUrl} onClose={() => setPreview(null)} onRestore={() => restore(preview)} onPurge={() => purge(preview)} />}
    </AdminLayout>
  );
}

const SKIP = new Set(['id', 'created_at', 'updated_at', 'legacy_id', 'user_id', 'content', 'storage_path', 'public_url']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function PreviewModal({ group, thumb, trashUrl, onClose, onRestore, onPurge }: { group: Group; thumb: string | null; trashUrl: (p: string) => string; onClose: () => void; onRestore: () => void; onPurge: () => void }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const m = group.main;
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.from('trash_items').select('data').eq('id', m.id).maybeSingle().then(({ data: row }) => { if (!cancelled) setData((row?.data as Record<string, unknown> | undefined) ?? {}); });
    return () => { cancelled = true; };
  }, [supabase, m.id]);

  const url = m.table_name === 'media_assets' && m.path ? trashUrl(m.path) : null;
  const mime = m.mime ?? '';
  const fields = Object.entries(data ?? {})
    .filter(([k, v]) => !SKIP.has(k) && !k.endsWith('_id') && v !== null && v !== '' && typeof v !== 'object' && !UUID.test(String(v)))
    .slice(0, 14);

  return (
    <Modal
      title={m.label || kind(m.table_name)}
      subtitle={`${kind(m.table_name)}, deleted ${ago(group.deleted_at).toLowerCase()}`}
      maxWidth="max-w-3xl"
      onClose={onClose}
      footer={<><Button variant="secondary" onClick={onPurge}>Delete forever</Button><Button onClick={onRestore}><FontAwesomeIcon icon={faRotateLeft} className="mr-2 h-3 w-3" />Restore</Button></>}
    >
      {url ? (
        <div className="mb-4 overflow-hidden rounded-[var(--adm-radius-control)]" style={{ background: 'var(--adm-track)' }}>
          {mime.startsWith('image/') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={m.label} className="mx-auto max-h-[60vh] w-auto max-w-full object-contain" />
          ) : mime === 'application/pdf' ? (
            <iframe src={url} title={`Preview of ${m.label}`} className="h-[60vh] w-full" />
          ) : mime.startsWith('video/') ? (
            <video src={url} controls className="mx-auto max-h-[60vh] w-full" />
          ) : mime.startsWith('audio/') ? (
            <audio src={url} controls className="w-full p-4" />
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <FontAwesomeIcon icon={faFile} className="h-10 w-10" style={{ color: 'var(--adm-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--adm-text-2)' }}>This file type cannot be previewed here.</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold underline" style={{ color: 'var(--adm-primary)' }}>Open the file in a new tab</a>
            </div>
          )}
        </div>
      ) : thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="mx-auto mb-4 max-h-72 w-auto max-w-full rounded-[var(--adm-radius-control)] object-contain" />
      ) : null}

      {data === null ? (
        <ListSkeleton />
      ) : fields.length > 0 && (
        <dl className="space-y-2 text-sm">
          {fields.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="flex-shrink-0 font-medium capitalize" style={{ color: 'var(--adm-muted)' }}>{k.replace(/_/g, ' ')}</dt>
              <dd className="break-words text-right" style={{ color: 'var(--adm-text)' }}>{String(v).length > 160 ? `${String(v).slice(0, 160)}...` : String(v)}</dd>
            </div>
          ))}
        </dl>
      )}

      {group.rows.length > 1 && (
        <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--adm-border)' }}>
          <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Deleted together ({group.rows.length - 1}). Restoring brings them all back.</p>
          <ul className="flex flex-wrap gap-2">
            {group.rows.slice(1, 13).map((r) => <li key={r.id}><StatusPill tone="neutral">{kind(r.table_name)}: {r.label}</StatusPill></li>)}
            {group.rows.length > 13 && <li className="text-xs" style={{ color: 'var(--adm-muted)' }}>and {group.rows.length - 13} more</li>}
          </ul>
        </div>
      )}
    </Modal>
  );
}
