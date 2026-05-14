// Client-only — uses browser APIs (Image, FileReader, canvas).
// Don't import this from server components.

const ACCEPTED_IMAGE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
]);

const ACCEPTED_VIDEO = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const MAX_ANIMATED_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

export class UnsupportedImageTypeError extends Error {}

export const IMAGE_ACCEPT_ATTR = [...ACCEPTED_IMAGE].join(",");
export const MEDIA_ACCEPT_ATTR = [...ACCEPTED_IMAGE, ...ACCEPTED_VIDEO].join(",");

// Some HEIC/MOV files come through with an empty MIME — fall back to extension.
const MIME_BY_EXT: Record<string, string> = {
  heic: "image/heic",
  heif: "image/heif",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

function detectMime(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "";
}

function rewrapWithMime(file: File, mime: string): File {
  return file.type === mime ? file : new File([file], file.name, { type: mime });
}

/**
 * Take any user-supplied image file, convert HEIC/HEIF to JPEG if needed,
 * compress to ≤1MB / ≤1600px on the longest edge, and return a fresh
 * File. GIFs and WebPs are passed through untouched so animation is
 * preserved (animated webp is now common — Tenor/Giphy "gifs" are
 * usually webp); only the size cap is enforced.
 *
 * `onProgress` reports compression progress on a 0–100 scale.
 */
export async function processImage(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<File> {
  const mime = detectMime(file);

  if (!ACCEPTED_IMAGE.has(mime)) {
    throw new UnsupportedImageTypeError(
      `Unsupported image type: ${mime || "unknown"}`,
    );
  }

  // Skip compression for formats that may carry animation. Re-encoding
  // through canvas would flatten them to a single frame.
  if (mime === "image/gif" || mime === "image/webp") {
    if (file.size > MAX_ANIMATED_BYTES) {
      throw new Error(
        `File too large (max ${Math.round(
          MAX_ANIMATED_BYTES / 1024 / 1024,
        )}MB for ${mime === "image/gif" ? "GIF" : "WebP"}).`,
      );
    }
    onProgress?.(100);
    return rewrapWithMime(file, mime);
  }

  // Already small + non-HEIC: send as-is. Avoids a multi-second canvas
  // re-encode for a file that's already within budget — by far the
  // biggest win for "make this faster".
  const SKIP_COMPRESS_BYTES = 600 * 1024;
  if (
    file.size <= SKIP_COMPRESS_BYTES &&
    mime !== "image/heic" &&
    mime !== "image/heif"
  ) {
    onProgress?.(100);
    return file;
  }

  let working: File = file;
  if (mime === "image/heic" || mime === "image/heif") {
    const { default: heic2any } = await import("heic2any");
    const out = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.8,
    });
    const blob = Array.isArray(out) ? out[0]! : out;
    working = new File(
      [blob],
      file.name.replace(/\.(heic|heif)$/i, ".jpg"),
      { type: "image/jpeg" },
    );
  }

  const { default: imageCompression } = await import(
    "browser-image-compression"
  );
  const compressed = await imageCompression(working, {
    // 1600 is enough for retina display at the card's native size and
    // takes ~half as long to encode as 1920.
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    initialQuality: 0.78,
    // Cap the binary-search passes — without this the library can re-encode
    // 5+ times to hit maxSizeMB exactly. Two passes get within ~10% and is
    // dramatically faster.
    maxIteration: 2,
    fileType: working.type === "image/png" ? "image/png" : "image/jpeg",
    onProgress: (p: number) => onProgress?.(p),
  });
  return compressed;
}

/**
 * Process either an image or a short video. Images go through the full
 * `processImage` pipeline; videos are passed through with only a size
 * cap (the browser can't usefully transcode them client-side).
 */
export async function processMedia(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<File> {
  const mime = detectMime(file);

  if (mime.startsWith("video/")) {
    if (!ACCEPTED_VIDEO.has(mime)) {
      throw new UnsupportedImageTypeError(
        `Unsupported video type: ${mime || "unknown"}`,
      );
    }
    if (file.size > MAX_VIDEO_BYTES) {
      throw new Error(
        `Video too large (max ${Math.round(
          MAX_VIDEO_BYTES / 1024 / 1024,
        )}MB).`,
      );
    }
    onProgress?.(100);
    return rewrapWithMime(file, mime);
  }

  return processImage(file, onProgress);
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url);
}
