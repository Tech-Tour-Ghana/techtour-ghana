'use client';

// Site search popup. Opens from the navbar icon or Ctrl/Cmd+K, searches as you
// type (debounced), shows a thumbnail and detail line per result, and works
// from the keyboard: arrows move, Enter opens, Esc closes.

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faXmark } from '@fortawesome/free-solid-svg-icons';

type Item = { label: string; sub: string; image: string; href: string };
type Group = { title: string; items: Item[] };

const SUGGESTED: Item[] = [
  { label: 'Browse tours', sub: 'Dated departures across Ghana', image: '', href: '/tours' },
  { label: 'Study abroad', sub: 'Destinations, costs and scholarships', image: '', href: '/services/study-abroad' },
  { label: 'TechTour Market', sub: 'Crafts from Ghanaian artisans', image: '', href: '/market' },
  { label: 'Meet the artisans', sub: 'The people behind the crafts', image: '', href: '/market/artisans' },
  { label: 'Contact us', sub: 'Phone, email and address', image: '', href: '/about/contact-us' },
];

const muted = { color: 'var(--text-light)' } as const;

function Highlight({ text, term }: { text: string; term: string }) {
  const i = term ? text.toLowerCase().indexOf(term.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, borderRadius: 3 }}>{text.slice(i, i + term.length)}</mark>
      {text.slice(i + term.length)}
    </>
  );
}

function Thumb({ item }: { item: Item }) {
  if (item.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <span aria-hidden style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700 }}>
      {item.label.charAt(0).toUpperCase()}
    </span>
  );
}

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [active, setActive] = useState(0);
  const term = q.trim();

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
        setActive(0);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setState('error');
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [term]);

  // One flat list drives the keyboard, whether it shows results or suggestions.
  const showSuggested = state === 'idle' || (state === 'done' && groups.length === 0);
  const flat = useMemo(() => (showSuggested ? SUGGESTED : groups.flatMap((g) => g.items)), [showSuggested, groups]);

  useEffect(() => {
    document.getElementById(`search-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const go = (href: string) => {
    router.push(href);
    onClose();
  };
  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    }
  };

  let index = -1;
  const row = (item: Item) => {
    index += 1;
    const i = index;
    const on = i === active;
    return (
      <li key={item.href} id={`search-opt-${i}`} role="option" aria-selected={on}>
        <a
          href={item.href}
          tabIndex={-1}
          onClick={(e) => {
            e.preventDefault();
            go(item.href);
          }}
          onMouseMove={() => setActive(i)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 12, color: 'inherit', textDecoration: 'none', background: on ? 'var(--primary-light)' : 'transparent' }}
        >
          <Thumb item={item} />
          <span style={{ minWidth: 0, flex: 1 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Highlight text={item.label} term={showSuggested ? '' : term} />
            </span>
            {item.sub && <span style={{ display: 'block', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...muted }}>{item.sub}</span>}
          </span>
        </a>
      </li>
    );
  };

  const heading = (text: string) => <h3 style={{ padding: '10px 10px 4px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', ...muted }}>{text}</h3>;

  // Portal: the navbar has a backdrop-filter, which would pin a fixed child to the navbar box.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Search" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(var(--brand-black-rgb), 0.55)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '8vh 16px 16px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 620, maxHeight: '80vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-solid)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 20px 60px rgba(var(--brand-black-rgb), 0.3)', overflow: 'hidden', textAlign: 'left' }}>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const target = flat[active];
            if (target) go(target.href);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}
        >
          <FontAwesomeIcon icon={faSearch} style={muted} />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-list"
            aria-activedescendant={flat.length ? `search-opt-${active}` : undefined}
            aria-label="Search tours, destinations, stays, crafts and articles"
            placeholder="Search tours, places, crafts, articles"
            autoComplete="off"
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 0, color: 'inherit', fontSize: 16 }}
          />
          <button type="button" onClick={onClose} aria-label="Close search" style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 4, ...muted }}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </form>

        <div aria-live="polite" style={{ overflowY: 'auto', padding: '4px 8px 10px' }}>
          {state === 'loading' && groups.length === 0 && <p style={{ padding: '14px 10px', fontSize: 14, ...muted }}>Searching...</p>}
          {state === 'error' && <p style={{ padding: '14px 10px', fontSize: 14, color: 'var(--brand-error-text)' }}>Search is not available right now. Please try again.</p>}
          {state === 'done' && groups.length === 0 && <p style={{ padding: '14px 10px 0', fontSize: 14, ...muted }}>Nothing matched &quot;{term}&quot;. Try one of these instead.</p>}

          <ul id="search-list" role="listbox" aria-label="Results">
            {showSuggested ? (
              <>
                {state === 'idle' && heading('Popular')}
                {SUGGESTED.map(row)}
              </>
            ) : (
              groups.map((g) => (
                <Fragment key={g.title}>
                  {heading(g.title)}
                  {g.items.map(row)}
                </Fragment>
              ))
            )}
          </ul>
        </div>

        <p aria-hidden style={{ margin: 0, padding: '8px 16px', fontSize: 12, borderTop: '1px solid var(--border)', ...muted }}>
          Arrow keys to move, Enter to open, Esc to close
        </p>
      </div>
    </div>,
    document.body,
  );
}
