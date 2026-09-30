// Reads the structure of an article's HTML for the SEO checks and the content
// quality panel. TinyMCE emits normalised markup, so a small tag scanner is
// enough here and it runs unchanged in the browser, on the server and in tests.
// It never renders or executes anything.

export interface HtmlImage { src: string; alt: string; hasAlt: boolean; decorative: boolean }
export interface HtmlLink { href: string; text: string; internal: boolean }
export interface HtmlHeading { level: number; text: string }

export interface HtmlStats {
  text: string;
  wordCount: number;
  readingMinutes: number;
  headings: HtmlHeading[];
  paragraphs: string[];
  images: HtmlImage[];
  links: HtmlLink[];
  hasInlineDataImage: boolean;
}

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'" };

export const decodeEntities = (s: string) => s.replace(/&(nbsp|amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m] ?? m);

/** Visible text of a fragment: tags removed, entities decoded, whitespace collapsed. */
export const stripTags = (html: string) => decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

const attr = (tag: string, name: string): string | null => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
  return m ? decodeEntities(m[2] ?? m[3] ?? "") : null;
};

const isInternal = (href: string, siteHost?: string) => {
  if (href.startsWith("/") && !href.startsWith("//")) return true;
  if (!siteHost) return false;
  try { return new URL(href).host === siteHost; } catch { return false; }
};

export function analyzeHtml(html: string, siteHost?: string): HtmlStats {
  const body = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "");

  const headings: HtmlHeading[] = [];
  for (const m of body.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    headings.push({ level: Number(m[1]), text: stripTags(m[2] ?? "") });
  }

  const paragraphs: string[] = [];
  for (const m of body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const t = stripTags(m[1] ?? "");
    if (t) paragraphs.push(t);
  }

  const images: HtmlImage[] = [];
  let hasInlineDataImage = false;
  for (const m of body.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const src = attr(tag, "src") ?? "";
    const alt = attr(tag, "alt");
    if (/^data:/i.test(src)) hasInlineDataImage = true;
    images.push({
      src,
      alt: alt ?? "",
      hasAlt: alt !== null,
      decorative: /role\s*=\s*["']presentation["']/i.test(tag),
    });
  }

  const links: HtmlLink[] = [];
  for (const m of body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = attr(`<a ${m[1] ?? ""}>`, "href");
    if (!href || href.startsWith("#") || /^(mailto|tel):/i.test(href)) continue;
    links.push({ href, text: stripTags(m[2] ?? ""), internal: isInternal(href, siteHost) });
  }

  const text = stripTags(body);
  const wordCount = text ? text.split(/\s+/).length : 0;
  return {
    text,
    wordCount,
    readingMinutes: Math.max(1, Math.round(wordCount / 200)),
    headings,
    paragraphs,
    images,
    links,
    hasInlineDataImage,
  };
}
