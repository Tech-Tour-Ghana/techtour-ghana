'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import AdminLayout from '@/components/AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolder, faFolderPlus, faUpload, faTrash, faCopy,
  faSpinner, faTimes, faImage, faFilePdf, faFileVideo, faFile,
  faCheck, faPencil, faImages,
} from '@fortawesome/free-solid-svg-icons';

const BRAND = '#139EA2';
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
  const { isDimMode } = useTheme();
  const supabase = createBrowserClient();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [folderModal, setFolderModal] = useState<{ open: boolean; id: string | null; name: string; description: string }>({
    open: false, id: null, name: '', description: '',
  });
  const [savingFolder, setSavingFolder] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'folder' | 'asset'; id: string; label: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const ts = {
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    sidebarBg: isDimMode ? '#111111' : '#F9FAFB',
    textPrimary: isDimMode ? '#FFFFFF' : '#111827',
    textSecondary: isDimMode ? '#B0B0B0' : '#4B5563',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
    inputBg: isDimMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    inputBorder: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
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

  async function saveFolder() {
    if (!folderModal.name.trim()) return;
    setSavingFolder(true);
    const slug = toSlug(folderModal.name);
    if (folderModal.id) {
      await supabase.from('media_folders').update({ name: folderModal.name, description: folderModal.description || null }).eq('id', folderModal.id);
    } else {
      await supabase.from('media_folders').insert({ name: folderModal.name, slug, description: folderModal.description || null });
    }
    setSavingFolder(false);
    setFolderModal({ open: false, id: null, name: '', description: '' });
    fetchFolders();
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || !activeFolderId || !activeFolder) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${activeFolder.slug}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from('media').upload(path, file, { upsert: false });
      if (error) continue;
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
      await supabase.from('media_assets').insert({
        folder_id: activeFolderId,
        name: file.name,
        storage_path: path,
        public_url: publicUrl,
        size_bytes: file.size,
        mime_type: file.type || null,
      });
    }
    setUploading(false);
    fetchAssets(activeFolderId);
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'folder') {
      const folderAssets = assets.filter(a => a.folder_id === deleteConfirm.id);
      for (const a of folderAssets) {
        await supabase.storage.from('media').remove([a.storage_path]);
      }
      await supabase.from('media_folders').delete().eq('id', deleteConfirm.id);
      if (activeFolderId === deleteConfirm.id) setActiveFolderId(null);
      fetchFolders();
      fetchAssets(activeFolderId);
    } else {
      const asset = assets.find(a => a.id === deleteConfirm.id);
      if (asset) await supabase.storage.from('media').remove([asset.storage_path]);
      await supabase.from('media_assets').delete().eq('id', deleteConfirm.id);
      fetchAssets(activeFolderId);
    }
    setDeleteConfirm(null);
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <AdminLayout title="Media Library" subtitle="Upload and organise site assets">
      <div className="flex gap-4 h-[calc(100vh-140px)]">

        {/* Folder sidebar */}
        <div className="w-56 flex-shrink-0 rounded-xl flex flex-col overflow-hidden"
          style={{ background: ts.cardBg, border: `1px solid ${ts.border}` }}>
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
                  style={{ color: activeFolderId === f.id ? 'rgba(255,255,255,0.7)' : '#EF4444' }}
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
        <div className="flex-1 rounded-xl flex flex-col overflow-hidden"
          style={{ background: ts.cardBg, border: `1px solid ${ts.border}` }}>

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

          {/* Asset grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 animate-spin" style={{ color: BRAND }} />
              </div>
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
              <div className="grid grid-cols-5 gap-3">
                {assets.map(a => {
                  const isImg = a.mime_type?.startsWith('image/');
                  const isCopied = copied === a.public_url;
                  return (
                    <div key={a.id} className="group rounded-xl overflow-hidden flex flex-col"
                      style={{ border: `1px solid ${ts.border}`, background: isDimMode ? '#111' : '#F9FAFB' }}>
                      {/* Thumbnail */}
                      <div className="relative aspect-square overflow-hidden"
                        style={{ background: isDimMode ? '#0A0A0A' : '#E5E7EB' }}>
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
                            style={{ background: isCopied ? '#10B981' : BRAND }}
                            title="Copy URL"
                          >
                            <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} className="w-3.5 h-3.5 text-white" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'asset', id: a.id, label: a.name })}
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: '#EF4444' }}
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

      {/* Folder modal */}
      {folderModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4"
            style={{ background: ts.cardBg, border: `1px solid ${ts.border}` }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: ts.textPrimary }}>
                {folderModal.id ? 'Rename Folder' : 'New Folder'}
              </h3>
              <button onClick={() => setFolderModal({ open: false, id: null, name: '', description: '' })}
                style={{ color: ts.textMuted }}>
                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: ts.textSecondary }}>Name *</label>
              <input style={inputStyle} value={folderModal.name}
                onChange={e => setFolderModal(s => ({ ...s, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && saveFolder()}
                placeholder="e.g. Tour Images" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: ts.textSecondary }}>Description</label>
              <input style={inputStyle} value={folderModal.description}
                onChange={e => setFolderModal(s => ({ ...s, description: e.target.value }))}
                placeholder="Optional note about this folder" />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setFolderModal({ open: false, id: null, name: '', description: '' })}
                className="px-4 py-2 rounded-lg text-xs font-medium"
                style={{ background: ts.inputBg, color: ts.textSecondary, border: `1px solid ${ts.inputBorder}` }}>
                Cancel
              </button>
              <button onClick={saveFolder} disabled={savingFolder || !folderModal.name.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-60"
                style={{ background: BRAND }}>
                {savingFolder && <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />}
                {folderModal.id ? 'Save' : 'Create Folder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4"
            style={{ background: ts.cardBg, border: `1px solid ${ts.border}` }}>
            <h3 className="text-sm font-semibold" style={{ color: ts.textPrimary }}>
              Delete {deleteConfirm.type === 'folder' ? 'Folder' : 'File'}?
            </h3>
            <p className="text-xs" style={{ color: ts.textSecondary }}>
              {deleteConfirm.type === 'folder'
                ? `Deleting "${deleteConfirm.label}" will permanently remove the folder and all files inside it.`
                : `"${deleteConfirm.label}" will be permanently deleted from storage.`}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium"
                style={{ background: ts.inputBg, color: ts.textSecondary, border: `1px solid ${ts.inputBorder}` }}>
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="px-4 py-2 rounded-lg text-xs font-medium text-white"
                style={{ background: '#EF4444' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
