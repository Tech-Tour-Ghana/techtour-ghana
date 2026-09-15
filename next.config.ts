import type { NextConfig } from "next";
import { clientSchema, serverSchema, collect, FAILURE_HEADER } from "./lib/env.schema";

// Validating here is what makes a missing variable fail the build rather than
// surfacing later at runtime. This file cannot import lib/env.server.ts,
// because the server-only guard that module carries needs a react-server
// export condition Next's config loader does not set, so the import would
// throw on every build. Reading both schemas from the side-effect-free
// lib/env.schema.ts covers all seven variables in one aggregated error
// instead. next.config.ts is never bundled for the browser, so reading the
// three secrets here ships them nowhere.

const issues: string[] = [];

collect(
  clientSchema,
  {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  issues,
);

collect(
  serverSchema,
  {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
  issues,
);

if (issues.length > 0) {
  throw new Error([FAILURE_HEADER, ...issues].join("\n"));
}

const nextConfig: NextConfig = {};

export default nextConfig;
