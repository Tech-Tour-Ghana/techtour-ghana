'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faShareNodes } from '@fortawesome/free-solid-svg-icons';

/** Round share button for a card. Uses the device share sheet, else copies the link. */
export default function ShareButton({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* the reader closed the share sheet */ }
  }

  return (
    <button type="button" onClick={share} aria-label={copied ? 'Link copied' : `Share ${title}`} title={copied ? 'Link copied' : 'Share'}
      className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:opacity-90" style={{ background: 'var(--sp-primary)' }}>
      <FontAwesomeIcon icon={copied ? faCheck : faShareNodes} className="h-3.5 w-3.5" />
    </button>
  );
}
