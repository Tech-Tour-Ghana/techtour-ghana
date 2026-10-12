'use client';

// How students pay TechTour. Shown on a student's application page while they owe
// a balance. Stored in study_settings, which only signed-in users can read, so
// mobile money and bank details are not published to the open web (migration 0051).

import { useEffect, useMemo, useState } from 'react';

import { notify } from '@/components/admin/toast';
import { Button, fieldStyle, reportError } from '@/components/admin/ui';
import { createBrowserClient } from '@/lib/supabase/client';

const MAX = 2000;

export default function PaymentSettingsPanel() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [saved, setSaved] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('study_settings').select('payment_instructions').eq('id', true).maybeSingle().then(({ data }) => {
      setSaved(data?.payment_instructions ?? '');
      setText(data?.payment_instructions ?? '');
    });
  }, [supabase]);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from('study_settings').update({ payment_instructions: text.trim() }).eq('id', true);
    setSaving(false);
    if (reportError(error)) return;
    setSaved(text.trim());
    notify('Saved. Students who owe a balance see this on their application.', 'success');
  }

  return (
    <div className="max-w-2xl rounded-[var(--adm-radius-card)] p-5" style={{ background: 'var(--adm-card)', border: '1px solid var(--adm-border)' }}>
      <h2 className="text-base font-bold" style={{ color: 'var(--adm-text)' }}>How students pay</h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--adm-text-2)' }}>
        Shown to a student while they owe a balance. Include mobile money numbers, bank details and what to quote. Only signed-in users can read this.
      </p>
      <label htmlFor="pay-instructions" className="mb-1 mt-4 block text-xs font-semibold" style={{ color: 'var(--adm-text-2)' }}>Payment instructions</label>
      <textarea
        id="pay-instructions"
        rows={8}
        maxLength={MAX}
        disabled={saved === null}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'Mobile money: 024 000 0000 (TechTour Ghana)\nBank: Example Bank, account 0000000000\nQuote your application reference as the payment reference.'}
        className="w-full px-3 py-2 text-sm"
        style={fieldStyle}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="text-[11px]" style={{ color: 'var(--adm-muted)' }}>{text.length} of {MAX} characters</span>
        <Button onClick={save} disabled={saving || saved === null || text.trim() === saved}>{saving ? 'Saving...' : 'Save'}</Button>
      </div>
    </div>
  );
}
