'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImages, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useRef, useState } from 'react';

import MediaDropzone from '@/components/admin/media/MediaDropzone';
import { Button, fieldStyle } from '@/components/admin/ui';
import { notify } from '@/components/admin/toast';
import { uploadToGeneral } from '@/lib/media/client';

interface Props {
  url: string;
  alt: string;
  onChange: (next: { url: string; alt: string }) => void;
  onChoose: () => void;
}

/** Featured image: choose from the Media Library or drop a new file, which is added to the library. */
export default function FeaturedImagePicker({ url, alt, onChange, onChoose }: Props) {
  const [progress, setProgress] = useState<number | null>(null);
  const abort = useRef<AbortController | null>(null);

  async function upload(files: File[]) {
    const file = files[0];
    if (!file) return;
    abort.current = new AbortController();
    setProgress(0);
    try {
      const asset = await uploadToGeneral(file, setProgress, abort.current.signal);
      onChange({ url: asset.public_url, alt: asset.is_decorative ? '' : asset.alt_text });
      notify('Image uploaded to the Media Library.', 'success');
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) notify(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setProgress(null);
    }
  }

  if (progress !== null) {
    return (
      <div className="rounded-[var(--adm-radius-control)] p-4 text-center" style={{ border: '1px dashed var(--adm-border)' }}>
        <p className="mb-2 text-xs font-semibold" style={{ color: 'var(--adm-text)' }}>Uploading… {progress}%</p>
        <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--adm-track)' }} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'var(--adm-primary)' }} />
        </div>
        <button type="button" onClick={() => abort.current?.abort()} className="mt-2 text-[11px] font-semibold" style={{ color: 'var(--adm-muted)' }}>Cancel</button>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="space-y-2">
        <MediaDropzone onFiles={upload} compact />
        <Button variant="secondary" className="w-full" onClick={onChoose}><FontAwesomeIcon icon={faImages} className="mr-2 h-3 w-3" />Choose from Media Library</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className="aspect-video w-full rounded-[var(--adm-radius-control)] object-cover" />
      <div>
        <label htmlFor="featured-alt" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Alt text</label>
        <input id="featured-alt" value={alt} onChange={(e) => onChange({ url, alt: e.target.value })} placeholder="Describe what the image shows" className="w-full px-3 py-2 text-sm" style={fieldStyle} />
        {!alt.trim() && (
          <p className="mt-1 flex items-center gap-1 text-[11px]" style={{ color: '#B45309' }}>
            <FontAwesomeIcon icon={faTriangleExclamation} className="h-3 w-3" />Alt text is missing. It helps accessibility and search.
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onChoose}>Replace</Button>
        <Button variant="danger" onClick={() => onChange({ url: '', alt: '' })}>Remove</Button>
      </div>
      <p className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>To edit the caption or title, open this file in the Media Library.</p>
    </div>
  );
}
