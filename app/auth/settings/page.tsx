// Preferences: theme and shop currency (both stored in this browser, the same
// keys the rest of the site reads) and notification choices (saved to the
// profiles email/sms/marketing columns as soon as they change).

'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import AccountShell, { Section, StatusMessage, inputClass, useAccountTheme, type Status } from '@/components/account/AccountShell';
import { useTheme } from '@/context/ThemeContext';
import { CURRENCIES, useCurrencies } from '@/lib/currency';
import { getProfile, updateNotificationPreferences } from '@/lib/api';

type Notifications = { email_notifications: boolean; sms_notifications: boolean; marketing_emails: boolean };

const NOTIFICATION_LABELS: Record<keyof Notifications, { title: string; description: string }> = {
  email_notifications: { title: 'Email notifications', description: 'Booking, order and payment updates by email.' },
  sms_notifications: { title: 'SMS notifications', description: 'Important updates by text message.' },
  marketing_emails: { title: 'Offers and news', description: 'Promotions and travel news by email.' },
};

export default function SettingsPage() {
  const t = useAccountTheme();
  const { isDimMode, toggleTheme } = useTheme();
  const { currencies } = useCurrencies();
  const [currencyCode, setCurrencyCode] = useState('GHS');
  const [notifications, setNotifications] = useState<Notifications | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('selectedCurrency') ?? 'null');
      if (saved && typeof saved.code === 'string') setCurrencyCode(saved.code);
    } catch { /* storage blocked or malformed, keep the default */ }
    getProfile()
      .then((p) => {
        if (p) setNotifications({ email_notifications: p.email_notifications, sms_notifications: p.sms_notifications, marketing_emails: p.marketing_emails });
      })
      .finally(() => setLoading(false));
  }, []);

  const changeCurrency = (code: string) => {
    const next = currencies.find((c) => c.code === code) ?? CURRENCIES[0];
    if (!next) return;
    setCurrencyCode(code);
    try {
      localStorage.setItem('selectedCurrency', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency: next } }));
      setStatus({ type: 'success', text: `Prices will show in ${next.name}.` });
    } catch {
      setStatus({ type: 'error', text: 'Your browser blocked saving this preference.' });
    }
  };

  const toggle = async (key: keyof Notifications) => {
    if (!notifications) return;
    const previous = notifications;
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    setStatus(null);
    const result = await updateNotificationPreferences({ [key]: next[key] });
    if (result.success) {
      setStatus({ type: 'success', text: `${NOTIFICATION_LABELS[key].title} turned ${next[key] ? 'on' : 'off'}.` });
    } else {
      setNotifications(previous);
      setStatus({ type: 'error', text: result.message || 'Could not save that change.' });
    }
  };

  return (
    <AccountShell title="Preferences" subtitle="Appearance, currency and notifications">
      <StatusMessage status={status} />

      <Section id="appearance" title="Appearance">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm" style={{ color: t.text }}>
            Theme: <span className="font-medium">{isDimMode ? 'Dark' : 'Light'}</span>
          </p>
          <Button variant="secondary" size="sm" arrow={false} onClick={toggleTheme} style={{ color: t.text }}>
            Switch to {isDimMode ? 'light' : 'dark'}
          </Button>
        </div>
      </Section>

      <Section id="currency" title="Currency" description="Prices are charged in cedis. This only changes how they are displayed on this device.">
        <label htmlFor="pref-currency" className="block text-sm font-medium mb-1.5" style={{ color: t.textSecondary }}>Show prices in</label>
        <select
          id="pref-currency"
          value={currencyCode}
          onChange={(e) => changeCurrency(e.target.value)}
          className={`${inputClass} max-w-xs`}
          style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
        >
          {currencies.map((c) => (
            <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
          ))}
        </select>
      </Section>

      <Section id="notifications" title="Notifications" description="Choose what we contact you about. Changes save straight away.">
        {loading ? (
          <p role="status" className="text-sm" style={{ color: t.textSecondary }}>Loading...</p>
        ) : !notifications ? (
          <p role="alert" className="text-sm" style={{ color: t.textSecondary }}>We could not load your notification settings.</p>
        ) : (
          <ul className="divide-y" style={{ borderColor: t.border }}>
            {(Object.keys(NOTIFICATION_LABELS) as (keyof Notifications)[]).map((key) => (
              <li key={key} className="py-3 first:pt-0 last:pb-0" style={{ borderColor: t.border }}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications[key]}
                    onChange={() => toggle(key)}
                    className="mt-1 h-4 w-4 accent-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                  />
                  <span>
                    <span className="block text-sm font-medium" style={{ color: t.text }}>{NOTIFICATION_LABELS[key].title}</span>
                    <span className="block text-sm" style={{ color: t.textSecondary }}>{NOTIFICATION_LABELS[key].description}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </AccountShell>
  );
}
