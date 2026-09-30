'use client';

// One breadcrumb bar for every public page, built from the URL. Pages that know
// a nicer name for the last item (a product, an article) declare it with
// <CrumbLabel>. Pages that already draw their own trail are left out.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import Breadcrumbs, { type Crumb } from '@/components/Breadcrumbs';
import { BLOG_CATEGORIES } from '@/lib/content/blog';

const LABELS: Record<string, string> = {
  about: 'About', 'our-story': 'Our Story', 'our-team': 'Meet the Team', partnership: 'Partnerships', careers: 'Careers', 'contact-us': 'Contact Us',
  services: 'Services', 'onsite-tourism': 'Onsite Tourism', 'dream-vacations': 'Dream Vacations', 'study-abroad': 'Study Abroad',
  destinations: 'Destinations', tours: 'Tours Listings', blog: 'Blog Updates', market: 'TechTour Market', artisans: 'Artisan Spotlight', 'tech-innovation': 'Tech & Innovation',
  faq: 'FAQ', privacy: 'Privacy Policy', terms: 'Terms of Service', cookies: 'Cookie Policy', refund: 'Refund Policy', sitemap: 'Sitemap',
  study: 'Study', positions: 'Open Positions', all: 'All',
};

// Levels that have no page of their own, so they are shown as plain text.
const NO_PAGE = new Set(['/about', '/services']);

// Pages that draw their own trail inside the page.
const OWN_TRAIL = [/^\/services\/[^/]+\/[^/]+$/, /^\/about\/partnership\/[^/]+$/, /^\/about\/careers\/positions$/];

const titleCase = (slug: string) => slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const Ctx = createContext<(label: string | null) => void>(() => {});

/** Wrap the app once. Holds the label a page has set for its own last crumb. */
export function CrumbProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [override, setOverride] = useState<{ path: string; label: string } | null>(null);
  const set = useMemo(() => (label: string | null) => setOverride(label ? { path: pathname, label } : null), [pathname]);
  return (
    <Ctx.Provider value={set}>
      <OverrideCtx.Provider value={override}>{children}</OverrideCtx.Provider>
    </Ctx.Provider>
  );
}
const OverrideCtx = createContext<{ path: string; label: string } | null>(null);

/** Declares the name of the current page for the breadcrumb, for example the product title. */
export function CrumbLabel({ label }: { label: string }) {
  const set = useContext(Ctx);
  useEffect(() => { set(label); return () => set(null); }, [label, set]);
  return null;
}

export default function SiteBreadcrumbs() {
  const pathname = usePathname() ?? '/';
  const override = useContext(OverrideCtx);
  if (pathname === '/' || OWN_TRAIL.some((re) => re.test(pathname))) return null;

  const segments = pathname.split('/').filter(Boolean);
  const items: Crumb[] = segments.map((seg, i) => {
    const path = `/${segments.slice(0, i + 1).join('/')}`;
    const last = i === segments.length - 1;
    let label = LABELS[seg] ?? titleCase(seg);
    if (segments[0] === 'blog' && i === 1 && seg in BLOG_CATEGORIES) label = BLOG_CATEGORIES[seg as keyof typeof BLOG_CATEGORIES].label;
    if (last && override?.path === pathname) label = override.label;
    return { label, href: last || NO_PAGE.has(path) ? undefined : path };
  });

  return (
    <div className="border-b" style={{ borderColor: 'rgba(128,128,128,0.18)' }}>
      <div className="mx-auto w-full max-w-7xl px-4 py-2.5"><Breadcrumbs items={items} /></div>
    </div>
  );
}
