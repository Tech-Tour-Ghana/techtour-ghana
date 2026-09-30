// Maintenance mode rules shared by middleware, the public page and the admin form.

export interface MaintenanceSettings {
  enabled: boolean;
  title: string;
  message: string;
  /** Expected return time, ISO. Optional. */
  eta: string | null;
  contactEmail: string;
}

export const DEFAULT_MAINTENANCE: MaintenanceSettings = {
  enabled: false,
  title: "We'll be right back",
  message: "We are making some improvements to TechTour Ghana. Thank you for your patience, we will be back very soon.",
  eta: null,
  contactEmail: "",
};

export const MAX_TITLE = 120;
export const MAX_MESSAGE = 1000;

interface MaintenanceRow {
  maintenance_enabled?: boolean | null;
  maintenance_title?: string | null;
  maintenance_message?: string | null;
  maintenance_eta?: string | null;
  maintenance_contact_email?: string | null;
}

export function maintenanceFrom(row: MaintenanceRow | null | undefined): MaintenanceSettings {
  return {
    enabled: row?.maintenance_enabled ?? false,
    title: row?.maintenance_title?.trim() || DEFAULT_MAINTENANCE.title,
    message: row?.maintenance_message?.trim() ?? DEFAULT_MAINTENANCE.message,
    eta: row?.maintenance_eta ?? null,
    contactEmail: row?.maintenance_contact_email?.trim() ?? "",
  };
}

/**
 * Paths that stay reachable while the site is in maintenance mode:
 * - /admin: so admins can sign in and switch it off again
 * - /auth/callback: the OAuth return for that sign-in
 * - /maintenance: the page itself
 * - /api/paystack: payment webhooks and verification must never be refused
 * - /api/analytics: harmless, and avoids noisy failures from the tracker
 * - robots.txt and sitemap.xml: crawlers should still get an answer
 */
const EXEMPT = ["/admin", "/auth/callback", "/maintenance", "/api/paystack", "/api/analytics", "/robots.txt", "/sitemap.xml"];

export const isMaintenanceExempt = (pathname: string) => EXEMPT.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export const isValidEmail = (s: string) => s === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/** Deterministic on server and client (fixed locale and zone), so it never causes a hydration mismatch. */
export const formatEta = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" }).format(new Date(iso)) + " GMT";
