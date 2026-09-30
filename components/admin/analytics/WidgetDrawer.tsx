'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef } from 'react';

import { EASE } from './motion';
import { WIDGETS, type WidgetId } from './widgets';

/**
 * Right-hand drawer over the still-visible dashboard. Choosing widgets is local
 * UI state. Closes on Escape, on overlay click and from the close button.
 */
export default function WidgetDrawer({
  open,
  enabled,
  onToggle,
  onClose,
}: {
  open: boolean;
  enabled: WidgetId[];
  onToggle: (id: WidgetId) => void;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            className="absolute inset-0"
            style={{ background: 'var(--adm-overlay)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Add widget"
            className="relative flex h-full w-full flex-col sm:w-[440px] lg:w-[40vw] lg:min-w-[440px]"
            style={{ background: 'var(--adm-card)', borderLeft: '1px solid var(--adm-border)', color: 'var(--adm-text)' }}
            initial={{ x: reduce ? 0 : '100%', opacity: reduce ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reduce ? 0 : '100%', opacity: reduce ? 0 : 1 }}
            transition={{ duration: reduce ? 0.15 : 0.4, ease: EASE }}
          >
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--adm-border)' }}>
              <div>
                <h2 className="text-base font-bold">Add Widget</h2>
                <p className="text-xs" style={{ color: 'var(--adm-text-2)' }}>Choose what appears on your Analytics page.</p>
              </div>
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: 'var(--adm-track)', color: 'var(--adm-text-2)' }}
              >
                <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
              </button>
            </div>

            <ul className="flex-1 space-y-3 overflow-y-auto p-6">
              {WIDGETS.map((w, i) => {
                const on = enabled.includes(w.id);
                return (
                  <motion.li
                    key={w.id}
                    initial={reduce ? false : { opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, ease: EASE, delay: reduce ? 0 : 0.05 + i * 0.03 }}
                    className="flex items-center gap-4 rounded-2xl p-4"
                    style={{ background: 'var(--adm-bg)', border: '1px solid var(--adm-border)' }}
                  >
                    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--adm-primary-soft)', color: 'var(--adm-primary)' }}>
                      <FontAwesomeIcon icon={w.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{w.name}</p>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--adm-text-2)' }}>{w.description}</p>
                      <span className="mt-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium" style={{ background: 'var(--adm-track)', color: 'var(--adm-text-2)' }}>
                        #{w.tag}
                      </span>
                    </div>
                    <button
                      onClick={() => onToggle(w.id)}
                      className="flex-shrink-0 rounded-[var(--adm-radius-control)] px-4 py-2 text-xs font-semibold transition-colors"
                      style={
                        on
                          ? { background: 'transparent', color: 'var(--adm-text-2)', border: '1px solid var(--adm-border)' }
                          : { background: 'var(--adm-primary)', color: '#FFFFFF', border: '1px solid var(--adm-primary)' }
                      }
                    >
                      {on ? 'Remove' : 'Select'}
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
