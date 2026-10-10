'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { CATEGORY_LABELS, TICKET_CATEGORIES, type TicketCategory } from '@/lib/support/meta';

type Errors = Partial<Record<'subject' | 'category' | 'message' | 'reference' | 'form', string>>;

const fieldClass = 'w-full rounded-xl px-3 py-2.5 text-sm min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1';
const fieldStyle = { background: 'var(--brand-bg)', color: 'var(--brand-text)', border: '1px solid var(--brand-line)' };

export default function NewTicketDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const uid = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('booking');
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    firstRef.current?.focus();
    const prev = document.activeElement;
    return () => { if (prev instanceof HTMLElement) prev.focus(); };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('input, select, textarea, button, a[href]')).filter((el) => !el.hasAttribute('disabled'));
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const local: Errors = {};
    if (!subject.trim()) local.subject = 'Please add a subject.';
    if (message.trim().length < 10) local.message = 'Please write at least 10 characters.';
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), category, message: message.trim(), reference: reference.trim() || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; errors?: Errors; error?: string };
      if (res.ok && data.id) { router.push(`/auth/support/${data.id}`); return; }
      setErrors(data.errors ?? { form: data.error ?? 'We could not create your ticket. Please try again.' });
    } catch {
      setErrors({ form: 'Network problem. Please try again.' });
    }
    setBusy(false);
  };

  const err = (k: keyof Errors) => errors[k] && (
    <p id={`${uid}-${k}-err`} className="mt-1 text-xs" style={{ color: 'var(--brand-error)' }}>{errors[k]}</p>
  );
  const aria = (k: keyof Errors) => ({ 'aria-invalid': errors[k] ? true : undefined, 'aria-describedby': errors[k] ? `${uid}-${k}-err` : undefined });
  const label = 'block text-sm font-medium mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(var(--brand-black-rgb), 0.5)' }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        onKeyDown={onKeyDown}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5"
        style={{ background: 'var(--brand-card)', border: '1px solid var(--brand-line)' }}
      >
        <h2 id={`${uid}-title`} className="text-lg font-semibold mb-4" style={{ color: 'var(--brand-text)' }}>New ticket</h2>
        <form onSubmit={submit} noValidate className="space-y-4">
          <div>
            <label htmlFor={`${uid}-subject`} className={label} style={{ color: 'var(--brand-text-2)' }}>Subject</label>
            <input ref={firstRef} id={`${uid}-subject`} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} className={fieldClass} style={fieldStyle} {...aria('subject')} />
            {err('subject')}
          </div>
          <div>
            <label htmlFor={`${uid}-category`} className={label} style={{ color: 'var(--brand-text-2)' }}>Category</label>
            <select id={`${uid}-category`} value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} className={fieldClass} style={fieldStyle} {...aria('category')}>
              {TICKET_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
            {err('category')}
          </div>
          <div>
            <label htmlFor={`${uid}-reference`} className={label} style={{ color: 'var(--brand-text-2)' }}>Reference (optional)</label>
            <input id={`${uid}-reference`} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Booking or order number" maxLength={60} className={fieldClass} style={fieldStyle} {...aria('reference')} />
            {err('reference')}
          </div>
          <div>
            <label htmlFor={`${uid}-message`} className={label} style={{ color: 'var(--brand-text-2)' }}>Message</label>
            <textarea id={`${uid}-message`} value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className={fieldClass} style={fieldStyle} {...aria('message')} />
            {err('message')}
          </div>
          <div aria-live="polite">{errors.form && <p role="alert" className="text-sm" style={{ color: 'var(--brand-error)' }}>{errors.form}</p>}</div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" arrow={false} onClick={onClose} disabled={busy} style={{ color: 'var(--brand-text-2)' }}>Cancel</Button>
            <Button type="submit" variant="accent" loading={busy}>Send ticket</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
