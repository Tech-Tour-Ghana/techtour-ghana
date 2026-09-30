// Refreshes the Supabase session on every request and gates the customer
// account pages. Admin routes are excluded: app/admin/(protected)/layout.tsx
// checks is_admin itself and /admin/login must stay reachable.
//
// getUser() revalidates the token with the auth server, getSession() would
// only trust the cookie (see lib/supabase/server.ts).

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { DEFAULT_MAINTENANCE, isMaintenanceExempt, maintenanceFrom, type MaintenanceSettings } from "@/lib/maintenance";
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

// Maintenance mode (Admin > Maintenance Mode). Kept per instance for a few seconds
// so it is not queried on every request. If the lookup fails the site stays up.
let maintenanceCache: { at: number; value: MaintenanceSettings } | null = null;
const MAINTENANCE_TTL_MS = 10_000;

async function loadMaintenance(supabase: ReturnType<typeof createServerClient<Database>>) {
  if (maintenanceCache && Date.now() - maintenanceCache.at < MAINTENANCE_TTL_MS) return maintenanceCache.value;
  const { data, error } = await supabase
    .from("site_settings")
    .select("maintenance_enabled, maintenance_title, maintenance_message, maintenance_eta, maintenance_contact_email")
    .limit(1)
    .maybeSingle();
  if (error) return maintenanceCache?.value ?? DEFAULT_MAINTENANCE;
  const value = maintenanceFrom(data);
  maintenanceCache = { at: Date.now(), value };
  return value;
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

  // While maintenance mode is on, everyone except signed-in admins gets the
  // maintenance page (HTTP 503, so search engines treat it as temporary).
  if (!isMaintenanceExempt(pathname)) {
    const maintenance = await loadMaintenance(supabase);
    if (maintenance.enabled) {
      let isAdmin = false;
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
        isAdmin = !!profile?.is_admin;
      }
      if (!isAdmin) {
        const untilEta = maintenance.eta ? Math.ceil((new Date(maintenance.eta).getTime() - Date.now()) / 1000) : 0;
        const retryAfter = String(untilEta > 60 ? Math.min(untilEta, 86_400) : 3600);
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "The site is under maintenance. Please try again later." }, { status: 503, headers: { "Retry-After": retryAfter } });
        }
        const blocked = NextResponse.rewrite(new URL("/maintenance", request.url), { status: 503 });
        blocked.headers.set("Retry-After", retryAfter);
        blocked.headers.set("Cache-Control", "no-store");
        blocked.headers.set("X-Robots-Tag", "noindex");
        for (const cookie of response.cookies.getAll()) blocked.cookies.set(cookie);
        return blocked;
      }
    }
  }

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
