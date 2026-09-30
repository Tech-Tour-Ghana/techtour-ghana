// Deterministic on-site SEO analysis. The score is computed from the current
// title, metadata and content every time and is never stored, so it cannot go
// stale. It measures how well an article follows on-site best practice, not how
// it will rank on Google.

import { analyzeHtml, type HtmlStats } from "./html.ts";
import { resolveSeo, type SeoFields, type SiteSeo } from "./resolve.ts";
import { isValidSlug } from "./slug.ts";

export type CheckStatus = "pass" | "improve" | "critical";
export type ScoreLabel = "Needs Work" | "Fair" | "Good" | "Excellent";

export interface SeoCheck {
  id: string;
  group: "Search snippet" | "Focus topic" | "Content structure" | "Links" | "Images" | "URL" | "Social" | "Technical";
  status: CheckStatus;
  /** Short, plain sentence telling the admin what happened and what to do. */
  message: string;
  weight: number;
}

export interface SeoAnalysisInput {
  title: string;
  slug: string;
  path: string;
  excerpt: string;
  contentHtml: string;
  featuredImageUrl: string;
  featuredImageAlt: string;
  seo: SeoFields;
  site: SiteSeo;
}

export interface SeoAnalysis {
  score: number;
  label: ScoreLabel;
  checks: SeoCheck[];
  stats: HtmlStats;
}

export const scoreLabel = (score: number): ScoreLabel =>
  score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Fair" : "Needs Work";

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
const has = (haystack: string, needle: string) => needle !== "" && ` ${norm(haystack)} `.includes(` ${needle} `);
const countOf = (haystack: string, needle: string) => (needle ? ` ${norm(haystack)} `.split(` ${needle} `).length - 1 : 0);
const VAGUE_ANCHORS = new Set(["click here", "here", "read more", "more", "link", "this link", "this"]);

