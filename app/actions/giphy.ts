"use server";

import {
  isGiphyConfigured,
  searchGiphy,
  type GiphyItem,
  type GiphyMediaType,
} from "@/lib/giphy";

export async function isGiphyEnabledAction(): Promise<boolean> {
  return isGiphyConfigured();
}

export async function searchGiphyAction(
  query: string,
  offset: number,
  mediaType: GiphyMediaType = "gifs",
): Promise<GiphyItem[]> {
  // Public: guests use this to pick reactions. Bounded by GIPHY's own
  // rate limits and our pg-13 rating filter; nothing user-specific here.
  return searchGiphy(query, offset, mediaType);
}
