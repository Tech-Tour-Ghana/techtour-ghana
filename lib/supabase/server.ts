// Supabase client for Server Components, Server Actions, and Route Handlers.
// Uses the publishable key and reads/writes the auth cookies so a session
// established in one request is visible in the next.
//
// `cookies()` is async in Next.js 15, so this factory is async too.
//
// A Server Component can read cookies but cannot set them, that call throws.
// The `catch` below swallows it: middleware.ts (a later task) refreshes the
// session on every request instead, so a Server Component skipping a cookie
// write here does not break auth.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, which cannot set cookies.
          // Expected; middleware.ts refreshes the session instead.
        }
      },
    },
  });
}
