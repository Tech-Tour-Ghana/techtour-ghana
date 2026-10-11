'use client';

// The reusable asset manager. mode="manage" is the admin Media page; "single" and
// "multiple" are used by MediaPicker so the same list, search, upload and
// metadata editing work everywhere an image can be chosen.

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp, faFolder, faFolderOpen, faGrip, faList, faMagnifyingGlass, faPencil, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, EmptyBlock, IconButton, ListSkeleton, Modal, Surface, confirmAction, fieldStyle } from '@/components/admin/ui';
import { notify } from '@/components/admin/toast';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  PAGE_SIZE, TRASH_PREFIX, countUsage, deleteMedia, listFolders, listMedia,
  type MediaAsset, type MediaFilter, type MediaFolder, type MediaSort,
} from '@/lib/media/client';
import { slugify } from '@/lib/seo/slug';
import MediaCard from './MediaCard';
import MediaDetails from './MediaDetails';
import MediaDropzone from './MediaDropzone';
import MediaUploadQueue from './MediaUploadQueue';
import { useUploader } from './useUploader';
import { ACCEPT_ATTR } from '@/lib/media/files';

function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return match;
}

export type LibraryMode = 'manage' | 'single' | 'multiple';

const FILTERS: { key: MediaFilter; label: string }[] = [
  { key: 'all', label: 'All files' },
  { key: 'images', label: 'Images' },
  { key: 'other', label: 'Other media' },
  { key: 'recent', label: 'Recently uploaded' },
  { key: 'missing-alt', label: 'Missing alt text' },
];
const SORTS: { key: MediaSort; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'name', label: 'Filename' },
  { key: 'largest', label: 'Largest' },
  { key: 'smallest', label: 'Smallest' },
];

interface Props {
  mode?: LibraryMode;
  /** Called whenever the picked set changes (pick modes). */
  onSelectionChange?: (assets: MediaAsset[]) => void;
  /** "Use image" button in the details panel (pick modes). */
  onUse?: (asset: MediaAsset) => void;
  /** Asset that should be selected and shown once the list loads, e.g. one just uploaded. */
  focusId?: string | null;
  defaultFilter?: MediaFilter;
}

