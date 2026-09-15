// Validates the client-safe environment variables through Zod, failing at
// import time if any are missing or malformed. NEXT_PUBLIC_* values are read
// through full literal `process.env.NEXT_PUBLIC_X` property access, because
// that is the only form Next.js inlines at build time. Destructuring
// process.env would leave these undefined in the client bundle.
//
// The schemas live in lib/env.schema.ts, which has no side effects. Server
// secrets live in lib/env.server.ts, which a client bundle cannot import
// without the build failing.

import { clientSchema, collect, FAILURE_HEADER } from "./env.schema";

const issues: string[] = [];

const parsed = collect(
  clientSchema,
  {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  issues,
);

if (!parsed) {
  throw new Error([FAILURE_HEADER, ...issues].join("\n"));
}

/** Client-safe environment variables. Safe to import from client or server code. */
export const env = parsed;
