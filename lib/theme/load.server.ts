import { createClient as createPublicClient } from '@supabase/supabase-js';
import { cache } from 'react';

import { env } from '@/lib/env';
import type { Database } from '@/types/database';

import { buildThemeCss, cleanOverrides, isDefaultTheme, type DefaultTheme } from './tokens';

export interface SiteTheme { css: string; defaultTheme: DefaultTheme }

// Same cookie-less public read as getSiteSeo, so the root layout stays statically
// renderable. Saving the theme in the admin revalidates the layout.
export const getSiteTheme = cache(async (): Promise<SiteTheme> => {
  const supabase = createPublicClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data } = await supabase.from('site_settings').select('theme, default_theme').limit(1).maybeSingle();
  return {
    css: buildThemeCss(cleanOverrides(data?.theme)),
    defaultTheme: isDefaultTheme(data?.default_theme) ? data.default_theme : 'system',
  };
});
