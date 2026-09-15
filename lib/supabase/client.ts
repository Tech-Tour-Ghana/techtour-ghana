// Supabase client for Client Components. Uses the publishable key, so it is
// safe to run in the browser. Row level security is the enforcement boundary
// for whatever it reads or writes (architecture.md section 6).
//
// Named createBrowserClient rather than createClient on purpose. Using this
// one from server code compiles and runs, reads no auth cookies, and then
// quietly returns empty results from every row level security protected
// query, which reads as missing data rather than as a mistake. The distinct
// name makes the wrong import visible.

import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

export function createBrowserClient() {
  return createSupabaseBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
