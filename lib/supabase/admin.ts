import "server-only";

// Supabase client for code with no user session to act on behalf of. Uses the
// service role key, which bypasses row level security entirely, so its use is
// restricted to exactly one caller: the Paystack webhook (architecture.md
// section 6, design.md B7). Everything else must use lib/supabase/server or
// lib/supabase/client, where RLS is the enforcement boundary.
//
// The "server-only" import is what makes this structurally impossible to
// import from client code, the same guard lib/env.server.ts uses: a file that
// imports this and ends up in a client bundle fails the build instead of
// leaking the key at runtime.
//
// No session persistence or auto-refresh, this client acts as no user and
// nothing here needs a session to expire or renew.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/lib/env.server";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

export function createAdminClient() {
  // getServerEnv()'s inferred return type carries `| undefined` from the
  // module-level parse result, but by the time this runs the module has
  // already thrown at import if parsing failed, so the value here is always
  // defined.
  const serverEnv = getServerEnv()!;

  return createSupabaseClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
