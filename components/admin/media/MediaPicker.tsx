'use client';

// Opens the Media Library as a dialog so any editor can pick or upload an image
// without leaving the page.
//
//   <MediaPicker open={open} mode="single" onClose={...} onSelect={(assets) => ...} />

import { useCallback, useState } from 'react';

import { Button, Modal } from '@/components/admin/ui';
import type { MediaAsset } from '@/lib/media/client';
import MediaLibrary, { type LibraryMode } from './MediaLibrary';

export interface MediaPickerProps {
  open: boolean;
  mode?: Exclude<LibraryMode, 'manage'>;
  title?: string;
  onClose: () => void;
  onSelect: (assets: MediaAsset[]) => void;
}

export default function MediaPicker({ open, mode = 'single', title = 'Media Library', onClose, onSelect }: MediaPickerProps) {
  const [selected, setSelected] = useState<MediaAsset[]>([]);
  const onSelectionChange = useCallback((a: MediaAsset[]) => setSelected(a), []);

  if (!open) return null;
  return (
    <Modal
      title={title}
      subtitle="Pick a file, or drag new ones in to upload them."
      maxWidth="max-w-6xl"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={selected.length === 0} onClick={() => onSelect(selected)}>
            {mode === 'multiple' ? `Use ${selected.length || ''} selected`.trim() : 'Use this file'}
          </Button>
        </>
      }
    >
      <MediaLibrary mode={mode} defaultFilter="images" onSelectionChange={onSelectionChange} onUse={(a) => onSelect([a])} />
    </Modal>
  );
}
