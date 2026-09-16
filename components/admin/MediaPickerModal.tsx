'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faFolder, faSpinner, faCheck, faUpload,
  faImage, faFilePdf, faFileVideo, faFile,
} from '@fortawesome/free-solid-svg-icons';

const BRAND = '#139EA2';

interface Folder { id: string; name: string; slug: string; }
interface Asset {
  id: string; folder_id: string; name: string;
  storage_path: string; public_url: string;
  size_bytes: number | null; mime_type: string | null;
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

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export default function MediaPickerModal({ open, onClose, onSelect }: Props) {
  const supabase = createBrowserClient();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFolders = useCallback(async () => {
    const { data } = await supabase.from('media_folders').select('id, name, slug').order('name');
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

  useEffect(() => {
    if (open) { fetchFolders(); fetchAssets(null); setSelected(null); }
  }, [open, fetchFolders, fetchAssets]);

  useEffect(() => {
    if (open) fetchAssets(activeFolderId);
  }, [activeFolderId, open, fetchAssets]);

  const activeFolder = folders.find(f => f.id === activeFolderId) ?? null;

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || !activeFolderId || !activeFolder) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
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
      void ext;
    }
    setUploading(false);
    fetchAssets(activeFolderId);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <h2 className="text-white font-semibold text-sm">Media Library</h2>
          <button onClick={onClose} style={{ color: '#6B7280' }}>
            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Folder sidebar */}
          <div className="w-52 flex-shrink-0 border-r overflow-y-auto flex flex-col"
            style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#111' }}>
            <button
              onClick={() => setActiveFolderId(null)}
              className="px-4 py-2.5 text-left text-xs font-medium transition"
              style={{
                color: activeFolderId === null ? '#fff' : '#9CA3AF',
                background: activeFolderId === null ? BRAND : 'transparent',
              }}
            >
              All Media
            </button>
            {folders.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFolderId(f.id)}
                className="px-4 py-2.5 text-left text-xs flex items-center gap-2 transition"
                style={{
                  color: activeFolderId === f.id ? '#fff' : '#9CA3AF',
                  background: activeFolderId === f.id ? BRAND : 'transparent',
                }}
              >
                <FontAwesomeIcon icon={faFolder} className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>

          {/* Asset grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b flex items-center gap-3 flex-shrink-0"
              style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <span className="text-xs flex-1" style={{ color: '#6B7280' }}>
                {activeFolder ? activeFolder.name : 'All Media'} ({assets.length})
              </span>
              {activeFolderId && (
                <>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,video/mp4,application/pdf"
                    className="hidden" onChange={e => handleUpload(e.target.files)} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-60"
                    style={{ background: BRAND }}
                  >
                    {uploading
                      ? <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
                      : <FontAwesomeIcon icon={faUpload} className="w-3 h-3" />}
                    Upload
                  </button>
                </>
              )}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 animate-spin" style={{ color: BRAND }} />
                </div>
              ) : assets.length === 0 ? (
                <p className="text-center text-xs py-16" style={{ color: '#6B7280' }}>
                  {activeFolderId ? 'No files in this folder yet.' : 'No media uploaded yet.'}
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {assets.map(a => {
                    const isImg = a.mime_type?.startsWith('image/');
                    const isSelected = selected === a.public_url;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelected(isSelected ? null : a.public_url)}
                        className="rounded-lg overflow-hidden text-left relative transition"
                        style={{
                          border: `2px solid ${isSelected ? BRAND : 'rgba(255,255,255,0.07)'}`,
                          background: '#0A0A0A',
                        }}
                      >
                        {isImg ? (
                          <img src={a.public_url} alt={a.name}
                            className="w-full aspect-square object-cover" />
                        ) : (
                          <div className="w-full aspect-square flex items-center justify-center">
                            <FontAwesomeIcon icon={fileIcon(a.mime_type)} className="w-8 h-8" style={{ color: '#4B5563' }} />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: BRAND }}>
                            <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        <div className="px-2 py-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <p className="text-[10px] truncate" style={{ color: '#9CA3AF' }}>{a.name}</p>
                          <p className="text-[10px]" style={{ color: '#6B7280' }}>{fmtSize(a.size_bytes)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex items-center justify-between flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <p className="text-xs" style={{ color: '#6B7280' }}>
            {selected ? 'Asset selected' : 'Click an asset to select it'}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF' }}>
              Cancel
            </button>
            <button
              onClick={() => selected && onSelect(selected)}
              disabled={!selected}
              className="px-4 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-40"
              style={{ background: BRAND }}
            >
              Use This File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
