'use client';

// Site search popup. Opens from the navbar icon or Ctrl/Cmd+K, searches as you
// type (debounced) and links straight to the result.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faXmark } from '@fortawesome/free-solid-svg-icons';

type Group = { title: string; items: { label: string; href: string }[] };

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setGroups([]);
      setState('idle');
      return;
    }
    setState('loading');
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctl.signal });
        if (!res.ok) throw new Error('search failed');
        setGroups((await res.json()).groups);
        setState('done');
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setState('error');
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q]);

  if (!open) return null;
  const first = groups[0]?.items[0];

  // Portal: the navbar has a backdrop-filter, which would pin a fixed child to the navbar box.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Search" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '8vh 16px 16px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-solid)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', textAlign: 'left' }}>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (first) {
              router.push(first.href);
              onClose();
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}
        >
          <FontAwesomeIcon icon={faSearch} style={{ color: 'var(--text-light)' }} />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            aria-label="Search tours, destinations, articles and the market"
            placeholder="Search tours, destinations, articles, crafts"
            autoComplete="off"
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 0, color: 'inherit', fontSize: 16 }}
          />
          <button type="button" onClick={onClose} aria-label="Close search" style={{ background: 'transparent', border: 0, color: 'var(--text-light)', cursor: 'pointer', padding: 4 }}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </form>

        <div aria-live="polite" style={{ overflowY: 'auto', padding: '8px 8px 12px' }}>
          {state === 'idle' && <p style={{ padding: '12px 10px', fontSize: 14, color: 'var(--text-light)' }}>Type at least two letters.</p>}
          {state === 'loading' && groups.length === 0 && <p style={{ padding: '12px 10px', fontSize: 14, color: 'var(--text-light)' }}>Searching...</p>}
          {state === 'error' && <p style={{ padding: '12px 10px', fontSize: 14, color: '#B91C1C' }}>Search is not available right now. Please try again.</p>}
          {state === 'done' && groups.length === 0 && <p style={{ padding: '12px 10px', fontSize: 14, color: 'var(--text-light)' }}>No results for &quot;{q.trim()}&quot;.</p>}
          {groups.map((g) => (
            <section key={g.title} style={{ marginTop: 6 }}>
              <h3 style={{ padding: '6px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-light)' }}>{g.title}</h3>
              <ul>
                {g.items.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} onClick={onClose} style={{ display: 'block', padding: '10px', borderRadius: 10, fontSize: 15, color: 'inherit' }} className="search-result">
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
