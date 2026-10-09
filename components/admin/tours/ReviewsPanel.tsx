'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faFlag, faPencil, faStar, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';

import { notify } from '@/components/admin/toast';
import { Button, IconButton, Modal, StatusPill, Surface, EmptyBlock, ListSkeleton, Tabs, confirmAction, fieldStyle, reportError, type Tone } from '@/components/admin/ui';
import { createBrowserClient } from '@/lib/supabase/client';
import { REVIEW_STATUSES, cap, type Review, type ReviewStatus } from './shared';

const TONE: Record<ReviewStatus, Tone> = { pending: 'warning', approved: 'success', rejected: 'danger' };

const Stars = ({ n }: { n: number }) => (
  <span aria-label={`${n} out of 5`} className="inline-flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => <FontAwesomeIcon key={i} icon={faStar} className="h-3 w-3" style={{ color: i <= n ? '#F59E0B' : 'var(--adm-border)' }} />)}
  </span>
);

export default function ReviewsPanel({ reviews, loading, reload }: { reviews: Review[]; loading: boolean; reload: () => Promise<void> }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [filter, setFilter] = useState<'all' | ReviewStatus>('pending');
  const [notes, setNotes] = useState<Review | null>(null);
  const [noteText, setNoteText] = useState('');

  const shown = reviews.filter((r) => filter === 'all' || r.status === filter);

  async function update(r: Review, patch: { status?: ReviewStatus; moderation_notes?: string; is_flagged?: boolean }) {
    if (reportError((await supabase.from('tour_reviews').update(patch).eq('id', r.id)).error)) return false;
    await reload();
    return true;
  }

  async function remove(r: Review) {
    if (!(await confirmAction({ message: `Delete the review from ${r.user_name || r.user_email}? You can restore it from Trash.`, danger: true, confirmLabel: 'Delete' }))) return;
    if (reportError((await supabase.from('tour_reviews').delete().eq('id', r.id)).error)) return;
    await reload();
  }

  return (
    <>
      <div className="mb-4">
        <Tabs value={filter} onChange={setFilter} tabs={[{ key: 'all' as const, label: 'All', count: reviews.length }, ...REVIEW_STATUSES.map((s) => ({ key: s, label: cap(s), count: reviews.filter((r) => r.status === s).length }))]} />
      </div>
      <Surface className="overflow-hidden">
        {loading ? <ListSkeleton /> : shown.length === 0 ? (
          <EmptyBlock title={reviews.length === 0 ? 'No reviews yet' : 'Nothing to review here'} body={reviews.length === 0 ? 'Reviews left on tours appear here for approval.' : 'Try another tab.'} />
        ) : (
          <ul>
            {shown.map((r) => (
              <li key={r.id} className="border-b p-4 last:border-b-0" style={{ borderColor: 'var(--adm-border)' }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars n={r.rating} />
                      <StatusPill tone={TONE[r.status]}>{cap(r.status)}</StatusPill>
                      {r.is_flagged && <StatusPill tone="danger" icon={faFlag}>Flagged</StatusPill>}
                    </div>
                    <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>{r.user_name || 'Anonymous'} <span className="font-normal" style={{ color: 'var(--adm-muted)' }}>on {r.tours?.title ?? 'a tour'}</span></p>
                    <p className="mt-1 whitespace-pre-wrap text-sm" style={{ color: 'var(--adm-text-2)' }}>{r.comment || 'No comment.'}</p>
                    {r.moderation_notes && <p className="mt-2 text-xs" style={{ color: 'var(--adm-muted)' }}>Note: {r.moderation_notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    {r.status !== 'approved' && <Button variant="secondary" onClick={() => update(r, { status: 'approved' })}><FontAwesomeIcon icon={faCheck} className="mr-1.5 h-3 w-3" />Approve</Button>}
                    {r.status !== 'rejected' && <Button variant="secondary" onClick={() => update(r, { status: 'rejected' })}><FontAwesomeIcon icon={faXmark} className="mr-1.5 h-3 w-3" />Reject</Button>}
                    <IconButton title="Add note" onClick={() => { setNotes(r); setNoteText(r.moderation_notes); }}><FontAwesomeIcon icon={faPencil} className="h-3 w-3" /></IconButton>
                    <IconButton title={r.is_flagged ? 'Remove flag' : 'Flag'} onClick={() => update(r, { is_flagged: !r.is_flagged })}><FontAwesomeIcon icon={faFlag} className="h-3 w-3" /></IconButton>
                    <IconButton title="Delete" color="var(--adm-error)" onClick={() => remove(r)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Surface>

      {notes && (
        <Modal title="Moderation note" subtitle={`Review by ${notes.user_name || notes.user_email}`} maxWidth="max-w-md" onClose={() => setNotes(null)}
          footer={<><Button variant="secondary" onClick={() => setNotes(null)}>Cancel</Button>
            <Button onClick={async () => { if (await update(notes, { moderation_notes: noteText.trim() })) { notify('Note saved.', 'success'); setNotes(null); } }}>Save note</Button></>}>
          <textarea rows={4} className="w-full px-3 py-2 text-sm" style={fieldStyle} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Only admins can see this." />
        </Modal>
      )}
    </>
  );
}
