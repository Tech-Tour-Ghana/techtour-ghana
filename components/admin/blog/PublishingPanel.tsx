'use client';

import { Button } from '@/components/admin/ui';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  published: boolean;
  persisted: boolean;
  dirty: boolean;
  saveState: SaveState;
  savedAt: Date | null;
  updatedAt: string | null;
  publishedAt: string | null;
  autosaveNote: boolean;
  errors: string[];
  busy: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onPreview: () => void;
}

const time = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const date = (s: string) => new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function PublishingPanel(p: Props) {
  const status =
    p.saveState === 'saving' ? 'Saving…'
    : p.saveState === 'error' ? 'Save failed'
    : p.dirty ? 'Unsaved changes'
    : p.savedAt ? `Saved ${time(p.savedAt)}`
    : p.persisted ? 'All changes saved' : 'Not saved yet';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="rounded-full px-2.5 py-1 font-bold" style={{ background: p.published ? 'var(--adm-success-soft)' : 'var(--adm-track)', color: p.published ? 'var(--adm-success)' : 'var(--adm-text-2)' }}>
          {p.published ? 'Published' : 'Draft'}
        </span>
        <span role="status" style={{ color: p.saveState === 'error' ? 'var(--adm-error)' : 'var(--adm-muted)' }}>{status}</span>
      </div>

      <dl className="space-y-1 text-[11px]" style={{ color: 'var(--adm-muted)' }}>
        {p.publishedAt && <div className="flex justify-between"><dt>Published</dt><dd>{date(p.publishedAt)}</dd></div>}
        {p.updatedAt && <div className="flex justify-between"><dt>Last updated</dt><dd>{date(p.updatedAt)}</dd></div>}
      </dl>

      {p.errors.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-[var(--adm-radius-control)] p-3 text-xs" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>
          {p.errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={p.onSaveDraft} disabled={p.busy}>{p.published ? 'Save changes' : 'Save draft'}</Button>
        <Button variant="secondary" onClick={p.onPreview} disabled={p.busy}>Preview</Button>
        {p.published ? (
          <Button variant="danger" onClick={p.onUnpublish} disabled={p.busy}>Unpublish</Button>
        ) : (
          <Button onClick={p.onPublish} disabled={p.busy}>Publish</Button>
        )}
      </div>

      <p className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>
        {p.autosaveNote
          ? 'Drafts save automatically a few seconds after you stop typing. Autosave never publishes.'
          : 'This article is live. Changes go live only when you press Save changes, there is no autosave.'}
      </p>
    </div>
  );
}
