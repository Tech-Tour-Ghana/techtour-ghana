// Adds ids to the h2/h3 headings of already-sanitised article HTML and returns
// the list for a table of contents. Runs after sanitising, so the ids are ours.

export interface TocItem { id: string; text: string; level: 2 | 3 }

const stripTags = (s: string) => s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';

export function withHeadingIds(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Set<string>();
  const out = html.replace(/<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi, (_m, level: string, _attrs, inner: string) => {
    const text = stripTags(inner);
    if (!text) return _m;
    let id = slugify(text);
    for (let n = 2; used.has(id); n++) id = `${slugify(text)}-${n}`;
    used.add(id);
    toc.push({ id, text, level: Number(level) as 2 | 3 });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  return { html: out, toc };
}

/** Whole minutes to read, at 200 words a minute, never less than 1. */
export const readMinutes = (html: string) => Math.max(1, Math.round(stripTags(html).split(' ').filter(Boolean).length / 200));
