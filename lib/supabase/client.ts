// Supabase client for Client Components. Uses the publishable key, so it is
// safe to run in the browser. Row level security is the enforcement boundary
// for whatever it reads or writes (architecture.md section 6).

import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
