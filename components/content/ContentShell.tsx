import type { ReactNode } from 'react';

import ServiceHero from '@/components/ServiceHero';
import { ServiceTheme } from '@/components/ServiceTheme';

// Page frame for the content pages (blog, destinations, policies). Reuses the
// service-page hero and theme so these pages match the rest of the site.
export default function ContentShell({
  title,
  titleAccent,
  description,
  accent = 'teal',
  wide = false,
  children,
}: {
  title: string;
  titleAccent: string;
  description: string;
  accent?: 'teal' | 'orange';
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <ServiceTheme>
      <div style={{ background: 'var(--sp-bg-primary)', color: 'var(--sp-text-primary)' }}>
        <ServiceHero title={title} titleAccent={titleAccent} description={description} accentColor={accent} />
        <div className={`mx-auto w-full px-4 py-12 ${wide ? 'max-w-6xl' : 'max-w-5xl'}`}>{children}</div>
      </div>
    </ServiceTheme>
  );
}

export const cardStyle = {
  background: 'var(--sp-bg-card)',
  border: '1px solid var(--sp-border)',
  boxShadow: 'var(--sp-shadow-sm)',
} as const;
