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

export const MEDIA_ACCEPT_ATTR =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif," +
  "video/mp4,video/webm,video/quicktime";

function detectMime(file: File): string {
  if (file.type) return file.type;
  // Some HEIC/MOV files come through with an empty MIME — fall back to extension.
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "heic":
    case "heif":
      return `image/${ext}`;
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mov":
      return "video/quicktime";
    default:
      return "";
  }
}

function rewrapWithMime(file: File, mime: string): File {
  return file.type === mime ? file : new File([file], file.name, { type: mime });
}

/**
 * Take any user-supplied image file, convert HEIC/HEIF to JPEG if needed,
 * compress to ≤1MB / ≤1920px on the longest edge, and return a fresh File.
 * GIFs and WebPs are passed through untouched so animation is preserved
 * (animated webp is now common — Tenor/Giphy "gifs" are usually webp);
 * only the size cap is enforced.
 */
export async function processImage(file: File): Promise<File> {
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
    return rewrapWithMime(file, mime);
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
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.8,
    fileType: working.type === "image/png" ? "image/png" : "image/jpeg",
  });
  return compressed;
}

/**
 * Process either an image or a short video. Images go through the full
 * `processImage` pipeline; videos are passed through with only a size
 * cap (the browser can't usefully transcode them client-side).
 */
export async function processMedia(file: File): Promise<File> {
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
    return rewrapWithMime(file, mime);
  }

  return processImage(file);
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url);
}
