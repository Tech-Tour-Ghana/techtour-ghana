// Client-side file checks for the Media Library. The bucket also enforces its
// allowed MIME types server-side (migration 0024). SVG is deliberately not
// accepted: an SVG opened directly from storage can run scripts.

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_OTHER_BYTES = 50 * 1024 * 1024;

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "video/mp4", "application/pdf"] as const;
export type AcceptedType = (typeof ACCEPTED_TYPES)[number];

/** Value for <input accept>. */
export const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");

const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.slice(from, to));

/** Identify a file from its first bytes. The filename extension and the browser-reported type are not trusted. */
export function sniffType(head: Uint8Array): AcceptedType | null {
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "image/jpeg";
  if (head[0] === 0x89 && ascii(head, 1, 4) === "PNG") return "image/png";
  if (ascii(head, 0, 4) === "GIF8") return "image/gif";
  if (ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 12) === "WEBP") return "image/webp";
  if (ascii(head, 0, 4) === "%PDF") return "application/pdf";
  if (ascii(head, 4, 8) === "ftyp") {
    const brand = ascii(head, 8, 12);
    return brand === "avif" || brand === "avis" ? "image/avif" : "video/mp4";
  }
  return null;
}

export const formatBytes = (bytes: number | null | undefined) => {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

export type FileCheck = { ok: true; type: AcceptedType } | { ok: false; error: string };

export async function checkFile(file: File): Promise<FileCheck> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const type = sniffType(head);
  if (!type) return { ok: false, error: `${file.name} cannot be uploaded. This file type is not supported. Use JPEG, PNG, WebP, AVIF, GIF, MP4 or PDF.` };
  const limit = type.startsWith("image/") ? MAX_IMAGE_BYTES : MAX_OTHER_BYTES;
  if (file.size > limit) return { ok: false, error: `${file.name} is ${formatBytes(file.size)}. The limit for this file type is ${formatBytes(limit)}.` };
  if (file.size === 0) return { ok: false, error: `${file.name} is empty.` };
  return { ok: true, type };
}

/** Pixel size of an image, or null when it cannot be decoded in the browser. */
export function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

export const safeFileName = (fullName: string) => {
  const name = fullName.split(/[\\/]/).pop() ?? "";
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name).normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "file";
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) : "";
  return ext ? `${base}.${ext}` : base;
};
