'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRotateRight, faCircleCheck, faFile, faXmark } from '@fortawesome/free-solid-svg-icons';

import { formatBytes } from '@/lib/media/files';
import type { QueueItem } from './useUploader';

export default function MediaUploadQueue({
  items,
  onRetry,
  onRemove,
  onClearFinished,
}: {
  items: QueueItem[];
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  onClearFinished: () => void;
}) {
  if (!items.length) return null;
  const finished = items.some((i) => i.status === 'done');
  return (
    <div className="rounded-[var(--adm-radius-control)] border p-3" style={{ borderColor: 'var(--adm-border)', background: 'var(--adm-card)' }}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>Uploads</p>
        {finished && (
          <button type="button" onClick={onClearFinished} className="text-[11px] font-semibold" style={{ color: 'var(--adm-primary)' }}>Clear finished</button>
        )}
      </div>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-md" style={{ background: 'var(--adm-track)' }}>
              {i.previewUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={i.previewUrl} alt="" className="h-full w-full object-cover" />
                : <FontAwesomeIcon icon={faFile} className="h-4 w-4" style={{ color: 'var(--adm-muted)' }} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-xs font-medium" style={{ color: 'var(--adm-text)' }}>{i.file.name}</p>
                <span className="flex-shrink-0 text-[11px]" style={{ color: 'var(--adm-muted)' }}>{formatBytes(i.file.size)}</span>
              </div>
              {i.status === 'error' ? (
                <p role="alert" className="text-[11px]" style={{ color: 'var(--adm-error)' }}>{i.error}</p>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--adm-track)' }} role="progressbar" aria-valuenow={i.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Upload progress for ${i.file.name}`}>
                    <div className="h-full rounded-full transition-[width]" style={{ width: `${i.progress}%`, background: i.status === 'done' ? 'var(--adm-success)' : 'var(--adm-primary)' }} />
                  </div>
                  <span className="w-16 flex-shrink-0 text-right text-[11px]" style={{ color: 'var(--adm-muted)' }}>
                    {i.status === 'queued' ? 'Waiting' : i.status === 'done' ? 'Done' : `${i.progress}%`}
                  </span>
                </div>
              )}
            </div>
            {i.status === 'done' && <FontAwesomeIcon icon={faCircleCheck} className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--adm-success)' }} aria-label="Uploaded" />}
            {i.status === 'error' && (
              <button type="button" onClick={() => onRetry(i.id)} aria-label={`Retry ${i.file.name}`} className="flex-shrink-0 p-1" style={{ color: 'var(--adm-primary)' }}>
                <FontAwesomeIcon icon={faArrowRotateRight} className="h-3.5 w-3.5" />
              </button>
            )}
            {i.status !== 'done' && (
              <button type="button" onClick={() => onRemove(i.id)} aria-label={i.status === 'uploading' ? `Cancel ${i.file.name}` : `Remove ${i.file.name}`} className="flex-shrink-0 p-1" style={{ color: 'var(--adm-muted)' }}>
                <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