export function analyzeSeo(input: SeoAnalysisInput): SeoAnalysis {
  const { title, slug, excerpt, seo, site } = input;
  let siteHost: string | undefined;
  try { siteHost = new URL(site.baseUrl).host; } catch { siteHost = undefined; }
  const stats = analyzeHtml(input.contentHtml, siteHost);
  const resolved = resolveSeo({ path: input.path, title, excerpt, imageUrl: input.featuredImageUrl, seo, site });
  const keyword = norm(seo.focus_keyword);
  const checks: SeoCheck[] = [];
  const add = (c: SeoCheck) => checks.push(c);

  // ---- Search snippet -------------------------------------------------
  const customTitle = seo.seo_title.trim();
  add(customTitle
    ? { id: "seo-title", group: "Search snippet", status: "pass", weight: 2, message: "SEO title configured." }
    : title.trim()
      ? { id: "seo-title", group: "Search snippet", status: "improve", weight: 2, message: "No SEO title set, the article title is used. Write one that suits a search result." }
      : { id: "seo-title", group: "Search snippet", status: "critical", weight: 2, message: "No SEO title and no article title." });

  const tl = resolved.bareTitle.length;
  add(tl >= 30 && tl <= 65
    ? { id: "seo-title-length", group: "Search snippet", status: "pass", weight: 2, message: `SEO title length is good (${tl} characters).` }
    : { id: "seo-title-length", group: "Search snippet", status: tl === 0 ? "critical" : "improve", weight: 2,
        message: tl < 30 ? `SEO title is short (${tl} characters). Around 50 to 60 usually reads best.` : `SEO title is long (${tl} characters) and may be cut off in results.` });

  const customDesc = seo.meta_description.trim();
  add(customDesc
    ? { id: "meta-description", group: "Search snippet", status: "pass", weight: 2, message: "Meta description configured." }
    : resolved.description
      ? { id: "meta-description", group: "Search snippet", status: "improve", weight: 2, message: "No meta description set, the excerpt is used instead. Write one for search results." }
      : { id: "meta-description", group: "Search snippet", status: "critical", weight: 2, message: "No meta description and no excerpt." });

  const dl = resolved.description.length;
  add(dl >= 120 && dl <= 170
    ? { id: "meta-description-length", group: "Search snippet", status: "pass", weight: 2, message: `Description length is good (${dl} characters).` }
    : { id: "meta-description-length", group: "Search snippet", status: dl === 0 ? "critical" : "improve", weight: 2,
        message: dl < 120 ? `Description is short (${dl} characters). Around 140 to 160 gives room to explain the article.` : `Description is long (${dl} characters) and may be cut off.` });

  // ---- Focus topic ----------------------------------------------------
  if (!keyword) {
    add({ id: "focus-set", group: "Focus topic", status: "improve", weight: 1, message: "Add a focus topic (the main thing people would search for) to get topic checks." });
  } else {
    const intro = stats.paragraphs[0] ?? "";
    const introWords = intro.split(/\s+/).slice(0, 120).join(" ");
    add({ id: "kw-seo-title", group: "Focus topic", weight: 1.5, status: has(resolved.bareTitle, keyword) ? "pass" : "improve",
      message: has(resolved.bareTitle, keyword) ? "Focus topic appears in the SEO title." : "Focus topic is missing from the SEO title." });
    add({ id: "kw-title", group: "Focus topic", weight: 1, status: has(title, keyword) ? "pass" : "improve",
      message: has(title, keyword) ? "Focus topic appears in the article title." : "Focus topic is missing from the article title." });
    add({ id: "kw-intro", group: "Focus topic", weight: 1.5, status: has(introWords, keyword) ? "pass" : "improve",
      message: has(introWords, keyword) ? "Focus topic appears in the introduction." : "Focus topic is missing from the introduction." });
    const headed = stats.headings.filter((h) => h.level >= 2);
    if (headed.length) {
      const ok = headed.some((h) => has(h.text, keyword));
      add({ id: "kw-heading", group: "Focus topic", weight: 1, status: ok ? "pass" : "improve",
        message: ok ? "Focus topic appears in a heading." : "Consider using the focus topic, or a close variation, in one heading." });
    }
    const uses = countOf(stats.text, keyword);
    const density = stats.wordCount ? (uses * keyword.split(" ").length) / stats.wordCount : 0;
    add(uses === 0
      ? { id: "kw-content", group: "Focus topic", weight: 1, status: "improve", message: "Focus topic does not appear in the article text." }
      : density > 0.03
        ? { id: "kw-content", group: "Focus topic", weight: 1, status: "improve", message: "Focus topic is repeated very often. Write naturally and vary the wording." }
        : { id: "kw-content", group: "Focus topic", weight: 1, status: "pass", message: `Focus topic is used naturally (${uses} time${uses > 1 ? "s" : ""}).` });
    const slugText = slug.replace(/-/g, " ");
    add({ id: "kw-slug", group: "Focus topic", weight: 1, status: has(slugText, keyword) ? "pass" : "improve",
      message: has(slugText, keyword) ? "Focus topic appears in the URL." : "Focus topic is not in the URL. Only change it if the article is not yet published." });
  }

  // ---- Content structure ---------------------------------------------
  const introLen = (stats.paragraphs[0] ?? "").split(/\s+/).filter(Boolean).length;
  add(introLen >= 20
    ? { id: "intro", group: "Content structure", weight: 1, status: "pass", message: "Article opens with an introduction." }
    : { id: "intro", group: "Content structure", weight: 1, status: "improve", message: "Open with a short introduction paragraph (at least a couple of sentences)." });

  if (stats.wordCount >= 300) {
    const h2 = stats.headings.filter((h) => h.level === 2).length;
    add(h2 > 0
      ? { id: "h2", group: "Content structure", weight: 1.5, status: "pass", message: `Article is divided with ${h2} H2 heading${h2 > 1 ? "s" : ""}.` }
      : { id: "h2", group: "Content structure", weight: 1.5, status: "improve", message: "Article has no H2 headings. Break longer articles into sections." });
  }

  const h1 = stats.headings.filter((h) => h.level === 1).length;
  add(h1 === 0
    ? { id: "no-h1", group: "Content structure", weight: 1, status: "pass", message: "No extra H1 in the article body." }
    : { id: "no-h1", group: "Content structure", weight: 1, status: "improve", message: "The article title is already the page H1. Use H2 and below inside the article." });

  let jump = false;
  let prev = 1;
  for (const h of stats.headings) {
    if (h.level > prev + 1) jump = true;
    prev = h.level;
  }
  if (stats.headings.length) {
    add(jump
      ? { id: "hierarchy", group: "Content structure", weight: 1, status: "improve", message: "Heading levels skip (for example H2 straight to H4). Keep them in order." }
      : { id: "hierarchy", group: "Content structure", weight: 1, status: "pass", message: "Heading hierarchy is in order." });
  }

  const longParas = stats.paragraphs.filter((p) => p.split(/\s+/).length > 150).length;
  add(longParas === 0
    ? { id: "paragraphs", group: "Content structure", weight: 1, status: "pass", message: "Paragraph lengths are comfortable." }
    : { id: "paragraphs", group: "Content structure", weight: 1, status: "improve", message: `${longParas} paragraph${longParas > 1 ? "s are" : " is"} very long. Split them up.` });

  add(stats.wordCount >= 300
    ? { id: "length", group: "Content structure", weight: 1, status: "pass", message: `Article has enough depth (${stats.wordCount} words).` }
    : stats.wordCount >= 100
      ? { id: "length", group: "Content structure", weight: 1, status: "improve", message: `Article is short (${stats.wordCount} words). Add detail only where it helps the reader.` }
      : { id: "length", group: "Content structure", weight: 1, status: "critical", message: `Article is very short (${stats.wordCount} words).` });

  // ---- Links ----------------------------------------------------------
  if (stats.wordCount >= 300) {
    const internal = stats.links.filter((l) => l.internal).length;
    add(internal > 0
      ? { id: "internal-links", group: "Links", weight: 1, status: "pass", message: `Internal links found (${internal}).` }
      : { id: "internal-links", group: "Links", weight: 1, status: "improve", message: "No internal links. Link to related TechTour articles or destinations." });
  }
  if (stats.links.length) {
    const vague = stats.links.filter((l) => VAGUE_ANCHORS.has(norm(l.text))).length;
    add(vague === 0
      ? { id: "anchors", group: "Links", weight: 0.5, status: "pass", message: "Link text is descriptive." }
      : { id: "anchors", group: "Links", weight: 0.5, status: "improve", message: `${vague} link${vague > 1 ? "s use" : " uses"} vague text like "click here". Describe where it goes.` });
  }

  // ---- Images ---------------------------------------------------------
  const featured = input.featuredImageUrl.trim();
  add(featured
    ? { id: "featured-image", group: "Images", weight: 2, status: "pass", message: "Featured image set." }
    : { id: "featured-image", group: "Images", weight: 2, status: "critical", message: "No featured image. Add one for cards and social sharing." });
  if (featured) {
    add(input.featuredImageAlt.trim()
      ? { id: "featured-alt", group: "Images", weight: 1.5, status: "pass", message: "Featured image has alt text." }
      : { id: "featured-alt", group: "Images", weight: 1.5, status: "improve", message: "Featured image has no alt text. Describe what it shows." });
  }
  if (stats.images.length) {
    const missing = stats.images.filter((i) => !i.decorative && !i.alt.trim()).length;
    add(missing === 0
      ? { id: "body-alt", group: "Images", weight: 1.5, status: "pass", message: "All images in the article have alt text." }
      : { id: "body-alt", group: "Images", weight: 1.5, status: "improve", message: `${missing} image${missing > 1 ? "s" : ""} in the article ${missing > 1 ? "have" : "has"} no alt text.` });
  }
  if (stats.hasInlineDataImage) {
    add({ id: "inline-images", group: "Images", weight: 1.5, status: "critical", message: "The article contains an embedded (base64) image. Insert images from the Media Library." });
  }

  // ---- URL ------------------------------------------------------------
  add(slug
    ? { id: "slug", group: "URL", weight: 1, status: "pass", message: "URL slug set." }
    : { id: "slug", group: "URL", weight: 1, status: "critical", message: "No URL slug." });
  if (slug) {
    const words = slug.split("-").length;
    add(isValidSlug(slug) && slug.length <= 75 && words <= 10
      ? { id: "slug-quality", group: "URL", weight: 1, status: "pass", message: "URL is short and readable." }
      : { id: "slug-quality", group: "URL", weight: 1, status: "improve", message: "URL could be shorter and use only lowercase words joined by hyphens." });
  }

  // ---- Social ---------------------------------------------------------
  add(resolved.og.image
    ? { id: "social-image", group: "Social", weight: 1, status: "pass", message: seo.og_image_url.trim() ? "Social sharing image set." : "Social sharing image uses the featured image." }
    : { id: "social-image", group: "Social", weight: 1, status: "improve", message: "No social sharing image. Links shared on social media will have no picture." });
  add(resolved.og.title && resolved.og.description
    ? { id: "social-text", group: "Social", weight: 1, status: "pass", message: "Social title and description resolve." }
    : { id: "social-text", group: "Social", weight: 1, status: "improve", message: "Social title or description is empty." });

  // ---- Technical ------------------------------------------------------
  add(resolved.canonicalValid
    ? { id: "canonical", group: "Technical", weight: 1, status: "pass", message: "Canonical URL resolves." }
    : { id: "canonical", group: "Technical", weight: 1, status: "critical", message: "Canonical URL is not a valid address." });
  add(resolved.robots.index
    ? { id: "robots", group: "Technical", weight: 0.5, status: "pass", message: "Search engines are allowed to index this page." }
    : { id: "robots", group: "Technical", weight: 0.5, status: "improve", message: "This page is set to noindex and will not appear in search results." });
  add(resolved.description && resolved.og.image && title.trim()
    ? { id: "schema", group: "Technical", weight: 0.5, status: "pass", message: "Article structured data can be generated." }
    : { id: "schema", group: "Technical", weight: 0.5, status: "improve", message: "Structured data is incomplete until the article has a description and an image." });

  const total = checks.reduce((n, c) => n + c.weight, 0);
  const earned = checks.reduce((n, c) => n + c.weight * (c.status === "pass" ? 1 : c.status === "improve" ? 0.5 : 0), 0);
  const score = total ? Math.round((earned / total) * 100) : 0;
  return { score, label: scoreLabel(score), checks, stats };
}

/** Content quality guidance, separate from the SEO score. */
export function contentWarnings(stats: HtmlStats, hasFeatured: boolean): string[] {
  const out: string[] = [];
  if (stats.wordCount >= 300 && !stats.headings.some((h) => h.level >= 2)) out.push("No section headings.");
  if (stats.paragraphs.some((p) => p.split(/\s+/).length > 150)) out.push("Some paragraphs are very long.");
  if (stats.headings.some((h) => h.level === 1)) out.push("The article body contains an H1. The title is already the page H1.");
  if (!stats.paragraphs.length) out.push("No introduction paragraph yet.");
  if (!hasFeatured) out.push("No featured image.");
  if (stats.images.some((i) => !i.decorative && !i.alt.trim())) out.push("Some images have no alt text.");
  return out;
}
