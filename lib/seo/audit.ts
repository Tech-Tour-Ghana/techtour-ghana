// On-site SEO audit over TechTour's own content. This is not Search Console data
// and says nothing about rankings: it only checks what TechTour itself stores.

import { analyzeHtml } from "./html.ts";
import { isValidCanonical, resolveSeo, type SeoFields, type SiteSeo } from "./resolve.ts";
import { analyzeSeo, type SeoAnalysis } from "./score.ts";

export interface AuditInput {
  kind: "blog_post" | "destination" | "blog_category";
  key: string;
  name: string;
  /** Admin page where this item is edited. */
  href: string;
  /** Live content is published/active. Drafts are not audited site-wide because they are not public. */
  live: boolean;
  slug: string;
  path: string;
  excerpt: string;
  contentHtml: string;
  imageUrl: string;
  imageAlt: string;
  seo: SeoFields;
}

export interface AuditedItem extends AuditInput {
  analysis: SeoAnalysis;
  effectiveTitle: string;
  effectiveDescription: string;
}

export interface AuditReport {
  items: AuditedItem[];
  live: AuditedItem[];
  missingTitle: AuditedItem[];
  missingDescription: AuditedItem[];
  missingImage: AuditedItem[];
  missingAlt: AuditedItem[];
  duplicateTitles: { text: string; items: AuditedItem[] }[];
  duplicateDescriptions: { text: string; items: AuditedItem[] }[];
  noindex: AuditedItem[];
  badCanonical: AuditedItem[];
  needsImprovement: AuditedItem[];
}

const dupes = (items: AuditedItem[], pick: (i: AuditedItem) => string) => {
  const groups = new Map<string, AuditedItem[]>();
  for (const i of items) {
    const key = pick(i).trim().toLowerCase();
    if (key) groups.set(key, [...(groups.get(key) ?? []), i]);
  }
  return [...groups.values()].filter((g) => g.length > 1).map((g) => ({ text: pick(g[0]!), items: g }));
};

export function auditContent(inputs: AuditInput[], site: SiteSeo): AuditReport {
  const items: AuditedItem[] = inputs.map((i) => {
    const analysis = analyzeSeo({
      title: i.name, slug: i.slug, path: i.path, excerpt: i.excerpt, contentHtml: i.contentHtml,
      featuredImageUrl: i.imageUrl, featuredImageAlt: i.imageAlt, seo: i.seo, site,
    });
    const r = resolveSeo({ path: i.path, title: i.name, excerpt: i.excerpt, imageUrl: i.imageUrl, seo: i.seo, site });
    return { ...i, analysis, effectiveTitle: r.bareTitle, effectiveDescription: r.description };
  });
  const live = items.filter((i) => i.live);
  return {
    items,
    live,
    missingTitle: live.filter((i) => !i.seo.seo_title.trim()),
    missingDescription: live.filter((i) => !i.seo.meta_description.trim()),
    missingImage: live.filter((i) => i.kind !== "blog_category" && !i.imageUrl.trim()),
    missingAlt: live.filter((i) => {
      if (i.kind !== "blog_post") return false;
      const featuredMissing = !!i.imageUrl.trim() && !i.imageAlt.trim();
      const bodyMissing = analyzeHtml(i.contentHtml).images.some((img) => !img.decorative && !img.alt.trim());
      return featuredMissing || bodyMissing;
    }),
    duplicateTitles: dupes(live, (i) => i.effectiveTitle),
    duplicateDescriptions: dupes(live, (i) => i.effectiveDescription),
    noindex: live.filter((i) => !i.seo.robots_index),
    badCanonical: live.filter((i) => !isValidCanonical(i.seo.canonical_url.trim())),
    needsImprovement: live.filter((i) => i.kind !== "blog_category" && i.analysis.score < 70),
  };
}

export type Health = "Good" | "Needs Improvement" | "Missing";

/** Overall health of one item for list badges. */
export function healthOf(i: AuditedItem): Health {
  if (!i.seo.seo_title.trim() || !i.seo.meta_description.trim()) return "Missing";
  // Category pages have no article body to score, their fields are all there is.
  if (i.kind === "blog_category") return "Good";
  return i.analysis.score >= 70 ? "Good" : "Needs Improvement";
}
