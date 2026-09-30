import assert from "node:assert/strict";
import test from "node:test";

import { checkFile, safeFileName, sniffType } from "../lib/media/files.ts";

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

test("sniffType identifies files by content, not name", () => {
  assert.equal(sniffType(bytes(0xff, 0xd8, 0xff, 0xe0)), "image/jpeg");
  assert.equal(sniffType(bytes(0x89, ...ascii("PNG"))), "image/png");
  assert.equal(sniffType(bytes(...ascii("GIF89a"))), "image/gif");
  assert.equal(sniffType(bytes(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP"))), "image/webp");
  assert.equal(sniffType(bytes(0, 0, 0, 0x18, ...ascii("ftypavif"))), "image/avif");
  assert.equal(sniffType(bytes(0, 0, 0, 0x18, ...ascii("ftypisom"))), "video/mp4");
  assert.equal(sniffType(bytes(...ascii("%PDF-1.7"))), "application/pdf");
  assert.equal(sniffType(bytes(...ascii("<svg xmlns"))), null);
  assert.equal(sniffType(bytes(...ascii("8BPS"))), null); // Photoshop
});

test("checkFile rejects unsupported, disguised and oversized files with readable errors", async () => {
  const psd = new File([new Uint8Array(bytes(...ascii("8BPS")))], "hero-image.psd", { type: "image/vnd.adobe.photoshop" });
  const r = await checkFile(psd);
  assert.equal(r.ok, false);
  assert.match(r.ok ? "" : r.error, /hero-image\.psd cannot be uploaded\. This file type is not supported/);

  const svgAsPng = new File([new TextEncoder().encode("<svg onload=alert(1)>")], "logo.png", { type: "image/png" });
  assert.equal((await checkFile(svgAsPng)).ok, false);

  const png = new File([new Uint8Array(bytes(0x89, ...ascii("PNG")))], "ok.png", { type: "image/png" });
  assert.deepEqual(await checkFile(png), { ok: true, type: "image/png" });

  const big = new File([new Uint8Array(11 * 1024 * 1024).fill(0)], "big.jpg");
  const head = new Uint8Array(big.size); head.set([0xff, 0xd8, 0xff]);
  const bigJpeg = new File([head], "big.jpg", { type: "image/jpeg" });
  const tooBig = await checkFile(bigJpeg);
  assert.equal(tooBig.ok, false);
  assert.match(tooBig.ok ? "" : tooBig.error, /limit/);
});

test("safeFileName keeps a readable name and a clean extension", () => {
  assert.equal(safeFileName("My Photo (1).JPG"), "My-Photo-1.jpg");
  assert.equal(safeFileName("../../etc/passwd"), "passwd");
});
