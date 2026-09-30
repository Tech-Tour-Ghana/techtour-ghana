'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { useRef, useState } from 'react';

import { ACCEPT_ATTR } from '@/lib/media/files';

/** Drag-and-drop target that is also a real button, so keyboard users can open the file picker. */
export default function MediaDropzone({ onFiles, compact = false }: { onFiles: (files: File[]) => void; compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const take = (list: FileList | null) => {
    if (list && list.length) onFiles(Array.from(list));
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) setOver(false); }}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
      className={`flex flex-col items-center justify-center rounded-[var(--adm-radius-card)] border-2 border-dashed text-center transition-colors ${compact ? 'gap-1 px-4 py-4' : 'gap-2 px-6 py-10'}`}
      style={{
        borderColor: over ? 'var(--adm-primary)' : 'var(--adm-border)',
        background: over ? 'var(--adm-primary-soft)' : 'var(--adm-bg)',
        color: 'var(--adm-text)',
      }}
    >
      <FontAwesomeIcon
        icon={faCloudArrowUp}
        className={`h-6 w-6 ${over ? 'animate-bounce motion-reduce:animate-none' : ''}`}
        style={{ color: 'var(--adm-primary)' }}
      />
      <p className="text-sm font-semibold">{over ? 'Drop to upload' : 'Drag and drop files here'}</p>
      <p className="text-xs" style={{ color: 'var(--adm-muted)' }}>
        or{' '}
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="font-semibold underline underline-offset-2 focus-visible:outline focus-visible:outline-2"
          style={{ color: 'var(--adm-primary)' }}
        >
          choose files
        </button>
      </p>
      {!compact && <p className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>JPEG, PNG, WebP, AVIF, GIF (10 MB), MP4, PDF (50 MB)</p>}
      <input ref={input} type="file" multiple accept={ACCEPT_ATTR} className="sr-only" tabIndex={-1} aria-label="Choose files to upload"
        onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
    </div>
  );
}
