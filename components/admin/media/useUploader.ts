'use client';

// Upload queue: files start uploading straight away, two at a time, and each one
// reports its own progress and error so a bad file never blocks the rest.

import { useCallback, useEffect, useRef, useState } from 'react';

import { uploadMedia, type MediaAsset, type MediaFolder } from '@/lib/media/client';

export interface QueueItem {
  id: string;
  file: File;
  previewUrl: string | null;
  progress: number;
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
  asset?: MediaAsset;
}

const CONCURRENCY = 2;

export function useUploader(getFolder: () => Pick<MediaFolder, 'id' | 'slug'> | null, onUploaded: (asset: MediaAsset) => void) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const itemsRef = useRef<QueueItem[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const active = useRef(0);
  const callbacks = useRef({ getFolder, onUploaded });
  useEffect(() => { callbacks.current = { getFolder, onUploaded }; });

  const commit = useCallback((next: QueueItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const patch = useCallback((id: string, change: Partial<QueueItem>) => {
    commit(itemsRef.current.map((i) => (i.id === id ? { ...i, ...change } : i)));
  }, [commit]);

  const pump = useCallback(() => {
    while (active.current < CONCURRENCY) {
      const next = itemsRef.current.find((i) => i.status === 'queued');
      if (!next) return;
      const folder = callbacks.current.getFolder();
      if (!folder) {
        patch(next.id, { status: 'error', error: 'Choose a folder first.' });
        continue;
      }
      active.current += 1;
      const controller = new AbortController();
      controllers.current.set(next.id, controller);
      patch(next.id, { status: 'uploading', progress: 0, error: undefined });
      uploadMedia(next.file, folder, (progress) => patch(next.id, { progress }), controller.signal)
        .then((asset) => {
          patch(next.id, { status: 'done', progress: 100, asset });
          callbacks.current.onUploaded(asset);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          patch(next.id, { status: 'error', error: err instanceof Error ? err.message : 'Upload failed.' });
        })
        .finally(() => {
          controllers.current.delete(next.id);
          active.current -= 1;
          pump();
        });
    }
  }, [patch]);

  const addFiles = useCallback((files: File[]) => {
    const added: QueueItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      progress: 0,
      status: 'queued',
    }));
    commit([...itemsRef.current, ...added]);
    pump();
  }, [commit, pump]);

  const retry = useCallback((id: string) => {
    patch(id, { status: 'queued', progress: 0, error: undefined });
    pump();
  }, [patch, pump]);

  const remove = useCallback((id: string) => {
    controllers.current.get(id)?.abort();
    const item = itemsRef.current.find((i) => i.id === id);
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    commit(itemsRef.current.filter((i) => i.id !== id));
    pump();
  }, [commit, pump]);

  const clearFinished = useCallback(() => {
    for (const i of itemsRef.current) if (i.status === 'done' && i.previewUrl) URL.revokeObjectURL(i.previewUrl);
    commit(itemsRef.current.filter((i) => i.status !== 'done'));
  }, [commit]);

  useEffect(() => () => {
    for (const c of controllers.current.values()) c.abort();
    for (const i of itemsRef.current) if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
  }, []);

  return { items, addFiles, retry, remove, clearFinished, busy: items.some((i) => i.status === 'uploading' || i.status === 'queued') };
}
