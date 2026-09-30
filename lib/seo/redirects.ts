// Validation for the redirect manager. Mirrors the database checks (0024) and
// adds the loop detection the database cannot do.

export interface RedirectRule { id?: string; source_path: string; destination: string; is_active: boolean }

export const normalizePath = (p: string) => {
  const path = p.trim().split(/[?#]/)[0] ?? "";
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
};

export function validateRedirect(
  input: { source_path: string; destination: string },
  existing: RedirectRule[],
  editingId?: string,
): string | null {
  const source = input.source_path.trim();
  const dest = input.destination.trim();
  if (!source.startsWith("/") || source.startsWith("//")) return "The old address must be a path on this site, starting with /.";
  if (/\s/.test(source) || /[?#]/.test(source)) return "The old address cannot contain spaces, ? or #.";
  if (source.startsWith("/admin")) return "Admin addresses cannot be redirected.";
  if (!dest) return "Enter where the old address should go.";
  const external = /^https?:\/\//i.test(dest);
  if (!external && (!dest.startsWith("/") || dest.startsWith("//"))) return "The new address must start with / or be a full https:// address.";
  if (/\s/.test(dest)) return "The new address cannot contain spaces.";
  if (normalizePath(source) === normalizePath(dest)) return "The old and new address are the same.";

  const rules = existing.filter((r) => r.is_active && r.id !== editingId);
  if (rules.some((r) => normalizePath(r.source_path) === normalizePath(source))) return "A redirect from this address already exists.";

  // Follow the chain from the new destination. Reaching the new source means a loop.
  const next = new Map(rules.map((r) => [normalizePath(r.source_path), r.destination]));
  let at = external ? null : normalizePath(dest);
  const seen = new Set<string>();
  while (at && !seen.has(at)) {
    if (at === normalizePath(source)) return "This would create a redirect loop.";
    seen.add(at);
    const hop = next.get(at);
    at = hop && !/^https?:\/\//i.test(hop) ? normalizePath(hop) : null;
  }
  return seen.size > 8 ? "This creates a long redirect chain. Point it at the final address instead." : null;
}
