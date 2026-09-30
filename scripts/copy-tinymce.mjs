// Self-hosts TinyMCE: copies the runtime from node_modules into public/tinymce so
// the editor never loads from Tiny Cloud or any CDN. Runs before dev and build.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "tinymce");
const dest = join(root, "public", "tinymce");

if (!existsSync(src)) {
  console.error("tinymce is not installed, run npm install first");
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
for (const entry of ["tinymce.min.js", "license.md", "notices.txt", "icons", "models", "skins", "themes"]) {
  cpSync(join(src, entry), join(dest, entry), { recursive: true });
}
// Only the plugins the editor actually loads (see components/admin/blog/RichTextEditor.tsx).
for (const plugin of ["advlist", "autolink", "charmap", "code", "fullscreen", "image", "link", "lists", "searchreplace", "table", "wordcount"]) {
  cpSync(join(src, "plugins", plugin), join(dest, "plugins", plugin), { recursive: true });
}
console.log("tinymce copied to public/tinymce");
