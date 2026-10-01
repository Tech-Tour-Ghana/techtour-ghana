'use client';

// Team profile: cover banner, overlapping avatar, role badge, optional stats,
// about text and a contact button. Colours come from the --sp-* theme tokens,
// so it follows light and dark mode.

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedinIn } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

import Button from '@/components/ui/Button';

export interface TeamProfile {
  name: string;
  role: string;
  bio: string;
  image?: string | null;
  initials?: string;
  /** Small pill under the cover, e.g. "Founder". */
  badge?: string;
  /** Up to three figures shown in a row, e.g. { label: 'Regions', value: '16' }. */
  stats?: { label: string; value: string }[];
  email?: string;
  linkedin?: string;
}

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');

export default function TeamProfileCard({ member, contactHref = '/about/contact-us' }: { member: TeamProfile; contactHref?: string }) {
  const [broken, setBroken] = useState(false);
  const showImage = !!member.image && !broken;
  const social = member.linkedin || (member.email ? `mailto:${member.email}` : '');

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] p-2" style={{ background: 'var(--sp-bg-card)', border: '1px solid var(--sp-border)', boxShadow: 'var(--sp-shadow-sm)' }}>
      <div className="h-28 rounded-[1.25rem] sm:h-32" style={{ background: 'radial-gradient(120% 140% at 15% 0%, #E6A64D 0%, rgba(230,166,77,0) 55%), radial-gradient(110% 130% at 100% 100%, #0D7A7D 0%, rgba(13,122,125,0) 60%), linear-gradient(135deg, #139EA2 0%, #1A1A2E 100%)' }} />

      <div className="-mt-12 flex items-end justify-between px-4">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full text-2xl font-bold text-white" style={{ background: 'var(--sp-primary)', border: '4px solid var(--sp-bg-card)' }}>
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.image!} alt={member.name} className="h-full w-full object-cover" style={{ objectPosition: 'center 20%' }} onError={() => setBroken(true)} />
            ) : (member.initials || initialsOf(member.name))}
          </div>
          <span aria-hidden className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full bg-emerald-500" style={{ border: '3px solid var(--sp-bg-card)' }} />
        </div>
        {member.badge && (
          <span className="mb-1 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{member.badge}
          </span>
        )}
      </div>

      <div className="px-4 pb-3 pt-3">
        <h3 className="text-lg font-bold leading-tight" style={{ color: 'var(--sp-text-primary)' }}>{member.name}</h3>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--sp-text-muted)' }}>{member.role}</p>
      </div>

      {member.stats && member.stats.length > 0 && (
        <dl className="grid border-y" style={{ gridTemplateColumns: `repeat(${Math.min(3, member.stats.length)}, minmax(0, 1fr))`, borderColor: 'var(--sp-border)' }}>
          {member.stats.slice(0, 3).map((s, i) => (
            <div key={s.label} className="px-3 py-3 text-center" style={{ borderLeft: i ? '1px solid var(--sp-border)' : undefined }}>
              <dt className="text-xs" style={{ color: 'var(--sp-text-muted)' }}>{s.label}</dt>
              <dd className="mt-1 text-xl font-bold" style={{ color: 'var(--sp-text-primary)' }}>{s.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
        <h4 className="text-sm font-semibold" style={{ color: 'var(--sp-text-primary)' }}>About</h4>
        <p className="mt-1 flex-1 text-sm leading-relaxed" style={{ color: 'var(--sp-text-secondary)' }}>{member.bio}</p>
        <div className="mt-4 flex items-center gap-2">
          <Button href={contactHref} variant="accent" full>Get in touch</Button>
          {social && (
            <a href={social} target={member.linkedin ? '_blank' : undefined} rel="noopener noreferrer" aria-label={member.linkedin ? `${member.name} on LinkedIn` : `Email ${member.name}`}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition hover:opacity-80" style={{ background: 'var(--sp-bg-primary)', border: '1px solid var(--sp-border)', color: 'var(--sp-text-primary)' }}>
              <FontAwesomeIcon icon={member.linkedin ? faLinkedinIn : faEnvelope} className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
