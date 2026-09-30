// A `next` return path is only honoured if it is a same-site relative path.
// "//evil.com" and "/\evil.com" parse as off-site URLs, so they are refused.
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
