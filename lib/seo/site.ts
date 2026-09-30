// Maps the site_settings SEO columns onto the SiteSeo shape the resolver uses.

import { DEFAULT_SITE_SEO, EMPTY_SEO, type SeoFields, type SiteSeo } from "./resolve.ts";

interface SiteSettingsSeoRow {
  seo_site_name?: string | null;
  seo_title_pattern?: string | null;
  seo_default_description?: string | null;
  seo_default_image_url?: string | null;
  seo_org_name?: string | null;
  seo_org_logo_url?: string | null;
  seo_social_profiles?: string[] | null;
}

export function siteSeoFrom(row: SiteSettingsSeoRow | null | undefined, baseUrl: string): SiteSeo {
  const d = DEFAULT_SITE_SEO;
  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    siteName: row?.seo_site_name?.trim() || d.siteName,
    titlePattern: row?.seo_title_pattern?.trim() || d.titlePattern,
    defaultDescription: row?.seo_default_description?.trim() || "",
    defaultImageUrl: row?.seo_default_image_url?.trim() || "",
    orgName: row?.seo_org_name?.trim() || d.orgName,
    orgLogoUrl: row?.seo_org_logo_url?.trim() || "",
    socialProfiles: row?.seo_social_profiles ?? [],
  };
}

/** A seo_metadata row (or nothing) as complete SeoFields. */
export function seoFieldsFrom(row: Partial<SeoFields> | null | undefined): SeoFields {
  return { ...EMPTY_SEO, ...(row ?? {}) };
}

export const SEO_COLUMNS =
  "seo_title, meta_description, focus_keyword, canonical_url, robots_index, robots_follow, og_title, og_description, og_image_url, twitter_title, twitter_description, twitter_image_url";
