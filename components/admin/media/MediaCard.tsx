'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faFile, faFilePdf, faFileVideo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import { formatBytes } from '@/lib/media/files';
import type { MediaAsset } from '@/lib/media/client';

export const isImage = (a: Pick<MediaAsset, 'mime_type'>) => !!a.mime_type?.startsWith('image/');
export const needsAlt = (a: MediaAsset) => isImage(a) && !a.is_decorative && !a.alt_text.trim();
const fileIcon = (mime: string | null) => (mime === 'application/pdf' ? faFilePdf : mime?.startsWith('video/') ? faFileVideo : faFile);
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const dims = (a: MediaAsset) => (a.width && a.height ? `${a.width}×${a.height}` : '');

function Thumb({ asset, className }: { asset: MediaAsset; className: string }) {
  return (
    <div className={`flex items-center justify-center overflow-hidden ${className}`} style={{ background: 'var(--adm-track)' }}>
      {isImage(asset)
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={asset.public_url} alt={asset.alt_text} loading="lazy" className="h-full w-full object-cover" />
        : <FontAwesomeIcon icon={fileIcon(asset.mime_type)} className="h-7 w-7" style={{ color: 'var(--adm-muted)' }} />}
    </div>
  );
}

export default function MediaCard({
  asset,
  view,
  selected,
  multiple,
  onClick,
}: {
  asset: MediaAsset;
  view: 'grid' | 'list';
  selected: boolean;
  multiple: boolean;
  onClick: () => void;
}) {
  const missing = needsAlt(asset);
  const ring = selected ? '2px solid var(--adm-primary)' : '1px solid var(--adm-border)';

  const check = (
    <span
      aria-hidden
      className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full"
      style={{ background: selected ? 'var(--adm-primary)' : 'rgba(0,0,0,0.35)', border: '1px solid #fff', color: '#fff', opacity: selected || multiple ? 1 : 0 }}
    >
      {selected && <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />}
    </span>
  );

  if (view === 'list') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className="flex w-full items-center gap-3 rounded-[var(--adm-radius-control)] p-2 text-left"
        style={{ border: ring, background: 'var(--adm-card)' }}
      >
        <Thumb asset={asset} className="h-12 w-12 flex-shrink-0 rounded-md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>{asset.name}</p>
          <p className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>{[dims(asset), formatBytes(asset.size_bytes), fmtDate(asset.created_at)].filter(Boolean).join(' · ')}</p>
        </div>
        {missing && <span className="flex flex-shrink-0 items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--adm-warning, #B45309)' }}><FontAwesomeIcon icon={faTriangleExclamation} className="h-3 w-3" />No alt text</span>}
        {selected && <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--adm-primary)' }} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="group relative overflow-hidden rounded-[var(--adm-radius-control)] text-left transition-shadow hover:shadow-md"
      style={{ border: ring, background: 'var(--adm-card)' }}
    >
      <Thumb asset={asset} className="aspect-square w-full" />
      {check}
      {missing && (
        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'var(--adm-card)', color: 'var(--adm-warning, #B45309)', border: '1px solid var(--adm-border)' }}>
          <FontAwesomeIcon icon={faTriangleExclamation} className="h-2.5 w-2.5" />Alt text
        </span>
      )}
      <div className="px-2.5 py-2">
        <p className="truncate text-xs font-semibold" style={{ color: 'var(--adm-text)' }} title={asset.name}>{asset.name}</p>
        <p className="truncate text-[11px]" style={{ color: 'var(--adm-muted)' }}>{[dims(asset), formatBytes(asset.size_bytes)].filter(Boolean).join(' · ')}</p>
        <p className="text-[10px]" style={{ color: 'var(--adm-muted)' }}>{fmtDate(asset.created_at)}</p>
      </div>
    </button>
  );
}
