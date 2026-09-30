// Turns stored SEO fields plus the content itself into the values a page
// actually outputs. Every fallback rule lives here so the editor preview, the
// score and the public <head> can never disagree.

export interface SeoFields {
  seo_title: string;
  meta_description: string;
  focus_keyword: string;
  canonical_url: string;
  robots_index: boolean;
  robots_follow: boolean;
  og_title: string;
  og_description: string;
  og_image_url: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image_url: string;
}

export const EMPTY_SEO: SeoFields = {
  seo_title: "",
  meta_description: "",
  focus_keyword: "",
  canonical_url: "",
  robots_index: true,
  robots_follow: true,
  og_title: "",
  og_description: "",
  og_image_url: "",
  twitter_title: "",
  twitter_description: "",
  twitter_image_url: "",
};

export interface SiteSeo {
  baseUrl: string;
  siteName: string;
  titlePattern: string;
  defaultDescription: string;
  defaultImageUrl: string;
  orgName: string;
  orgLogoUrl: string;
  socialProfiles: string[];
}

export const DEFAULT_SITE_SEO: SiteSeo = {
  baseUrl: "https://techtourghana.com",
  siteName: "TechTour Ghana",
  titlePattern: "%s | TechTour Ghana",
  defaultDescription: "",
  defaultImageUrl: "",
  orgName: "TechTour Ghana",
  orgLogoUrl: "",
  socialProfiles: [],
};

export interface ResolveInput {
  /** Public path, e.g. /blog/culture/kente-cloth. */
  path: string;
  /** The content's own title (article title, destination name). */
  title: string;
  excerpt: string;
  /** Featured image URL, absolute or root-relative. */
  imageUrl: string;
  seo: SeoFields;
  site: SiteSeo;
}

export interface ResolvedSeo {
  /** Text for <title>, with the site pattern applied. */
  title: string;
  /** The title without the site pattern, for social cards and schema. */
  bareTitle: string;
  description: string;
  canonical: string;
  canonicalValid: boolean;
  robots: { index: boolean; follow: boolean };
  og: { title: string; description: string; image: string; url: string };
  twitter: { title: string; description: string; image: string };
}

const trimSlash = (s: string) => s.replace(/\/+$/, "");

export function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  return `${trimSlash(baseUrl)}${value.startsWith("/") ? "" : "/"}${value}`;
}

/** A canonical override must be an http(s) URL or a root-relative path. */
export function isValidCanonical(value: string): boolean {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return !/\s/.test(value);
  try {
    const u = new URL(value);
    return (u.protocol === "https:" || u.protocol === "http:") && !/\s/.test(value);
  } catch {
    return false;
  }
}

export function applyTitlePattern(title: string, site: SiteSeo): string {
  if (!title) return site.siteName;
  if (title.toLowerCase().includes(site.siteName.toLowerCase())) return title;
  return site.titlePattern.includes("%s") ? site.titlePattern.replace("%s", title) : `${title} | ${site.siteName}`;
}

export function resolveSeo({ path, title, excerpt, imageUrl, seo, site }: ResolveInput): ResolvedSeo {
  const bareTitle = seo.seo_title.trim() || title.trim();
  const description = seo.meta_description.trim() || excerpt.trim() || site.defaultDescription.trim();
  const canonicalValid = isValidCanonical(seo.canonical_url.trim());
  const canonical = absoluteUrl(canonicalValid && seo.canonical_url.trim() ? seo.canonical_url.trim() : path, site.baseUrl);

  const ogTitle = seo.og_title.trim() || bareTitle;
  const ogDescription = seo.og_description.trim() || description;
  const ogImage = absoluteUrl(seo.og_image_url.trim() || imageUrl || site.defaultImageUrl, site.baseUrl);

  return {
    title: applyTitlePattern(bareTitle, site),
    bareTitle,
    description,
    canonical,
    canonicalValid,
    robots: { index: seo.robots_index, follow: seo.robots_follow },
    og: { title: ogTitle, description: ogDescription, image: ogImage, url: canonical },
    twitter: {
      title: seo.twitter_title.trim() || ogTitle,
      description: seo.twitter_description.trim() || ogDescription,
      image: absoluteUrl(seo.twitter_image_url.trim(), site.baseUrl) || ogImage,
    },
  };
}

// ---------------------------------------------------------------------------
// Structured data. Built only from data the page really shows.
// ---------------------------------------------------------------------------

export const organizationJsonLd = (site: SiteSeo) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.orgName || site.siteName,
  url: trimSlash(site.baseUrl),
  ...(site.orgLogoUrl ? { logo: absoluteUrl(site.orgLogoUrl, site.baseUrl) } : {}),
  ...(site.socialProfiles.length ? { sameAs: site.socialProfiles } : {}),
});

export const websiteJsonLd = (site: SiteSeo) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.siteName,
  url: trimSlash(site.baseUrl),
});

export const breadcrumbJsonLd = (crumbs: { name: string; path: string }[], site: SiteSeo) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: absoluteUrl(c.path, site.baseUrl),
  })),
});

export function articleJsonLd(input: {
  resolved: ResolvedSeo;
  headline: string;
  author: string;
  imageUrl: string;
  publishedAt: string | null;
  modifiedAt: string;
  site: SiteSeo;
}) {
  const { resolved, site } = input;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.headline,
    ...(resolved.description ? { description: resolved.description } : {}),
    ...(resolved.og.image ? { image: [resolved.og.image] } : {}),
    author: { "@type": "Person", name: input.author || site.orgName },
    publisher: {
      "@type": "Organization",
      name: site.orgName || site.siteName,
      ...(site.orgLogoUrl ? { logo: { "@type": "ImageObject", url: absoluteUrl(site.orgLogoUrl, site.baseUrl) } } : {}),
    },
    ...(input.publishedAt ? { datePublished: new Date(input.publishedAt).toISOString() } : {}),
    dateModified: new Date(input.modifiedAt).toISOString(),
    mainEntityOfPage: { "@type": "WebPage", "@id": resolved.canonical },
  };
}

export const destinationJsonLd = (input: { resolved: ResolvedSeo; name: string }) => ({
  "@context": "https://schema.org",
  "@type": "TouristDestination",
  name: input.name,
  ...(input.resolved.description ? { description: input.resolved.description } : {}),
  ...(input.resolved.og.image ? { image: input.resolved.og.image } : {}),
  url: input.resolved.canonical,
});

/** JSON for a <script type="application/ld+json"> tag, safe against "</script>". */
export const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
