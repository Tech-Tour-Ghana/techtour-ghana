// The one place article HTML is made safe. TinyMCE output is never trusted:
// every public render and every admin preview goes through this allow list, so
// scripts, event handlers, javascript: URLs, iframes and embedded data: images
// cannot survive no matter how the HTML got into the database.

import sanitizeHtml from "sanitize-html";

const ALIGN = /^(left|right|center|justify)$/;

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h2", "h3", "h4", "h5", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "sub", "sup",
    "ul", "ol", "li", "blockquote", "a", "img", "figure", "figcaption", "pre", "code", "span",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading", "decoding", "role", "class", "style"],
    figure: ["class", "style"],
    table: ["class", "style"],
    th: ["colspan", "rowspan", "scope", "style"],
    td: ["colspan", "rowspan", "style"],
    col: ["span", "style"],
    "*": ["style", "class"],
  },
  allowedClasses: {
    "*": ["align-left", "align-right", "align-center", "image", "img-md", "img-sm"],
  },
  allowedStyles: {
    "*": {
      "text-align": [ALIGN],
      float: [/^(left|right|none)$/],
      display: [/^block$/],
      "margin-left": [/^auto$/],
      "margin-right": [/^auto$/],
      width: [/^\d{1,4}(px|%)$/],
      height: [/^\d{1,4}(px|%)$/],
    },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags: {
    // The page title is the only H1.
    h1: "h2",
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const external = /^https?:\/\//i.test(href);
      const next: Record<string, string> = { ...attribs };
      if (external) next.rel = "noopener noreferrer";
      else delete next.rel;
      if (next.target && next.target !== "_blank") delete next.target;
      return { tagName, attribs: next };
    },
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy", decoding: "async" } }),
  },
  exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
};

const looksLikeHtml = (s: string) => /<\/?[a-z][\s\S]*>/i.test(s);

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Safe HTML for an article body. Plain-text bodies (the old format) become paragraphs. */
export function sanitizeArticleHtml(content: string): string {
  if (!looksLikeHtml(content)) {
    return content
      .split(/\n\s*\n/)
      .filter((p) => p.trim())
      .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, "<br>")}</p>`)
      .join("");
  }
  return sanitizeHtml(content, OPTIONS);
}
