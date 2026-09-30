'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { Button, ListSkeleton, Modal, reportError } from '@/components/admin/ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolder, faFolderPlus, faUpload, faTrash, faCopy,
  faSpinner, faImage, faFilePdf, faFileVideo, faFile,
  faCheck, faPencil, faImages,
} from '@fortawesome/free-solid-svg-icons';

const BRAND = 'var(--adm-primary)';
const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

interface Folder { id: string; name: string; slug: string; description: string | null; }
interface Asset {
  id: string; folder_id: string; name: string;
  storage_path: string; public_url: string;
  size_bytes: number | null; mime_type: string | null; created_at: string;
}

function fileIcon(mime: string | null) {
  if (!mime) return faFile;
  if (mime.startsWith('image/')) return faImage;
  if (mime.startsWith('video/')) return faFileVideo;
  if (mime === 'application/pdf') return faFilePdf;
  return faFile;
}

function fmtSize(bytes: number | null) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function MediaLibraryPage() {
  const supabase = createBrowserClient();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [folderError, setFolderError] = useState('');

  const [folderModal, setFolderModal] = useState<{ open: boolean; id: string | null; name: string; description: string }>({
    open: false, id: null, name: '', description: '',
  });
  const [savingFolder, setSavingFolder] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'folder' | 'asset'; id: string; label: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const ts = {
    cardBg: 'var(--adm-card)',
    sidebarBg: 'var(--adm-bg)',
    textPrimary: 'var(--adm-text)',
    textSecondary: 'var(--adm-text-2)',
    textMuted: 'var(--adm-muted)',
    border: 'var(--adm-border)',
    inputBg: 'var(--adm-bg)',
    inputBorder: 'var(--adm-border)',
  };

  const inputStyle: React.CSSProperties = {
    background: ts.inputBg, border: `1px solid ${ts.inputBorder}`, color: ts.textPrimary,
    borderRadius: 8, padding: '7px 10px', fontSize: 13, width: '100%', outline: 'none',
  };

  const fetchFolders = useCallback(async () => {
    const { data } = await supabase.from('media_folders').select('*').order('name');
    setFolders((data ?? []) as Folder[]);
  }, [supabase]);

  const fetchAssets = useCallback(async (folderId: string | null) => {
    setLoading(true);
    let q = supabase.from('media_assets').select('*').order('created_at', { ascending: false });
    if (folderId) q = q.eq('folder_id', folderId);
    const { data } = await q;
    setAssets((data ?? []) as Asset[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);
  useEffect(() => { fetchAssets(activeFolderId); }, [activeFolderId, fetchAssets]);

  const activeFolder = folders.find(f => f.id === activeFolderId) ?? null;

  const closeFolderModal = () => { setFolderError(''); setFolderModal({ open: false, id: null, name: '', description: '' }); };

  async function saveFolder() {
    if (!folderModal.name.trim()) return;
    setSavingFolder(true);
    setFolderError('');
    const slug = toSlug(folderModal.name);
    const { error } = folderModal.id
      ? await supabase.from('media_folders').update({ name: folderModal.name, description: folderModal.description || null }).eq('id', folderModal.id)
      : await supabase.from('media_folders').insert({ name: folderModal.name, slug, description: folderModal.description || null });
    setSavingFolder(false);
    if (error) { setFolderError('Could not save the folder. The name may already be in use.'); return; }
    setFolderModal({ open: false, id: null, name: '', description: '' });
    fetchFolders();
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || !activeFolderId || !activeFolder) return;
    setUploading(true);
    setNotice('');
    let failed = 0;
    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${activeFolder.slug}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from('media').upload(path, file, { upsert: false });
      if (error) { failed++; continue; }
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
      const { error: rowErr } = await supabase.from('media_assets').insert({
        folder_id: activeFolderId,
        name: file.name,
        storage_path: path,
        public_url: publicUrl,
        size_bytes: file.size,
        mime_type: file.type || null,
      });
      if (rowErr) {
        failed++;
        await supabase.storage.from('media').remove([path]);
      }
    }
    setUploading(false);
    if (failed) setNotice(`${failed} file${failed > 1 ? 's' : ''} could not be uploaded.`);
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchAssets(activeFolderId);
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'folder') {
      const { data: folderAssets } = await supabase.from('media_assets').select('storage_path').eq('folder_id', deleteConfirm.id);
      const paths = (folderAssets ?? []).map(a => a.storage_path);
      if (paths.length) await supabase.storage.from('media').remove(paths);
      const { error } = await supabase.from('media_folders').delete().eq('id', deleteConfirm.id);
      if (error) { setNotice('Could not delete the folder.'); setDeleteConfirm(null); return; }
      const next = activeFolderId === deleteConfirm.id ? null : activeFolderId;
      setActiveFolderId(next);
      fetchFolders();
      fetchAssets(next);
    } else {
      const asset = assets.find(a => a.id === deleteConfirm.id);
      if (asset) await supabase.storage.from('media').remove([asset.storage_path]);
      reportError((await supabase.from('media_assets').delete().eq('id', deleteConfirm.id)).error);
      fetchAssets(activeFolderId);
    }
    setDeleteConfirm(null);
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(url);
      setTimeout(() => setCopied(null), 2000);
    }, () => setNotice('Could not copy the link.'));
  }

  return (
    <AdminLayout title="Media Library" subtitle="Upload and organise site assets">
      <div className="flex flex-col gap-4 md:h-[calc(100vh-140px)] md:flex-row">

        {/* Folder sidebar */}
        <div className="max-h-56 w-full flex-shrink-0 rounded-[var(--adm-radius-card)] flex flex-col overflow-hidden md:max-h-none md:w-56"
          style={{ background: ts.cardBg, border: `1px solid ${ts.border}`, boxShadow: 'var(--adm-shadow)' }}>
          <div className="px-3 py-3 border-b flex items-center justify-between"
            style={{ borderColor: ts.border }}>
            <span className="text-xs font-semibold" style={{ color: ts.textMuted }}>Folders</span>
            <button
              onClick={() => setFolderModal({ open: true, id: null, name: '', description: '' })}
              className="w-6 h-6 rounded-lg flex items-center justify-center transition hover:opacity-80"
              style={{ background: `${BRAND}22`, color: BRAND }}
              title="New folder"
            >
              <FontAwesomeIcon icon={faFolderPlus} className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            <button
              onClick={() => setActiveFolderId(null)}
              className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition rounded-lg mx-1"
              style={{
                width: 'calc(100% - 8px)',
                color: activeFolderId === null ? '#fff' : ts.textSecondary,
                background: activeFolderId === null ? BRAND : 'transparent',
              }}
            >
              <FontAwesomeIcon icon={faImages} className="w-3 h-3 flex-shrink-0" />
              All Media
            </button>

            {folders.map(f => (
              <div key={f.id} className="group flex items-center gap-1 mx-1 rounded-lg"
                style={{ background: activeFolderId === f.id ? BRAND : 'transparent' }}>
                <button
                  onClick={() => setActiveFolderId(f.id)}
                  className="flex-1 px-2 py-2 text-left text-xs flex items-center gap-2 truncate"
                  style={{ color: activeFolderId === f.id ? '#fff' : ts.textSecondary }}
                >
                  <FontAwesomeIcon icon={faFolder} className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{f.name}</span>
                </button>
                <button
                  onClick={() => setFolderModal({ open: true, id: f.id, name: f.name, description: f.description ?? '' })}
                  className="opacity-0 group-hover:opacity-100 p-1 transition"
                  style={{ color: activeFolderId === f.id ? 'rgba(255,255,255,0.7)' : ts.textMuted }}
                  title="Rename"
                >
                  <FontAwesomeIcon icon={faPencil} className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={() => setDeleteConfirm({ type: 'folder', id: f.id, label: f.name })}
                  className="opacity-0 group-hover:opacity-100 p-1 pr-2 transition"
                  style={{ color: activeFolderId === f.id ? 'rgba(255,255,255,0.7)' : 'var(--adm-error)' }}
                  title="Delete folder"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}

            {folders.length === 0 && (
              <p className="px-3 py-4 text-[11px] text-center" style={{ color: ts.textMuted }}>
                No folders yet. Create one to start uploading.
              </p>
            )}
          </div>
        </div>

        {/* Main panel */}
        <div className="min-h-[24rem] min-w-0 flex-1 rounded-[var(--adm-radius-card)] flex flex-col overflow-hidden"
          style={{ background: ts.cardBg, border: `1px solid ${ts.border}`, boxShadow: 'var(--adm-shadow)' }}>

          {/* Toolbar */}
          <div className="px-4 py-3 border-b flex items-center gap-3 flex-shrink-0"
            style={{ borderColor: ts.border }}>
            <span className="text-sm font-semibold flex-1" style={{ color: ts.textPrimary }}>
              {activeFolder ? activeFolder.name : 'All Media'}
              <span className="ml-2 text-xs font-normal" style={{ color: ts.textMuted }}>
                {assets.length} file{assets.length !== 1 ? 's' : ''}
              </span>
            </span>

            {activeFolderId ? (
              <>
                <input ref={fileInputRef} type="file" multiple
                  accept="image/*,video/mp4,application/pdf"
                  className="hidden"
                  onChange={e => handleUpload(e.target.files)} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                  style={{ background: BRAND }}
                >
                  {uploading
                    ? <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
                    : <FontAwesomeIcon icon={faUpload} className="w-3 h-3" />}
                  Upload Files
                </button>
              </>
            ) : (
              <span className="text-xs" style={{ color: ts.textMuted }}>
                Select a folder to upload files
              </span>
            )}
          </div>

          {notice && <p role="alert" className="px-4 py-2 text-xs" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{notice}</p>}

          {/* Asset grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <ListSkeleton />
            ) : assets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <FontAwesomeIcon icon={faImages} className="w-10 h-10" style={{ color: ts.border }} />
                <p className="text-sm" style={{ color: ts.textMuted }}>
                  {activeFolderId ? 'No files in this folder yet.' : 'No media uploaded yet.'}
                </p>
                {activeFolderId && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white"
                    style={{ background: BRAND }}
                  >
                    <FontAwesomeIcon icon={faUpload} className="w-3 h-3" />
                    Upload your first file
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {assets.map(a => {
                  const isImg = a.mime_type?.startsWith('image/');
                  const isCopied = copied === a.public_url;
                  return (
                    <div key={a.id} className="group rounded-xl overflow-hidden flex flex-col"
                      style={{ border: `1px solid ${ts.border}`, background: 'var(--adm-bg)' }}>
                      {/* Thumbnail */}
                      <div className="relative aspect-square overflow-hidden"
                        style={{ background: 'var(--adm-border)' }}>
                        {isImg ? (
                          <img src={a.public_url} alt={a.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FontAwesomeIcon icon={fileIcon(a.mime_type)} className="w-8 h-8" style={{ color: ts.textMuted }} />
                          </div>
                        )}
                        {/* Hover overlay */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2"
                          style={{ background: 'rgba(0,0,0,0.55)' }}>
                          <button
                            onClick={() => copyUrl(a.public_url)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: isCopied ? 'var(--adm-success)' : BRAND }}
                            title="Copy URL"
                          >
                            <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} className="w-3.5 h-3.5 text-white" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'asset', id: a.id, label: a.name })}
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'var(--adm-error)' }}
                            title="Delete"
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      </div>
                      {/* Meta */}
                      <div className="px-2 py-1.5">
                        <p className="text-[11px] font-medium truncate" style={{ color: ts.textSecondary }} title={a.name}>{a.name}</p>
                        <p className="text-[10px]" style={{ color: ts.textMuted }}>{fmtSize(a.size_bytes)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {folderModal.open && (
        <Modal
          title={folderModal.id ? 'Rename Folder' : 'New Folder'}
          maxWidth="max-w-sm"
          onClose={closeFolderModal}
          footer={
            <>
              <Button variant="secondary" onClick={closeFolderModal}>Cancel</Button>
              <Button onClick={saveFolder} disabled={savingFolder || !folderModal.name.trim()}>
                {folderModal.id ? 'Save' : 'Create Folder'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: ts.textSecondary }}>Name *</label>
              <input style={inputStyle} value={folderModal.name}
                onChange={e => setFolderModal(m => ({ ...m, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && saveFolder()}
                placeholder="e.g. Tour Images" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: ts.textSecondary }}>Description</label>
              <input style={inputStyle} value={folderModal.description}
                onChange={e => setFolderModal(m => ({ ...m, description: e.target.value }))}
                placeholder="Optional note about this folder" />
            </div>
            {folderError && <p role="alert" className="text-xs" style={{ color: 'var(--adm-error)' }}>{folderError}</p>}
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal
          title={`Delete ${deleteConfirm.type === 'folder' ? 'Folder' : 'File'}?`}
          maxWidth="max-w-sm"
          onClose={() => setDeleteConfirm(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete}>Delete</Button>
            </>
          }
        >
          <p className="text-xs" style={{ color: ts.textSecondary }}>
            {deleteConfirm.type === 'folder'
              ? `Deleting "${deleteConfirm.label}" will permanently remove the folder and all files inside it.`
              : `"${deleteConfirm.label}" will be permanently deleted from storage.`}
          </p>
        </Modal>
      )}
    </AdminLayout>
  );
}
