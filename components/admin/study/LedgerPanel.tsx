'use client';

// The money side of one study application. Students pay TechTour; staff pay the
// university offline and record it here. Entries cannot be edited: a mistake is
// voided and re-entered, so the history stays honest. Every new entry reaches the
// student's timeline and notifications through a trigger (migration 0049).

import { useCallback, useEffect, useMemo, useState } from 'react';

import { notify } from '@/components/admin/toast';
import { Button, ListSkeleton, confirmAction, fieldStyle, reportError } from '@/components/admin/ui';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  LEDGER_CATEGORIES, LEDGER_CURRENCIES, LEDGER_KINDS, PAYMENT_METHODS, formatMoney, ledgerBalances,
  type LedgerEntry, type LedgerKind,
} from '@/lib/study/meta';

const when = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const today = () => new Date().toISOString().slice(0, 10);
const blank = { kind: 'charge' as LedgerKind, category: 'application_fee', description: '', amount: '', currency: 'GHS', method: '', reference: '', occurred_on: today() };

export default function LedgerPanel({ applicationId, onChanged, onRecorded }: { applicationId: string; onChanged: () => Promise<void>; onRecorded?: () => void }) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [entries, setEntries] = useState<LedgerEntry[] | null>(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [showVoided, setShowVoided] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('study_ledger').select('*').eq('application_id', applicationId).order('occurred_on', { ascending: false }).order('created_at', { ascending: false });
    setEntries((data as LedgerEntry[] | null) ?? []);
  }, [supabase, applicationId]);
  useEffect(() => { load(); }, [load]);

  const balances = ledgerBalances(entries ?? []);
  const money = form.kind === 'payment' || form.kind === 'refund';
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return notify('Enter an amount above zero.');
    if (!money && !form.description.trim() && form.category === 'other') return notify('Say what this is for.');
    setSaving(true);
    const { error } = await supabase.from('study_ledger').insert({
      application_id: applicationId, kind: form.kind, category: money ? 'other' : form.category, description: form.description.trim(),
      amount, currency: form.currency, method: money ? form.method : '', reference: form.reference.trim(), occurred_on: form.occurred_on || today(),
    });
    setSaving(false);
    if (reportError(error)) return;
    notify('Recorded. The student was notified.', 'success');
    onRecorded?.();
    setForm({ ...blank, kind: form.kind, currency: form.currency });
    await Promise.all([load(), onChanged()]);
  }

  async function voidEntry(en: LedgerEntry) {
    if (!(await confirmAction({ message: `Void this entry (${LEDGER_KINDS[en.kind].label}, ${formatMoney(en.amount, en.currency)})? It disappears from the student's view and from the totals. Add a corrected entry afterwards.`, confirmLabel: 'Void entry', danger: true }))) return;
    if (reportError((await supabase.from('study_ledger').update({ voided_at: new Date().toISOString() }).eq('id', en.id)).error)) return;
    notify('Entry voided.', 'success');
    await Promise.all([load(), onChanged()]);
  }

  const shown = (entries ?? []).filter((en) => showVoided || !en.voided_at);
  const voidedCount = (entries ?? []).filter((en) => en.voided_at).length;
  const label = (t: string) => <span className="mb-1 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>{t}</span>;

  return (
    <div className="space-y-5">
      {entries === null ? <ListSkeleton /> : balances.length === 0 ? (
        <p className="rounded-[var(--adm-radius-control)] p-3 text-sm" style={{ border: '1px dashed var(--adm-border)', color: 'var(--adm-text-2)' }}>No fees or payments recorded yet. Add the first fee below and the student will see it in their account.</p>
      ) : balances.map((b) => (
        <div key={b.currency} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([['Fees', b.charged - b.waived], ['Paid by student', b.paid - b.refunded], ['Still owed', b.balance], ['Paid to university', b.remitted]] as const).map(([k, v]) => (
            <div key={k} className="rounded-[var(--adm-radius-control)] p-3" style={{ border: '1px solid var(--adm-border)', background: 'var(--adm-card)' }}>
              <p className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>{k} ({b.currency})</p>
              <p className="mt-0.5 text-base font-bold" style={{ color: k === 'Still owed' && v > 0 ? 'var(--adm-warning, var(--brand-warning))' : k === 'Still owed' && v < 0 ? 'var(--adm-info, var(--brand-info))' : 'var(--adm-text)' }}>{formatMoney(v, b.currency).slice(4)}</p>
              {k === 'Still owed' && v < 0 && <p className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>Overpaid</p>}
            </div>
          ))}
        </div>
      ))}

      <form onSubmit={add} className="rounded-[var(--adm-radius-control)] p-3" style={{ border: '1px solid var(--adm-border)' }}>
        <p className="mb-3 text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Record an entry. The student sees what you type here.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="lg-kind">{label('Type')}</label>
            <select id="lg-kind" value={form.kind} onChange={set('kind')} className="w-full px-3 py-2 text-sm" style={fieldStyle}>
              {(Object.keys(LEDGER_KINDS) as LedgerKind[]).map((k) => <option key={k} value={k}>{LEDGER_KINDS[k].label}</option>)}
            </select>
          </div>
          {!money ? (
            <div>
              <label htmlFor="lg-cat">{label('For')}</label>
              <select id="lg-cat" value={form.category} onChange={set('category')} className="w-full px-3 py-2 text-sm" style={fieldStyle}>
                {LEDGER_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="lg-method">{label('Method')}</label>
              <select id="lg-method" value={form.method} onChange={set('method')} className="w-full px-3 py-2 text-sm" style={fieldStyle}>
                <option value="">Not stated</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="lg-date">{label('Date')}</label>
            <input id="lg-date" type="date" value={form.occurred_on} max={today()} onChange={set('occurred_on')} className="w-full px-3 py-2 text-sm" style={fieldStyle} />
          </div>
          <div>
            <label htmlFor="lg-amount">{label('Amount')}</label>
            <input id="lg-amount" inputMode="decimal" value={form.amount} onChange={set('amount')} placeholder="0.00" className="w-full px-3 py-2 text-sm" style={fieldStyle} />
          </div>
          <div>
            <label htmlFor="lg-cur">{label('Currency')}</label>
            <select id="lg-cur" value={form.currency} onChange={set('currency')} className="w-full px-3 py-2 text-sm" style={fieldStyle}>
              {LEDGER_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="lg-ref">{label('Reference (optional)')}</label>
            <input id="lg-ref" maxLength={80} value={form.reference} onChange={set('reference')} placeholder="MoMo or bank reference" className="w-full px-3 py-2 text-sm" style={fieldStyle} />
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="lg-desc">{label('Description (optional)')}</label>
            <input id="lg-desc" maxLength={200} value={form.description} onChange={set('description')} placeholder={LEDGER_KINDS[form.kind].hint} className="w-full px-3 py-2 text-sm" style={fieldStyle} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Record entry'}</Button>
          <span className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>Entries cannot be edited. Void a mistake and add it again.</span>
        </div>
      </form>

      {entries !== null && entries.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold" style={{ color: 'var(--adm-text)' }}>History</h3>
            {voidedCount > 0 && <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--adm-text-2)' }}><input type="checkbox" checked={showVoided} onChange={(e) => setShowVoided(e.target.checked)} style={{ accentColor: 'var(--adm-primary)' }} />Show {voidedCount} voided</label>}
          </div>
          <ul className="divide-y rounded-[var(--adm-radius-control)]" style={{ border: '1px solid var(--adm-border)', borderColor: 'var(--adm-border)' }}>
            {shown.map((en) => {
              const k = LEDGER_KINDS[en.kind];
              const name = en.description || LEDGER_CATEGORIES.find((c) => c.value === en.category)?.label || k.label;
              return (
                <li key={en.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5" style={{ opacity: en.voided_at ? 0.55 : 1, borderColor: 'var(--adm-border)' }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--adm-text)', textDecoration: en.voided_at ? 'line-through' : undefined }}>{k.label}: {name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>{[when(en.occurred_on), en.method, en.reference && `Ref ${en.reference}`, en.voided_at && 'Voided'].filter(Boolean).join(' · ')}</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--adm-text)', textDecoration: en.voided_at ? 'line-through' : undefined }}>{k.sign < 0 ? '-' : k.sign > 0 ? '+' : ''}{formatMoney(en.amount, en.currency)}</p>
                  {!en.voided_at && <Button variant="secondary" onClick={() => voidEntry(en)}>Void</Button>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
