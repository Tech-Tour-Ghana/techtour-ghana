// Refreshes the Supabase session on every request and gates the customer
// account pages. Admin routes are excluded: app/admin/(protected)/layout.tsx
// checks is_admin itself and /admin/login must stay reachable.
//
// getUser() revalidates the token with the auth server, getSession() would
// only trust the cookie (see lib/supabase/server.ts).

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

const PROTECTED = ["/auth/dashboard", "/auth/orders", "/auth/payments", "/auth/profile", "/auth/settings", "/auth/tours", "/auth/study", "/auth/wishlist"];
const GUEST_ONLY = ["/auth/login", "/auth/register"];

const matches = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname, search } = request.nextUrl;

  // Redirects must carry the refreshed cookies, so copy them across.
  const redirectTo = (url: URL) => {
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (!user && matches(pathname, PROTECTED)) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("next", pathname + search);
    return redirectTo(url);
  }

  if (user && matches(pathname, GUEST_ONLY)) {
    return redirectTo(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
