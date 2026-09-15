import "server-only";

// Validates the server-only environment variables through Zod, failing at
// import time if any are missing or malformed. The "server-only" import
// above is what makes the guarantee real: it turns importing this module
// from a file that ends up in a client bundle into a build error, in both
// the server render pass and the browser pass. A runtime `typeof window`
// check cannot do this, because during the server render of a Client
// Component `window` is undefined even though the code is destined for the
// browser.

import { z } from "zod";

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PAYSTACK_SECRET_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
});

type ServerEnv = z.infer<typeof serverSchema>;

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

const parsedServerEnv = parse(
  serverSchema,
  {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
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

/** Server-only environment variables. This module must never be imported by client code. */
export function getServerEnv(): ServerEnv {
  return parsedServerEnv;
}
