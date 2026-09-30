'use client';

import { useState } from 'react';

import { Button, fieldStyle } from '@/components/admin/ui';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  published: boolean;
  persisted: boolean;
  dirty: boolean;
  saveState: SaveState;
  savedAt: Date | null;
  updatedAt: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  autosaveNote: boolean;
  errors: string[];
  busy: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  /** ISO time in UTC. */
  onSchedule: (iso: string) => void;
  onUnschedule: () => void;
  onPreview: () => void;
}

const time = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const date = (s: string) => new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Value for <input type="datetime-local"> from a Date, in the browser's own time zone. */
const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function PublishingPanel(p: Props) {
  const [picking, setPicking] = useState(false);
  const [when, setWhen] = useState('');
  const scheduled = !p.published && !!p.scheduledAt;
  const zone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';

  const status =
    p.saveState === 'saving' ? 'Saving…'
    : p.saveState === 'error' ? 'Save failed'
    : p.dirty ? 'Unsaved changes'
    : p.savedAt ? `Saved ${time(p.savedAt)}`
    : p.persisted ? 'All changes saved' : 'Not saved yet';

  const openPicker = () => {
    setWhen(toLocalInput(new Date(p.scheduledAt ?? Date.now() + 60 * 60 * 1000)));
    setPicking(true);
  };
  const confirm = () => {
    const d = new Date(when);
    if (Number.isNaN(d.getTime())) return;
    setPicking(false);
    p.onSchedule(d.toISOString());
  };

  const badge = p.published
    ? { text: 'Published', bg: 'var(--adm-success-soft)', color: 'var(--adm-success)' }
    : scheduled
      ? { text: 'Scheduled', bg: 'var(--adm-primary-soft)', color: 'var(--adm-primary)' }
      : { text: 'Draft', bg: 'var(--adm-track)', color: 'var(--adm-text-2)' };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="rounded-full px-2.5 py-1 font-bold" style={{ background: badge.bg, color: badge.color }}>{badge.text}</span>
        <span role="status" style={{ color: p.saveState === 'error' ? 'var(--adm-error)' : 'var(--adm-muted)' }}>{status}</span>
      </div>

      <dl className="space-y-1 text-[11px]" style={{ color: 'var(--adm-muted)' }}>
        {scheduled && p.scheduledAt && <div className="flex justify-between"><dt>Goes live</dt><dd className="font-semibold" style={{ color: 'var(--adm-primary)' }}>{date(p.scheduledAt)}</dd></div>}
        {p.publishedAt && <div className="flex justify-between"><dt>Published</dt><dd>{date(p.publishedAt)}</dd></div>}
        {p.updatedAt && <div className="flex justify-between"><dt>Last updated</dt><dd>{date(p.updatedAt)}</dd></div>}
      </dl>

      {p.errors.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-[var(--adm-radius-control)] p-3 text-xs" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>
          {p.errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={p.onSaveDraft} disabled={p.busy}>{p.published ? 'Save changes' : scheduled ? 'Save' : 'Save draft'}</Button>
        <Button variant="secondary" onClick={p.onPreview} disabled={p.busy}>Preview</Button>
        {p.published ? (
          <Button variant="danger" onClick={p.onUnpublish} disabled={p.busy}>Unpublish</Button>
        ) : (
          <>
            <Button onClick={p.onPublish} disabled={p.busy}>{scheduled ? 'Publish now' : 'Publish'}</Button>
            <Button variant="secondary" onClick={openPicker} disabled={p.busy}>{scheduled ? 'Change time' : 'Schedule…'}</Button>
            {scheduled && <Button variant="secondary" onClick={p.onUnschedule} disabled={p.busy}>Unschedule</Button>}
          </>
        )}
      </div>

      {picking && (
        <div className="space-y-2 rounded-[var(--adm-radius-control)] p-3" style={{ border: '1px solid var(--adm-border)' }}>
          <label htmlFor="schedule-at" className="block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Publish on</label>
          <input id="schedule-at" type="datetime-local" value={when} min={toLocalInput(new Date(Date.now() + 60_000))} onChange={(e) => setWhen(e.target.value)} className="w-full px-3 py-2 text-sm" style={fieldStyle} />
          <p className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>Your local time{zone ? ` (${zone})` : ''}. The article goes live within a minute of this time.</p>
          <div className="flex gap-2">
            <Button onClick={confirm} disabled={!when}>Schedule</Button>
            <Button variant="secondary" onClick={() => setPicking(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <p className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>
        {p.autosaveNote
          ? scheduled
            ? 'Changes autosave a few seconds after you stop typing. The article stays scheduled and goes live at the time above.'
            : 'Drafts save automatically a few seconds after you stop typing. Autosave never publishes.'
          : 'This article is live. Changes go live only when you press Save changes, there is no autosave.'}
      </p>
    </div>
  );
}
