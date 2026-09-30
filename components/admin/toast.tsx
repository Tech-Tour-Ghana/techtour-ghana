'use client';

// Small non-blocking notifications for the admin. notify() can be called from
// anywhere (including plain helpers); <Toaster /> is mounted once in AdminLayout.

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';

type Kind = 'success' | 'error';
interface Toast { id: number; kind: Kind; message: string }

const EVENT = 'admin:toast';

export function notify(message: string, kind: Kind = 'error') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, kind } }));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    let next = 1;
    const onToast = (e: Event) => {
      const { message, kind } = (e as CustomEvent<{ message: string; kind: Kind }>).detail;
      const id = next++;
      setToasts((t) => [...t.slice(-3), { id, kind, message }]);
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 8000 : 4000);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === 'error' ? 'alert' : 'status'}
          className="pointer-events-auto flex items-start gap-3 rounded-[var(--adm-radius-control)] px-4 py-3 text-xs"
          style={{
            background: 'var(--adm-card)',
            border: `1px solid ${t.kind === 'error' ? 'var(--adm-error)' : 'var(--adm-success)'}`,
            boxShadow: 'var(--adm-shadow)',
            color: 'var(--adm-text)',
          }}
        >
          <FontAwesomeIcon
            icon={t.kind === 'error' ? faCircleExclamation : faCircleCheck}
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            style={{ color: t.kind === 'error' ? 'var(--adm-error)' : 'var(--adm-success)' }}
          />
          <p className="flex-1">{t.message}</p>
          <button aria-label="Dismiss" onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} style={{ color: 'var(--adm-muted)' }}>
            <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
