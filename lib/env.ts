// Validates the client-safe environment variables through Zod, failing at
// import time if any are missing or malformed. NEXT_PUBLIC_* values are read
// through full literal `process.env.NEXT_PUBLIC_X` property access, because
// that is the only form Next.js inlines at build time (destructuring
// process.env would leave those values undefined in the client bundle).
// This module holds only variables that are already meant to reach the
// browser. The server-only secrets live in lib/env.server.ts, which a
// client bundle cannot import at all without the build failing.

import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url(),
});

type ClientEnv = z.infer<typeof clientSchema>;

function parse<T extends z.ZodType>(schema: T, input: unknown, issues: string[]): z.infer<T> {
  const result = schema.safeParse(input);
  if (result.success) {
    return result.data;
  }
  issues.push(
    ...result.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`),
  );
  return undefined as z.infer<T>;
}

const issues: string[] = [];

const parsedEnv = parse(
  clientSchema,
  {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  issues,
);

if (issues.length > 0) {
  throw new Error(
    [
      "Invalid or missing environment variables (copy .env.example to .env.local and fill these in):",
      ...issues,
    ].join("\n"),
  );
}

/** Client-safe environment variables. Safe to import from client or server code. */
export const env: ClientEnv = parsedEnv;
