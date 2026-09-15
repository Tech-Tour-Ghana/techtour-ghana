// Validates every environment variable through Zod so a missing or malformed
// value fails at import time, not deep inside a request handler. The client
// schema and server schema are kept separate: NEXT_PUBLIC_* values are read
// through full literal `process.env.NEXT_PUBLIC_X` property access, because
// that is the only form Next.js inlines at build time (destructuring
// process.env would leave those values undefined in the client bundle).
// Server-only values are parsed inside a `typeof window === "undefined"`
// block, which never runs in the browser, and are handed out only through
// getServerEnv(), which throws if it is ever called client side. That makes
// it structurally impossible for a Client Component to read a secret through
// this module, not just discouraged by convention.

import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PAYSTACK_SECRET_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
});

type ClientEnv = z.infer<typeof clientSchema>;
type ServerEnv = z.infer<typeof serverSchema>;

function issueLines(error: z.ZodError): string[] {
  return error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`);
}

const clientResult = clientSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

// Collect every problem before throwing, so the one error that surfaces on a
// fresh checkout names every offending variable at once, not just the first.
const allIssues: string[] = clientResult.success ? [] : issueLines(clientResult.error);

let serverEnv: ServerEnv | undefined;

if (typeof window === "undefined") {
  const serverResult = serverSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  });

  if (serverResult.success) {
    serverEnv = serverResult.data;
  } else {
    allIssues.push(...issueLines(serverResult.error));
  }
}

if (allIssues.length > 0) {
  throw new Error(["Invalid or missing environment variables:", ...allIssues].join("\n"));
}

/** Client-safe environment variables. Readable from both client and server code. */
export const env: ClientEnv = clientResult.data as ClientEnv;

/**
 * Server-only environment variables. Throws if called in a browser context,
 * so a secret can never be read from code that ended up in a client bundle.
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error(
      "getServerEnv() was called in a browser context. Server-only environment variables must never be read from client code.",
    );
  }
  return serverEnv as ServerEnv;
}
