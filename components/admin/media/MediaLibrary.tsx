'use client';

// The reusable asset manager. mode="manage" is the admin Media page; "single" and
// "multiple" are used by MediaPicker so the same list, search, upload and
// metadata editing work everywhere an image can be chosen.

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderPlus, faGrip, faList, faMagnifyingGlass, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button, EmptyBlock, ListSkeleton, Modal, fieldStyle } from '@/components/admin/ui';
import { notify } from '@/components/admin/toast';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  PAGE_SIZE, listFolders, listMedia,
  type MediaAsset, type MediaFilter, type MediaFolder, type MediaSort,
} from '@/lib/media/client';
import { slugify } from '@/lib/seo/slug';
import MediaCard from './MediaCard';
import MediaDetails from './MediaDetails';
import MediaDropzone from './MediaDropzone';
import MediaUploadQueue from './MediaUploadQueue';
import { useUploader } from './useUploader';

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
    if (paths.length) await supabase.storage.from('media').remove(paths);
    const { error: err } = await supabase.from('media_folders').delete().eq('id', folder.id);
    if (err) return notify('Could not delete the folder.');
    setFolderDelete(null);
    if (folderId === folder.id) setFolderId(null);
    loadFolders();
    setReload((n) => n + 1);
    notify('Folder deleted.', 'success');
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeFolder = folders.find((f) => f.id === folderId) ?? null;
  const selectedIds = new Set(selected.map((s) => s.id));
  const filtering = !!debounced || filter !== 'all' || !!folderId;

  return (
    <div className="flex min-h-0 flex-col gap-4 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <MediaDropzone onFiles={uploader.addFiles} compact={total > 0} />
        <MediaUploadQueue items={uploader.items} onRetry={uploader.retry} onRemove={uploader.remove} onClearFinished={uploader.clearFinished} />

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2" style={{ color: 'var(--adm-muted)' }} />
            <input aria-label="Search media" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search filename, title or alt text"
              className="w-full py-2 pl-8 pr-3 text-sm" style={fieldStyle} />
          </div>
          <select aria-label="Filter" value={filter} onChange={(e) => setFilter(e.target.value as MediaFilter)} className="px-3 py-2 text-sm" style={fieldStyle}>
            {FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as MediaSort)} className="px-3 py-2 text-sm" style={fieldStyle}>
            {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select aria-label="Folder" value={folderId ?? ''} onChange={(e) => setFolderId(e.target.value || null)} className="px-3 py-2 text-sm" style={fieldStyle}>
            <option value="">All folders</option>
            {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <div className="flex overflow-hidden" style={{ borderRadius: 'var(--adm-radius-control)', border: '1px solid var(--adm-border)' }}>
            {(['grid', 'list'] as const).map((v) => (
              <button key={v} type="button" aria-label={`${v} view`} aria-pressed={view === v} onClick={() => setView(v)} className="px-3 py-2 text-xs"
                style={{ background: view === v ? 'var(--adm-primary)' : 'var(--adm-card)', color: view === v ? '#fff' : 'var(--adm-text-2)' }}>
                <FontAwesomeIcon icon={v === 'grid' ? faGrip : faList} className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--adm-muted)' }}>
          <span>{total} file{total === 1 ? '' : 's'}{activeFolder ? ` in ${activeFolder.name}` : ''}</span>
          <span className="flex-1" />
          <Button variant="secondary" className="!px-3 !py-1.5" onClick={() => setFolderModal({ id: null, name: '' })}>
            <FontAwesomeIcon icon={faFolderPlus} className="mr-1.5 h-3 w-3" />New folder
          </Button>
          {activeFolder && (
            <>
              <Button variant="secondary" className="!px-3 !py-1.5" onClick={() => setFolderModal({ id: activeFolder.id, name: activeFolder.name })}>
                <FontAwesomeIcon icon={faPencil} className="mr-1.5 h-3 w-3" />Rename
              </Button>
              <Button variant="danger" className="!px-3 !py-1.5" onClick={() => setFolderDelete(activeFolder)}>
                <FontAwesomeIcon icon={faTrash} className="mr-1.5 h-3 w-3" />Delete folder
              </Button>
            </>
          )}
        </div>

        {error ? (
          <p role="alert" className="rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>
            {error} <button type="button" className="font-semibold underline" onClick={() => setReload((n) => n + 1)}>Try again</button>
          </p>
        ) : loading && rows.length === 0 ? (
          <ListSkeleton />
        ) : rows.length === 0 ? (
          <EmptyBlock
            title={filtering ? 'No files match' : 'No media uploaded yet'}
            body={filtering ? 'Try a different search or filter.' : 'Drag files into the box above to add your first image.'}
          />
        ) : (
          <div
            className={view === 'grid' ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4' : 'space-y-2'}
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {rows.map((a) => (
              <MediaCard key={a.id} asset={a} view={view} multiple={mode === 'multiple'} selected={mode === 'manage' ? active?.id === a.id : selectedIds.has(a.id)} onClick={() => click(a)} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>
            <Button variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span>Page {page + 1} of {pages}</span>
            <Button variant="secondary" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </div>

      <div className="w-full flex-shrink-0 lg:w-80">
        <div className="rounded-[var(--adm-radius-card)] p-4 lg:sticky lg:top-0" style={{ background: 'var(--adm-card)', border: '1px solid var(--adm-border)', boxShadow: 'var(--adm-shadow)' }}>
          {active ? (
            <MediaDetails asset={active} onUpdated={patchRow} onDeleted={dropRow} onUse={mode === 'manage' ? undefined : onUse} />
          ) : (
            <p className="py-8 text-center text-xs" style={{ color: 'var(--adm-muted)' }}>Select a file to see its details and edit its alt text.</p>
          )}
        </div>
      </div>

      {folderModal && (
        <Modal title={folderModal.id ? 'Rename folder' : 'New folder'} maxWidth="max-w-sm" onClose={() => setFolderModal(null)}
          footer={<><Button variant="secondary" onClick={() => setFolderModal(null)}>Cancel</Button><Button onClick={saveFolder} disabled={!folderModal.name.trim()}>Save</Button></>}>
          <label htmlFor="folder-name" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Name</label>
          <input id="folder-name" autoFocus value={folderModal.name} onChange={(e) => setFolderModal({ ...folderModal, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && saveFolder()} className="w-full px-3 py-2 text-sm" style={fieldStyle} />
        </Modal>
      )}
      {folderDelete && (
        <Modal title="Delete folder?" maxWidth="max-w-sm" onClose={() => setFolderDelete(null)}
          footer={<><Button variant="secondary" onClick={() => setFolderDelete(null)}>Cancel</Button><Button variant="danger" onClick={() => removeFolder(folderDelete)}>Delete</Button></>}>
          <p className="text-xs" style={{ color: 'var(--adm-text-2)' }}>“{folderDelete.name}” and every file inside it will be permanently deleted.</p>
        </Modal>
      )}
    </div>
  );
}
