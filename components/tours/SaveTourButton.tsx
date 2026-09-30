'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark } from '@fortawesome/free-solid-svg-icons';

const KEY = 'savedTours';

const read = (): string[] => {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
};

/** Bookmark a tour on this device. Saved tours stay in the browser, no account needed. */
export default function SaveTourButton({ slug, title }: { slug: string; title: string }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => setSaved(read().includes(slug)), [slug]);

  function toggle() {
    const list = read();
    const next = list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage blocked: the button just does nothing */ }
    setSaved(next.includes(slug));
  }

  return (
    <button type="button" onClick={toggle} aria-pressed={saved} aria-label={saved ? `Remove ${title} from saved tours` : `Save ${title}`}
      className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition ${saved ? 'bg-white text-gray-900' : 'bg-black/40 text-white hover:bg-black/55'}`}>
      <FontAwesomeIcon icon={faBookmark} className="h-3.5 w-3.5" />
    </button>
  );
}
