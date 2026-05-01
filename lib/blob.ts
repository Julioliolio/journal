import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { del, put } from "@vercel/blob";

const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

// 25MB hard cap to fit short videos. Client compresses static images
// to <1MB; gif/webp bypass compression to preserve animation; videos
// are uploaded raw.
const MAX_BYTES = 25 * 1024 * 1024;

const LOCAL_PREFIX = "/uploads/";

/**
 * Production: uploads go to Vercel Blob (requires BLOB_READ_WRITE_TOKEN).
 * Local dev without a token: writes to public/uploads/ and returns a
 * relative path. The dev server serves files from public/ as-is.
 */
function useLocalStorage(): boolean {
  return !process.env.BLOB_READ_WRITE_TOKEN;
}

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

function extFor(file: File): string {
  return EXT_BY_MIME[file.type] ?? "jpg";
}

export async function uploadImageBlob(file: File): Promise<string> {
  if (!ACCEPTED_MIME.has(file.type)) {
    throw new Error(`Unsupported media type: ${file.type || "unknown"}`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error(
      `File too large (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB).`,
    );
  }

  const id = crypto.randomUUID();
  const filename = `${id}.${extFor(file)}`;

  if (useLocalStorage()) {
    const dir = join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, filename), buffer);
    return `${LOCAL_PREFIX}${filename}`;
  }

  const blob = await put(`cards/${filename}`, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type,
  });
  return blob.url;
}

export async function deleteImageBlob(url: string): Promise<void> {
  if (url.startsWith(LOCAL_PREFIX)) {
    const file = join(process.cwd(), "public", url);
    await unlink(file).catch(() => {
      // Ignore missing files — caller doesn't need to know.
    });
    return;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // URL points at Blob but we no longer have credentials; nothing safe to do.
    return;
  }
  await del(url).catch(() => {});
}
