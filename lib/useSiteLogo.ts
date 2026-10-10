'use client';

// The site logo from Admin > Settings > Branding, for client components that show
// it (the account and admin sidebars). One fetch per page load, shared by every
// caller; falls back to the bundled logo while loading or when none is set.

import { useEffect, useState } from 'react';

import { createBrowserClient } from '@/lib/supabase/client';

export const FALLBACK_LOGO = '/images/logo-40x40.png';

let cached: string | null = null;
let pending: Promise<string> | null = null;

function load(): Promise<string> {
  pending ??= Promise.resolve(createBrowserClient().from('site_settings').select('logo_url').limit(1).maybeSingle())
    .then(({ data }) => (cached = data?.logo_url || FALLBACK_LOGO))
    .catch(() => (cached = FALLBACK_LOGO));
  return pending;
}

export function useSiteLogo(): string {
  const [logo, setLogo] = useState(cached ?? FALLBACK_LOGO);
  useEffect(() => {
    let live = true;
    void load().then((l) => live && setLogo(l));
    return () => { live = false; };
  }, []);
  return logo;
}
