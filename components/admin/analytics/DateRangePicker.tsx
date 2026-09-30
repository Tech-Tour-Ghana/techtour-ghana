'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

import { RANGE_OPTIONS, type Range, type RangeKey } from '@/lib/analytics/range';

import { EASE } from './motion';

export interface RangeChange {
  key: RangeKey;
  from?: string;
  to?: string;
}

/** Preset periods plus a custom start and end date. Every widget on the page follows this one selection. */
export default function DateRangePicker({ range, onChange }: { range: Range; onChange: (next: RangeChange) => void }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(range.fromDate);
  const [to, setTo] = useState(range.toDate);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFrom(range.fromDate);
    setTo(range.toDate);
  }, [range.fromDate, range.toDate]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const activeLabel = range.key === 'custom' ? 'Custom' : RANGE_OPTIONS.find((o) => o.key === range.key)?.label;
  const customValid = from !== '' && to !== '' && from <= to;
  const input = {
    background: 'var(--adm-bg)',
    border: '1px solid var(--adm-border)',
    color: 'var(--adm-text)',
    borderRadius: 'var(--adm-radius-control)',
  } as const;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium"
        style={{ background: 'var(--adm-card)', border: '1px solid var(--adm-border)', borderRadius: 'var(--adm-radius-control)', color: 'var(--adm-text)' }}
      >
        <FontAwesomeIcon icon={faCalendar} className="h-3.5 w-3.5" style={{ color: 'var(--adm-primary)' }} />
        <span>{range.label}</span>
        <span className="rounded-md px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--adm-track)', color: 'var(--adm-text-2)' }}>{activeLabel}</span>
        <FontAwesomeIcon icon={faChevronDown} className={`h-2.5 w-2.5 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--adm-muted)' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="absolute right-0 z-40 mt-2 w-72 p-2"
            style={{ background: 'var(--adm-elevated)', border: '1px solid var(--adm-border)', borderRadius: 'var(--adm-radius-card)', boxShadow: 'var(--adm-shadow)' }}
            role="listbox"
          >
            {RANGE_OPTIONS.map((o) => (
              <button
                key={o.key}
                role="option"
                aria-selected={range.key === o.key}
                onClick={() => {
                  onChange({ key: o.key });
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium"
                style={{
                  background: range.key === o.key ? 'var(--adm-primary-soft)' : 'transparent',
                  color: range.key === o.key ? 'var(--adm-primary)' : 'var(--adm-text)',
                }}
              >
                {o.label}
              </button>
            ))}
            <div className="mt-1 border-t px-3 pb-2 pt-3" style={{ borderColor: 'var(--adm-border)' }}>
              <p className="mb-2 text-[11px] font-semibold" style={{ color: 'var(--adm-text-2)' }}>Custom range</p>
              <div className="flex items-center gap-2">
                <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="w-full px-2 py-1.5 text-xs" style={input} aria-label="Start date" />
                <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="w-full px-2 py-1.5 text-xs" style={input} aria-label="End date" />
              </div>
              <button
                disabled={!customValid}
                onClick={() => {
                  onChange({ key: 'custom', from, to });
                  setOpen(false);
                }}
                className="mt-3 w-full px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                style={{ background: 'var(--adm-primary)', borderRadius: 'var(--adm-radius-control)' }}
              >
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
