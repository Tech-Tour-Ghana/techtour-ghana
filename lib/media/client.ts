// Browser-side media operations: upload with progress, listing with server-side
// paging, metadata edits and delete. Everything runs as the signed-in admin, so
// RLS (0024) is what stops anyone else.

import { checkFile, readImageSize, safeFileName } from "@/lib/media/files";
import { env } from "@/lib/env";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

export type MediaAsset = Database["public"]["Tables"]["media_assets"]["Row"];
export type MediaFolder = Database["public"]["Tables"]["media_folders"]["Row"];

export const PAGE_SIZE = 24;

export type MediaFilter = "all" | "images" | "other" | "recent" | "missing-alt";
export type MediaSort = "newest" | "oldest" | "name" | "largest" | "smallest";

export interface MediaQuery {
  search: string;
  filter: MediaFilter;
  sort: MediaSort;
  folderId: string | null;
  page: number;
}

export async function listMedia(q: MediaQuery): Promise<{ rows: MediaAsset[]; total: number }> {
  const supabase = createBrowserClient();
  let query = supabase.from("media_assets").select("*", { count: "exact" });
  if (q.folderId) query = query.eq("folder_id", q.folderId);
  const term = q.search.trim().replace(/[%,()]/g, " ");
  if (term) query = query.or(`name.ilike.%${term}%,title.ilike.%${term}%,alt_text.ilike.%${term}%`);
  if (q.filter === "images") query = query.like("mime_type", "image/%");
  if (q.filter === "other") query = query.not("mime_type", "like", "image/%");
  if (q.filter === "recent") query = query.gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString());
  if (q.filter === "missing-alt") query = query.like("mime_type", "image/%").eq("alt_text", "").eq("is_decorative", false);

  const order: Record<MediaSort, [string, boolean]> = {
    newest: ["created_at", false],
    oldest: ["created_at", true],
    name: ["name", true],
    largest: ["size_bytes", false],
    smallest: ["size_bytes", true],
  };
  const [col, asc] = order[q.sort];
  const from = q.page * PAGE_SIZE;
  const { data, count, error } = await query.order(col, { ascending: asc, nullsFirst: false }).range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error("Could not load the media library.");
  return { rows: data ?? [], total: count ?? 0 };
}

export async function listFolders(): Promise<MediaFolder[]> {
  const { data, error } = await createBrowserClient().from("media_folders").select("*").order("name");
  if (error) throw new Error("Could not load folders.");
  return data ?? [];
}

function putWithProgress(path: string, file: File, contentType: string, token: string, onProgress: (pct: number) => void, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const encoded = path.split("/").map(encodeURIComponent).join("/");
    xhr.open("POST", `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/media/${encoded}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.status === 403 ? "You do not have permission to upload." : "The upload was rejected.")));
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.onabort = () => reject(new DOMException("Cancelled", "AbortError"));
    signal.addEventListener("abort", () => xhr.abort());
    xhr.send(file);
  });
}

/** Validate, upload to the media bucket and register the asset. Rejects with a readable message. */
export async function uploadMedia(
  file: File,
  folder: Pick<MediaFolder, "id" | "slug">,
  onProgress: (pct: number) => void,
  signal: AbortSignal,
): Promise<MediaAsset> {
  const check = await checkFile(file);
  if (!check.ok) throw new Error(check.error);

  const supabase = createBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Your session has expired. Sign in again.");

  const path = `${folder.slug}/${Date.now()}-${safeFileName(file.name)}`;
  await putWithProgress(path, file, check.type, session.access_token, onProgress, signal);

  const size = await readImageSize(file);
  const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      folder_id: folder.id,
      name: file.name,
      storage_path: path,
      public_url: publicUrl,
      size_bytes: file.size,
      mime_type: check.type,
      width: size?.width ?? null,
      height: size?.height ?? null,
      uploaded_by: session.user.id,
    })
    .select("*")
    .single();
  if (error || !data) {
    await supabase.storage.from("media").remove([path]);
    throw new Error("The file uploaded but could not be saved to the library.");
  }
  return data;
}

export type MediaMetadata = Pick<MediaAsset, "alt_text" | "title" | "caption" | "description" | "is_decorative">;

export async function updateMedia(id: string, patch: MediaMetadata): Promise<MediaAsset> {
  const { data, error } = await createBrowserClient().from("media_assets").update(patch).eq("id", id).select("*").single();
  if (error || !data) throw new Error("Could not save the changes.");
  return data;
}

/** How many articles use this file, so the delete confirmation can warn. */
export async function countUsage(asset: MediaAsset): Promise<number> {
  const supabase = createBrowserClient();
  const [featured, inline] = await Promise.all([
    supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("image_url", asset.public_url),
    supabase.from("blog_posts").select("id", { count: "exact", head: true }).ilike("content", `%${asset.storage_path}%`),
  ]);
  return (featured.count ?? 0) + (inline.count ?? 0);
}

/** Deleted files are moved here, not erased, so Trash can preview and restore them. */
export const TRASH_PREFIX = "_trash/";

export async function deleteMedia(asset: MediaAsset): Promise<void> {
  const supabase = createBrowserClient();
  const bucket = supabase.storage.from("media");
  const { error: moveError } = await bucket.move(asset.storage_path, TRASH_PREFIX + asset.storage_path);
  if (moveError) throw new Error("Could not move the file to the trash.");
  const { error } = await supabase.from("media_assets").delete().eq("id", asset.id);
  if (error) {
    await bucket.move(TRASH_PREFIX + asset.storage_path, asset.storage_path);
    throw new Error("The file could not be deleted.");
  }
}

/** Upload straight into the default "General" folder, for editors that have no folder chooser. */
export async function uploadToGeneral(file: File, onProgress: (pct: number) => void, signal: AbortSignal): Promise<MediaAsset> {
  const { data } = await createBrowserClient().from("media_folders").select("id, slug").eq("slug", "general").maybeSingle();
  if (!data) throw new Error("The General media folder is missing. Create it in the Media Library.");
  return uploadMedia(file, data, onProgress, signal);
}
