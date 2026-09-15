// Pure environment variable shapes. No side effects, no process.env access,
// nothing that reads a live value. That is what makes it safe to import from
// anywhere, including next.config.ts, which cannot import lib/env.server.ts
// (the server-only guard it carries needs a react-server export condition
// that Next's config loader does not set, so that import throws on every
// build). lib/env.ts and lib/env.server.ts each import the half they own and
// do their own process.env reads. next.config.ts imports both halves so a
// build validates all seven variables in one pass.

import { z } from "zod";

export const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url(),
});

export const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PAYSTACK_SECRET_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
});

export const FAILURE_HEADER =
  "Invalid or missing environment variables (copy .env.example to .env.local and fill these in):";

/**
 * Parses input against schema. Returns the parsed value, or undefined after
 * pushing one formatted line per issue onto `issues`. Returning undefined
 * rather than throwing lets a caller collect issues from several schemas and
 * report them all at once.
 */
export function collect<T extends z.ZodType>(
  schema: T,
  input: unknown,
  issues: string[],
): z.infer<T> | undefined {
  const result = schema.safeParse(input);
  if (!result.success) {
    issues.push(
      ...result.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`),
    );
    return undefined;
  }
  return result.data;
}
