'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faLinkedinIn, faWhatsapp, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { faCheck, faLink } from '@fortawesome/free-solid-svg-icons';

/** Share links for one article. `url` is the absolute canonical address. */
export default function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const items = [
    { name: 'WhatsApp', icon: faWhatsapp, href: `https://wa.me/?text=${t}%20${u}` },
    { name: 'X', icon: faXTwitter, href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { name: 'Facebook', icon: faFacebookF, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: 'LinkedIn', icon: faLinkedinIn, href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
  ];
  const style = { border: '1px solid var(--sp-border)', color: 'var(--sp-text-secondary)', background: 'var(--sp-bg-card)' };

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <a key={i.name} href={i.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${i.name}`} title={i.name}
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:opacity-80" style={style}>
          <FontAwesomeIcon icon={i.icon} className="h-3.5 w-3.5" />
        </a>
      ))}
      <button type="button" aria-label={copied ? 'Link copied' : 'Copy link'} title={copied ? 'Link copied' : 'Copy link'}
        onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ } }}
        className="flex h-9 w-9 items-center justify-center rounded-full transition hover:opacity-80" style={style}>
        <FontAwesomeIcon icon={copied ? faCheck : faLink} className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
