'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolder, faSpinner, faCheck, faUpload,
  faImage, faFilePdf, faFileVideo, faFile,
} from '@fortawesome/free-solid-svg-icons';

import { Button, EmptyBlock, ListSkeleton, Modal } from '@/components/admin/ui';

const BRAND = 'var(--adm-primary)';

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
  const [notice, setNotice] = useState('');
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

  if (!open) return null;

  return (
    <Modal
      title="Media Library"
      maxWidth="max-w-4xl"
      flush
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>
            {selected ? 'Asset selected' : 'Click an asset to select it'}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={() => selected && onSelect(selected)} disabled={!selected}>Use This File</Button>
          </div>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Folder sidebar */}
        <div className="flex max-h-32 flex-shrink-0 flex-col overflow-y-auto border-b md:max-h-none md:w-52 md:border-b-0 md:border-r"
          style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-bg)' }}>
          {[{ id: null as string | null, name: 'All Media' }, ...folders].map(f => {
            const active = activeFolderId === f.id;
            return (
              <button
                key={f.id ?? 'all'}
                onClick={() => setActiveFolderId(f.id)}
                className="flex items-center gap-2 px-4 py-2.5 text-left text-xs font-medium transition"
                style={{ color: active ? '#fff' : 'var(--adm-text-2)', background: active ? BRAND : 'transparent' }}
              >
                {f.id && <FontAwesomeIcon icon={faFolder} className="h-3 w-3 flex-shrink-0" />}
                <span className="truncate">{f.name}</span>
              </button>
            );
          })}
        </div>

        {/* Asset grid */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex flex-shrink-0 items-center gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--adm-border)' }}>
            <span className="flex-1 text-xs" style={{ color: 'var(--adm-muted)' }}>
              {activeFolder ? activeFolder.name : 'All Media'} ({assets.length})
            </span>
            {activeFolderId && (
              <>
                <input ref={fileInputRef} type="file" multiple accept="image/*,video/mp4,application/pdf"
                  className="hidden" onChange={e => handleUpload(e.target.files)} />
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  <FontAwesomeIcon icon={uploading ? faSpinner : faUpload} className={`mr-1.5 h-3 w-3 ${uploading ? 'animate-spin' : ''}`} />
                  Upload
                </Button>
              </>
            )}
          </div>
          {notice && <p role="alert" className="px-4 py-2 text-xs" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{notice}</p>}

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <ListSkeleton />
            ) : assets.length === 0 ? (
              <EmptyBlock title={activeFolderId ? 'No files in this folder yet' : 'No media uploaded yet'} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {assets.map(a => {
                  const isImg = a.mime_type?.startsWith('image/');
                  const isSelected = selected === a.public_url;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelected(isSelected ? null : a.public_url)}
                      className="relative overflow-hidden rounded-lg text-left transition"
                      style={{ border: `2px solid ${isSelected ? BRAND : 'var(--adm-border)'}`, background: 'var(--adm-bg)' }}
                    >
                      {isImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.public_url} alt={a.name} className="aspect-square w-full object-cover" />
                      ) : (
                        <div className="flex aspect-square w-full items-center justify-center">
                          <FontAwesomeIcon icon={fileIcon(a.mime_type)} className="h-8 w-8" style={{ color: 'var(--adm-muted)' }} />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full" style={{ background: BRAND }}>
                          <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                      <div className="px-2 py-1.5" style={{ borderTop: '1px solid var(--adm-border)' }}>
                        <p className="truncate text-[10px]" style={{ color: 'var(--adm-text-2)' }}>{a.name}</p>
                        <p className="text-[10px]" style={{ color: 'var(--adm-muted)' }}>{fmtSize(a.size_bytes)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
