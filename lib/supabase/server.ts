// Supabase client for Server Components, Server Actions, and Route Handlers.
// Uses the publishable key and reads and writes the auth cookies, so a session
// established in one request is visible in the next.
//
// `cookies()` is async in Next.js 15, so this factory is async too.
//
// Server code must call getUser(), never getSession(). getSession() returns
// whatever the cookie claims without revalidating it, so it can be forged.
// getUser() revalidates against the Supabase auth server. This matters most
// in middleware route protection, where getSession() is the obvious reach and
// the wrong one. Row level security still backstops the data layer, but a
// route gate built on getSession() is no gate at all.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch (error) {
            // A Server Component can read cookies but not set them, and Next
            // signals that by throwing. That case is expected and harmless,
            // because middleware refreshes the session on every request.
            //
            // Anything else is a real failure. In a Route Handler or Server
            // Action, where writes are legal, a failure part way through this
            // loop leaves Supabase's chunked auth cookie half written, so it
            // must not pass silently.
            if ((error as Error)?.name !== "ReadonlyRequestCookiesError") {
              throw error;
            }
          }
        },
      },
    },
  );
}
