'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faDownload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';

import { Button, Modal, fieldStyle } from '@/components/admin/ui';
import { notify } from '@/components/admin/toast';
import { formatBytes } from '@/lib/media/files';
import { countUsage, deleteMedia, updateMedia, type MediaAsset } from '@/lib/media/client';
import { isImage } from './MediaCard';

const label = 'block text-xs font-semibold mb-1';

export default function MediaDetails({
  asset,
  onUpdated,
  onDeleted,
  onUse,
}: {
  asset: MediaAsset;
  onUpdated: (a: MediaAsset) => void;
  onDeleted: (id: string) => void;
  /** Present only when the library is open as a picker. */
  onUse?: (a: MediaAsset) => void;
}) {
  const [form, setForm] = useState({ alt_text: asset.alt_text, title: asset.title, caption: asset.caption, description: asset.description, is_decorative: asset.is_decorative });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<{ usage: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setForm({ alt_text: asset.alt_text, title: asset.title, caption: asset.caption, description: asset.description, is_decorative: asset.is_decorative });
  }, [asset.id, asset.alt_text, asset.title, asset.caption, asset.description, asset.is_decorative]);

  const dirty = form.alt_text !== asset.alt_text || form.title !== asset.title || form.caption !== asset.caption || form.description !== asset.description || form.is_decorative !== asset.is_decorative;
  const image = isImage(asset);

  async function save() {
    setSaving(true);
    try {
      const saved = await updateMedia(asset.id, { ...form, alt_text: form.is_decorative ? '' : form.alt_text.trim() });
      onUpdated(saved);
      notify('Details saved.', 'success');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(asset.public_url);
      notify('URL copied.', 'success');
    } catch {
      notify('Could not copy the URL.');
    }
  }

  async function askDelete() {
    setConfirm({ usage: await countUsage(asset).catch(() => 0) });
  }

  async function remove() {
    setDeleting(true);
    try {
      await deleteMedia(asset);
      onDeleted(asset.id);
      setConfirm(null);
      notify('File deleted.', 'success');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not delete.');
    } finally {
      setDeleting(false);
    }
  }

  const meta: [string, string][] = [
    ['File name', asset.name],
    ['Type', asset.mime_type ?? '-'],
    ['Dimensions', asset.width && asset.height ? `${asset.width} × ${asset.height} px` : '-'],
    ['Size', formatBytes(asset.size_bytes)],
    ['Uploaded', asset.created_at ? new Date(asset.created_at).toLocaleString('en-GB') : '-'],
  ];

  return (
    <aside aria-label="Asset details" className="space-y-4">
      <div className="flex max-h-56 items-center justify-center overflow-hidden rounded-[var(--adm-radius-control)]" style={{ background: 'var(--adm-track)' }}>
        {image
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={asset.public_url} alt={asset.alt_text} className="max-h-56 w-full object-contain" />
          : <p className="p-8 text-xs" style={{ color: 'var(--adm-muted)' }}>No preview</p>}
      </div>

      <dl className="space-y-1 text-xs">
        {meta.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3">
            <dt style={{ color: 'var(--adm-muted)' }}>{k}</dt>
            <dd className="min-w-0 truncate text-right font-medium" style={{ color: 'var(--adm-text)' }} title={v}>{v}</dd>
          </div>
        ))}
      </dl>

      {image && (
        <div>
          <label className="mb-2 flex items-center gap-2 text-xs" style={{ color: 'var(--adm-text-2)' }}>
            <input type="checkbox" checked={form.is_decorative} onChange={(e) => setForm({ ...form, is_decorative: e.target.checked })} />
            This image is decorative (no alt text needed)
          </label>
          <label className={label} htmlFor="media-alt" style={{ color: 'var(--adm-text-2)' }}>Alt text</label>
          <textarea id="media-alt" rows={2} disabled={form.is_decorative} value={form.alt_text} onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
            placeholder="Describe what the image shows" className="w-full px-3 py-2 text-sm disabled:opacity-50" style={fieldStyle} />
          {!form.is_decorative && !form.alt_text.trim() && <p className="mt-1 text-[11px]" style={{ color: 'var(--adm-warning, #B45309)' }}>Alt text is missing. It helps accessibility and search.</p>}
        </div>
      )}
      <div>
        <label className={label} htmlFor="media-title" style={{ color: 'var(--adm-text-2)' }}>Title</label>
        <input id="media-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 text-sm" style={fieldStyle} />
      </div>
      <div>
        <label className={label} htmlFor="media-caption" style={{ color: 'var(--adm-text-2)' }}>Caption</label>
        <input id="media-caption" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="w-full px-3 py-2 text-sm" style={fieldStyle} />
      </div>
      <div>
        <label className={label} htmlFor="media-desc" style={{ color: 'var(--adm-text-2)' }}>Description</label>
        <textarea id="media-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 text-sm" style={fieldStyle} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={!dirty || saving}>{saving ? 'Saving…' : 'Save details'}</Button>
        {onUse && <Button variant="secondary" onClick={() => onUse(asset)}>Use image</Button>}
        <Button variant="secondary" onClick={copy}><FontAwesomeIcon icon={faCopy} className="mr-1.5 h-3 w-3" />Copy URL</Button>
        <a href={asset.public_url} download={asset.name} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 text-xs font-semibold" style={{ borderRadius: 'var(--adm-radius-control)', background: 'var(--adm-card)', color: 'var(--adm-text)', border: '1px solid var(--adm-border)' }}>
          <FontAwesomeIcon icon={faDownload} className="mr-1.5 h-3 w-3" />Download
        </a>
        <Button variant="danger" onClick={askDelete}><FontAwesomeIcon icon={faTrash} className="mr-1.5 h-3 w-3" />Delete</Button>
      </div>

      {confirm && (
        <Modal title="Delete file?" maxWidth="max-w-sm" onClose={() => setConfirm(null)}
          footer={<>
            <Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={remove} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</Button>
          </>}
        >
          <p className="text-xs" style={{ color: 'var(--adm-text-2)' }}>
            “{asset.name}” will be permanently deleted from storage.
            {confirm.usage > 0 && <strong style={{ color: 'var(--adm-error)' }}> It is used in {confirm.usage} article{confirm.usage > 1 ? 's' : ''}; those images will break.</strong>}
          </p>
        </Modal>
      )}
    </aside>
  );
}
