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

const PROTECTED = ["/auth/dashboard", "/auth/orders", "/auth/payments", "/auth/profile", "/auth/settings", "/auth/tours", "/auth/study", "/auth/wishlist", "/auth/notifications", "/auth/security"];
const GUEST_ONLY = ["/auth/login", "/auth/register"];

const matches = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

// Admin-managed redirects (SEO Manager > Redirects). The table is tiny, so each
// instance keeps a copy for a short while instead of querying on every request.
type Rule = { to: string; code: 301 | 302 };
let redirectCache: { at: number; rules: Map<string, Rule> } | null = null;
const REDIRECT_TTL_MS = 30_000;

const normalizePath = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);

async function loadRedirects(supabase: ReturnType<typeof createServerClient<Database>>) {
  if (redirectCache && Date.now() - redirectCache.at < REDIRECT_TTL_MS) return redirectCache.rules;
  const { data, error } = await supabase.from("redirects").select("source_path, destination, status_code").eq("is_active", true).limit(2000);
  // On failure keep serving the previous copy rather than breaking every page.
  if (error) return redirectCache?.rules ?? new Map<string, Rule>();
  const rules = new Map<string, Rule>((data ?? []).map((r) => [normalizePath(r.source_path), { to: r.destination, code: r.status_code === 302 ? 302 : 301 }]));
  redirectCache = { at: Date.now(), rules };
  return rules;
}

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

  if ((request.method === "GET" || request.method === "HEAD") && !pathname.startsWith("/admin") && !pathname.startsWith("/api")) {
    const rule = (await loadRedirects(supabase)).get(normalizePath(pathname));
    if (rule) {
      const target = new URL(rule.to, request.url);
      // A rule that points at itself would loop, ignore it.
      if (normalizePath(target.pathname) !== normalizePath(pathname) || target.origin !== request.nextUrl.origin) {
        if (target.origin === request.nextUrl.origin) target.search = request.nextUrl.search;
        const redirect = NextResponse.redirect(target, rule.code);
        for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
        return redirect;
      }
    }
  }

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|tinymce/|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
