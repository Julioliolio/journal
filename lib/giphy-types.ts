export type GiphyMediaType = "gifs" | "stickers";

export type GiphyItem = {
  id: string;
  title: string;
  previewUrl: string;
  embedUrl: string;
  width: number;
  height: number;
};

export type PickerSelection =
  | { kind: "emoji"; emoji: string }
  | { kind: "gif"; embedUrl: string; width: number; height: number };
