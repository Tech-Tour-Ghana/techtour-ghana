'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

import { Button, fieldStyle } from '@/components/admin/ui';
import { MAX_ANSWER, MAX_FAQS, MAX_QUESTION, type FaqItem } from '@/lib/seo/faq';

/**
 * Optional FAQ block. Whatever is listed here is shown under the article and
 * published as FAQ structured data, nothing more. Incomplete pairs are ignored.
 */
export default function FaqEditor({ items, onChange }: { items: FaqItem[]; onChange: (items: FaqItem[]) => void }) {
  const set = (i: number, patch: Partial<FaqItem>) => onChange(items.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  const incomplete = items.filter((i) => !i.question.trim() || !i.answer.trim()).length;

  return (
    <div>
      <p className="mb-3 text-[11px]" style={{ color: 'var(--adm-muted)' }}>
        Add real questions readers ask about this topic. They appear as a visible section under the article, and the same list is published as FAQ structured data. Leave it empty if the article has no FAQ.
      </p>

      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={i} className="rounded-[var(--adm-radius-control)] p-3" style={{ border: '1px solid var(--adm-border)' }}>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor={`faq-q-${i}`} className="text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Question {i + 1}</label>
              <button type="button" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label={`Remove question ${i + 1}`} className="p-1" style={{ color: 'var(--adm-error)' }}>
                <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
              </button>
            </div>
            <input id={`faq-q-${i}`} value={it.question} maxLength={MAX_QUESTION} onChange={(e) => set(i, { question: e.target.value })} className="mb-2 w-full px-3 py-2 text-sm" style={fieldStyle} />
            <label htmlFor={`faq-a-${i}`} className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Answer</label>
            <textarea id={`faq-a-${i}`} rows={3} value={it.answer} maxLength={MAX_ANSWER} onChange={(e) => set(i, { answer: e.target.value })} className="w-full px-3 py-2 text-sm" style={fieldStyle} />
            <p className="mt-1 text-right text-[11px]" style={{ color: 'var(--adm-muted)' }}>{it.answer.length}/{MAX_ANSWER}</p>
          </div>
        ))}
      </div>

      {incomplete > 0 && (
        <p role="status" className="mt-2 text-[11px]" style={{ color: '#B45309' }}>
          {incomplete} item{incomplete > 1 ? 's need' : ' needs'} both a question and an answer. Incomplete items are not saved.
        </p>
      )}

      <Button variant="secondary" className="mt-3" disabled={items.length >= MAX_FAQS} onClick={() => onChange([...items, { question: '', answer: '' }])}>
        <FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add question{items.length >= MAX_FAQS ? ` (max ${MAX_FAQS})` : ''}
      </Button>
    </div>
  );
}
