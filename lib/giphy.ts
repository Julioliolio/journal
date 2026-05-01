import "server-only";

export type GiphyMediaType = "gifs" | "stickers";

export type GiphyItem = {
  id: string;
  title: string;
  /** Small animated GIF used in the picker grid (low-bandwidth). */
  previewUrl: string;
  /** Hotlinked rendition we store on the card. */
  embedUrl: string;
  width: number;
  height: number;
};

const GIPHY_BASE = "https://api.giphy.com/v1";
const SEARCH_LIMIT = 24;

interface RawGiphyImage {
  url: string;
  width: string;
  height: string;
}

interface RawGiphyEntry {
  id: string;
  title: string;
  images: {
    original: RawGiphyImage;
    downsized?: RawGiphyImage;
    fixed_width: RawGiphyImage;
    fixed_width_downsampled?: RawGiphyImage;
  };
}

interface RawGiphyResponse {
  data: RawGiphyEntry[];
  meta?: { status: number; msg: string };
}

export function isGiphyConfigured(): boolean {
  return Boolean(process.env.GIPHY_API_KEY);
}

function getApiKey(): string {
  const key = process.env.GIPHY_API_KEY;
  if (!key) {
    throw new Error(
      "GIPHY isn't configured. Set GIPHY_API_KEY in .env.local.",
    );
  }
  return key;
}

function translateError(status: number): Error {
  if (status === 401 || status === 403) {
    return new Error("GIPHY API key is invalid.");
  }
  if (status === 429) {
    return new Error("GIPHY is rate-limiting. Try again in a minute.");
  }
  return new Error(`GIPHY request failed (${status}).`);
}

export async function searchGiphy(
  query: string,
  offset: number,
  mediaType: GiphyMediaType = "gifs",
): Promise<GiphyItem[]> {
  const key = getApiKey();
  const params = new URLSearchParams({
    api_key: key,
    limit: String(SEARCH_LIMIT),
    offset: String(Math.max(0, Math.floor(offset))),
    rating: "pg-13",
    bundle: "messaging_non_clips",
  });
  const trimmed = query.trim();
  const root = `${GIPHY_BASE}/${mediaType}`;
  const endpoint = trimmed
    ? `${root}/search?${params.toString()}&q=${encodeURIComponent(trimmed)}`
    : `${root}/trending?${params.toString()}`;

  const response = await fetch(endpoint, { cache: "no-store" });
  if (!response.ok) throw translateError(response.status);
  const json = (await response.json()) as RawGiphyResponse;

  return json.data.map((item) => {
    const fw = item.images.fixed_width;
    const preview = item.images.fixed_width_downsampled ?? fw;
    // Prefer the downsized rendition (≤2MB) for the embedded card; it
    // looks great at card size while staying friendly on mobile data.
    const embed = item.images.downsized ?? item.images.original ?? fw;
    return {
      id: item.id,
      title: item.title || (mediaType === "stickers" ? "Sticker" : "GIF"),
      previewUrl: preview.url,
      embedUrl: embed.url,
      width: Number(embed.width) || 200,
      height: Number(embed.height) || 200,
    };
  });
}

const GIPHY_HOSTS = new Set([
  "media.giphy.com",
  "media0.giphy.com",
  "media1.giphy.com",
  "media2.giphy.com",
  "media3.giphy.com",
  "media4.giphy.com",
  "i.giphy.com",
]);

/** Defensive check for an unauthenticated server action: only allow
 *  storing URLs that point at the GIPHY CDN, never arbitrary user input. */
export function isGiphyEmbedUrl(candidate: string): boolean {
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:") return false;
    return GIPHY_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}
