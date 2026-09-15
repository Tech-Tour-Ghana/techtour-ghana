import "server-only";

// Validates the server-only environment variables through Zod, failing at
// import time if any are missing or malformed.
//
// The "server-only" import above is what makes the guarantee real: it turns
// importing this module from a file that ends up in a client bundle into a
// build error, in both the server render pass and the browser pass. A runtime
// `typeof window` check cannot do this, because during the server render of a
// Client Component `window` is undefined even though that code is destined
// for the browser, so the secrets would be read and serialized into the HTML.
//
// next.config.ts cannot import this module, so it reads the same schema from
// lib/env.schema.ts directly. That is what keeps these variables covered at
// build time.

import type { z } from "zod";

import { serverSchema, collect, FAILURE_HEADER } from "./env.schema";

type ServerEnv = z.infer<typeof serverSchema>;

const issues: string[] = [];

const parsed = collect(
  serverSchema,
  {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
  issues,
);

if (!parsed) {
  throw new Error([FAILURE_HEADER, ...issues].join("\n"));
}

// Annotated so the narrowing above survives into getServerEnv. Without this
// the inferred type keeps the undefined arm, and every caller has to assert
// it away, which is the sort of lie that hides a real bug later.
const serverEnv: ServerEnv = parsed;

/** Server-only environment variables. Never importable from client code. */
export function getServerEnv(): ServerEnv {
  return serverEnv;
}