export default function MediaLibrary({ mode = 'manage', onSelectionChange, onUse, focusId, defaultFilter = 'all' }: Props) {
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filter, setFilter] = useState<MediaFilter>(defaultFilter);
  const [sort, setSort] = useState<MediaSort>('newest');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<MediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<MediaAsset[]>([]);
  const [active, setActive] = useState<MediaAsset | null>(null);
  const [folderModal, setFolderModal] = useState<{ id: string | null; name: string } | null>(null);
  const [folderDelete, setFolderDelete] = useState<MediaFolder | null>(null);
  const [reload, setReload] = useState(0);
  // Bulk mode (manage only): clicking a file ticks it instead of opening its details.
  const [bulk, setBulk] = useState(false);
  const [ticked, setTicked] = useState<MediaAsset[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const wide = useMediaQuery('(min-width: 1280px)');
  const fileInput = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { setPage(0); }, [debounced, filter, sort, folderId]);

  const loadFolders = useCallback(() => listFolders().then(setFolders).catch(() => notify('Could not load folders.')), []);
  useEffect(() => { loadFolders(); }, [loadFolders]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listMedia({ search: debounced, filter, sort, folderId, page })
      .then(({ rows: r, total: t }) => { if (!cancelled) { setRows(r); setTotal(t); setError(''); } })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debounced, filter, sort, folderId, page, reload]);

  useEffect(() => {
    if (!focusId) return;
    const hit = rows.find((r) => r.id === focusId);
    if (hit) { setActive(hit); setSelected(mode === 'multiple' ? (s) => (s.some((x) => x.id === hit.id) ? s : [...s, hit]) : [hit]); }
  }, [focusId, rows, mode]);

  useEffect(() => { onSelectionChange?.(selected); }, [selected, onSelectionChange]);

  const uploadFolder = useMemo(
    () => folders.find((f) => f.id === folderId) ?? folders.find((f) => f.slug === 'general') ?? folders[0] ?? null,
    [folders, folderId],
  );
  const uploader = useUploader(() => uploadFolder, () => { setPage(0); setSort('newest'); setReload((n) => n + 1); });

  const click = (a: MediaAsset) => {
    if (bulk) { setTicked((t) => (t.some((x) => x.id === a.id) ? t.filter((x) => x.id !== a.id) : [...t, a])); return; }
    setActive(a);
    if (mode === 'single') setSelected([a]);
    if (mode === 'multiple') setSelected((s) => (s.some((x) => x.id === a.id) ? s.filter((x) => x.id !== a.id) : [...s, a]));
  };

  const patchRow = (a: MediaAsset) => {
    setRows((r) => r.map((x) => (x.id === a.id ? a : x)));
    setSelected((s) => s.map((x) => (x.id === a.id ? a : x)));
    setActive(a);
  };
  const dropRow = (id: string) => {
    setRows((r) => r.filter((x) => x.id !== id));
    setSelected((s) => s.filter((x) => x.id !== id));
    setActive(null);
    setTotal((t) => Math.max(0, t - 1));
  };

  async function saveFolder() {
    if (!folderModal || !folderModal.name.trim()) return;
    const supabase = createBrowserClient();
    const name = folderModal.name.trim();
    const { error: err } = folderModal.id
      ? await supabase.from('media_folders').update({ name }).eq('id', folderModal.id)
      : await supabase.from('media_folders').insert({ name, slug: slugify(name) });
    if (err) return notify('Could not save the folder. The name may already be in use.');
    setFolderModal(null);
    loadFolders();
  }

  async function removeFolder(folder: MediaFolder) {
    const supabase = createBrowserClient();
    const { data } = await supabase.from('media_assets').select('storage_path').eq('folder_id', folder.id);
    const paths = (data ?? []).map((a) => a.storage_path);
    // Moved, not erased: the files appear in Trash with the folder and come back with it.
    if (paths.length) await Promise.all(paths.map((path) => supabase.storage.from('media').move(path, TRASH_PREFIX + path)));
    const { error: err } = await supabase.from('media_folders').delete().eq('id', folder.id);
    if (err) return notify('Could not delete the folder.');
    setFolderDelete(null);
    if (folderId === folder.id) setFolderId(null);
    loadFolders();
    setReload((n) => n + 1);
    notify('Folder deleted.', 'success');
  }

  const tickedIds = new Set(ticked.map((t) => t.id));
  const allPageTicked = rows.length > 0 && rows.every((r) => tickedIds.has(r.id));
  const leaveBulk = () => { setBulk(false); setTicked([]); };

  async function deleteTicked() {
    if (ticked.length === 0) return;
    const usage = (await Promise.all(ticked.map((a) => countUsage(a).catch(() => 0)))).reduce((n, u) => n + u, 0);
    const warn = usage > 0 ? ` They are used in ${usage} place${usage === 1 ? '' : 's'}; those images will break.` : '';
    if (!(await confirmAction({ title: 'Move to Trash?', message: `Move ${ticked.length} file${ticked.length === 1 ? '' : 's'} to the Trash? You can restore them from there.${warn}`, danger: true, confirmLabel: `Move ${ticked.length} to Trash` }))) return;
    setBulkBusy(true);
    let failed = 0;
    for (const a of ticked) {
      try { await deleteMedia(a); } catch { failed += 1; }
    }
    setBulkBusy(false);
    const done = ticked.length - failed;
    if (failed) notify(`${done} moved to Trash, ${failed} could not be deleted.`);
    else notify(done === 1 ? 'File moved to Trash.' : `${done} files moved to Trash.`, 'success');
    setActive(null);
    leaveBulk();
    setReload((n) => n + 1);
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeFolder = folders.find((f) => f.id === folderId) ?? null;
  const selectedIds = new Set(selected.map((s) => s.id));
  const filtering = !!debounced || filter !== 'all';
  const emptyLibrary = !loading && total === 0 && !filtering && !folderId;

  const details = active && (
    <MediaDetails asset={active} onUpdated={patchRow} onDeleted={dropRow} onUse={mode === 'manage' ? undefined : onUse} />
  );

  const dnd = {
    onDragEnter: (e: React.DragEvent) => { if (e.dataTransfer.types.includes('Files')) { dragDepth.current += 1; setDragging(true); } },
    onDragOver: (e: React.DragEvent) => { if (e.dataTransfer.types.includes('Files')) e.preventDefault(); },
    onDragLeave: () => { dragDepth.current = Math.max(0, dragDepth.current - 1); if (dragDepth.current === 0) setDragging(false); },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      if (e.dataTransfer.files.length) uploader.addFiles(Array.from(e.dataTransfer.files));
    },
  };

  return (
    <div className="flex min-h-0 gap-5">
      {/* Folders */}
      <aside className="hidden w-52 flex-shrink-0 md:block" aria-label="Folders">
        <Surface className="p-2">
          <div className="mb-1 flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>Folders</span>
            <IconButton title="New folder" onClick={() => setFolderModal({ id: null, name: '' })}><FontAwesomeIcon icon={faPlus} className="h-3 w-3" /></IconButton>
          </div>
          <ul className="space-y-0.5">
            {[{ id: null as string | null, name: 'All media' }, ...folders].map((f) => {
              const on = folderId === f.id;
              const real = folders.find((x) => x.id === f.id);
              return (
                <li key={f.id ?? 'all'} className="group relative">
                  <button
                    type="button"
                    onClick={() => setFolderId(f.id)}
                    aria-current={on ? 'true' : undefined}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors"
                    style={{ background: on ? 'var(--adm-primary-soft)' : 'transparent', color: on ? 'var(--adm-primary)' : 'var(--adm-text-2)', fontWeight: on ? 700 : 500 }}
                  >
                    <FontAwesomeIcon icon={on ? faFolderOpen : faFolder} className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </button>
                  {mode === 'manage' && real && (
                    <span className="absolute right-1 top-1/2 flex -translate-y-1/2 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                      <button type="button" aria-label={`Rename ${real.name}`} onClick={() => setFolderModal({ id: real.id, name: real.name })} className="rounded p-1.5" style={{ color: 'var(--adm-muted)' }}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></button>
                      <button type="button" aria-label={`Delete ${real.name}`} onClick={() => setFolderDelete(real)} className="rounded p-1.5" style={{ color: 'var(--adm-error)' }}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </Surface>
      </aside>

      {/* Files */}
      <div className="relative min-w-0 flex-1" {...dnd}>
        <input ref={fileInput} type="file" multiple accept={ACCEPT_ATTR} className="sr-only" tabIndex={-1} aria-label="Choose files to upload"
          onChange={(e) => { if (e.target.files?.length) uploader.addFiles(Array.from(e.target.files)); e.target.value = ''; }} />

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select aria-label="Folder" value={folderId ?? ''} onChange={(e) => setFolderId(e.target.value || null)} className="px-3 py-2 text-sm md:hidden" style={fieldStyle}>
            <option value="">All media</option>
            {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <div className="relative min-w-[10rem] flex-1">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2" style={{ color: 'var(--adm-muted)' }} />
            <input aria-label="Search media" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files" className="w-full py-2 pl-8 pr-3 text-sm" style={fieldStyle} />
          </div>
          <Button onClick={() => fileInput.current?.click()}>
            <FontAwesomeIcon icon={faCloudArrowUp} className="mr-2 h-3.5 w-3.5" />Upload
          </Button>
          {mode === 'manage' && (
            <Button variant="secondary" onClick={() => (bulk ? leaveBulk() : (setBulk(true), setActive(null)))} aria-pressed={bulk}>{bulk ? 'Done' : 'Select'}</Button>
          )}
          <select aria-label="Filter" value={filter} onChange={(e) => setFilter(e.target.value as MediaFilter)} className="px-3 py-2 text-sm" style={fieldStyle}>
            {FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as MediaSort)} className="px-3 py-2 text-sm" style={fieldStyle}>
            {SORTS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
          </select>
          <div className="flex overflow-hidden" style={{ borderRadius: 'var(--adm-radius-control)', border: '1px solid var(--adm-border)' }}>
            {(['grid', 'list'] as const).map((v) => (
              <button key={v} type="button" aria-label={`${v} view`} aria-pressed={view === v} onClick={() => setView(v)} className="px-3 py-2 text-xs"
                style={{ background: view === v ? 'var(--adm-primary-soft)' : 'var(--adm-card)', color: view === v ? 'var(--adm-primary)' : 'var(--adm-muted)' }}>
                <FontAwesomeIcon icon={v === 'grid' ? faGrip : faList} className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>

        <MediaUploadQueue items={uploader.items} onRetry={uploader.retry} onRemove={uploader.remove} onClearFinished={uploader.clearFinished} />

        {!emptyLibrary && (
          <p className="mb-3 mt-1 text-xs" style={{ color: 'var(--adm-muted)' }}>
            <strong style={{ color: 'var(--adm-text-2)' }}>{activeFolder ? activeFolder.name : 'All media'}</strong> · {total} file{total === 1 ? '' : 's'}
            {mode !== 'manage' ? '' : ' · drag files here to upload'}
          </p>
        )}

        {bulk && rows.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-[var(--adm-radius-control)] px-4 py-2.5 text-sm" style={{ background: ticked.length ? 'var(--adm-primary-soft)' : 'var(--adm-track)', color: 'var(--adm-text)' }}>
            <label className="flex cursor-pointer items-center gap-2 font-medium">
              <input type="checkbox" checked={allPageTicked} onChange={() => setTicked((t) => (allPageTicked ? t.filter((x) => !rows.some((r) => r.id === x.id)) : [...t, ...rows.filter((r) => !tickedIds.has(r.id))]))} className="h-4 w-4" style={{ accentColor: 'var(--adm-primary)' }} />
              {allPageTicked ? 'Deselect this page' : `Select this page (${rows.length})`}
            </label>
            <span aria-live="polite" className="text-xs" style={{ color: 'var(--adm-text-2)' }}>{ticked.length} selected</span>
            {ticked.length > 0 && (
              <div className="ml-auto flex gap-2">
                <Button variant="danger" onClick={deleteTicked} disabled={bulkBusy}><FontAwesomeIcon icon={faTrash} className="mr-2 h-3 w-3" />{bulkBusy ? 'Deleting...' : `Delete ${ticked.length}`}</Button>
                <Button variant="secondary" onClick={() => setTicked([])} disabled={bulkBusy}>Clear</Button>
              </div>
            )}
          </div>
        )}

        {error ? (
          <p role="alert" className="rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>
            {error} <button type="button" className="font-semibold underline" onClick={() => setReload((n) => n + 1)}>Try again</button>
          </p>
        ) : loading && rows.length === 0 ? (
          <ListSkeleton />
        ) : emptyLibrary ? (
          <MediaDropzone onFiles={uploader.addFiles} />
        ) : rows.length === 0 ? (
          <Surface><EmptyBlock title="No files match" body={folderId && !filtering ? 'This folder is empty. Drag files here to add some.' : 'Try a different search or filter.'} /></Surface>
        ) : (
          <div
            className={view === 'grid' ? 'grid gap-3' : 'space-y-2'}
            style={{ opacity: loading ? 0.6 : 1, ...(view === 'grid' ? { gridTemplateColumns: 'repeat(auto-fill, minmax(9.5rem, 1fr))' } : {}) }}
          >
            {rows.map((a) => (
              <MediaCard key={a.id} asset={a} view={view} multiple={mode === 'multiple' || bulk} selected={bulk ? tickedIds.has(a.id) : mode === 'manage' ? active?.id === a.id : selectedIds.has(a.id)} onClick={() => click(a)} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="mt-5 flex items-center justify-center gap-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>
            <Button variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span>Page {page + 1} of {pages}</span>
            <Button variant="secondary" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}

        {dragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[var(--adm-radius-card)] border-2 border-dashed" style={{ background: 'color-mix(in srgb, var(--adm-primary) 10%, var(--adm-bg))', borderColor: 'var(--adm-primary)', color: 'var(--adm-primary)' }}>
            <FontAwesomeIcon icon={faCloudArrowUp} className="h-8 w-8 animate-bounce motion-reduce:animate-none" />
            <p className="text-sm font-bold">Drop files to upload{uploadFolder ? ` to ${uploadFolder.name}` : ''}</p>
          </div>
        )}
      </div>

      {/* Details: a side panel on wide screens, a dialog otherwise */}
      {wide && active && (
        <aside className="w-80 flex-shrink-0" aria-label="Details">
          <Surface className="sticky top-0 max-h-[calc(100vh-9rem)] overflow-y-auto p-4">{details}</Surface>
        </aside>
      )}
      {!wide && active && (
        <Modal title="File details" maxWidth="max-w-md" onClose={() => setActive(null)}>{details}</Modal>
      )}

      {folderModal && (
        <Modal title={folderModal.id ? 'Rename folder' : 'New folder'} maxWidth="max-w-sm" onClose={() => setFolderModal(null)}
          footer={<><Button variant="secondary" onClick={() => setFolderModal(null)}>Cancel</Button><Button onClick={saveFolder} disabled={!folderModal.name.trim()}>Save</Button></>}>
          <label htmlFor="folder-name" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Name</label>
          <input id="folder-name" autoFocus value={folderModal.name} onChange={(e) => setFolderModal({ ...folderModal, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && saveFolder()} className="w-full px-3 py-2 text-sm" style={fieldStyle} />
        </Modal>
      )}
      {folderDelete && (
        <Modal title="Move folder to Trash?" maxWidth="max-w-sm" onClose={() => setFolderDelete(null)}
          footer={<><Button variant="secondary" onClick={() => setFolderDelete(null)}>Cancel</Button><Button variant="danger" onClick={() => removeFolder(folderDelete)}>Delete</Button></>}>
          <p className="text-xs" style={{ color: 'var(--adm-text-2)' }}>“{folderDelete.name}” and every file inside it will be moved to the Trash.</p>
        </Modal>
      )}
    </div>
  );
}
