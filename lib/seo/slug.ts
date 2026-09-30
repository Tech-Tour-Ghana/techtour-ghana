// Slug rules shared by the editor, the SEO checks and the redirect manager.

/** lowercase, ASCII, hyphen separated, no duplicate or edge hyphens. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const isValidSlug = (slug: string) => slug.length > 0 && slug.length <= 120 && SLUG_PATTERN.test(slug);
