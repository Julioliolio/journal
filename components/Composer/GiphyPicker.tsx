"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { searchGiphyAction } from "@/app/actions/giphy";

type GiphyItem = {
  id: string;
  title: string;
  previewUrl: string;
  embedUrl: string;
  width: number;
  height: number;
};

type PickerTab = "emoji" | "stickers" | "gifs";

export type PickerSelection =
  | { kind: "emoji"; emoji: string }
  | { kind: "gif"; embedUrl: string; width: number; height: number };

const EMOJI_PALETTE = [
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🤍", "🖤",
  "😀", "😄", "😅", "😂", "🤣", "😊", "🥹", "🥲",
  "😍", "🥰", "😘", "😎", "🤩", "🥳", "😭", "🤗",
  "🙌", "👏", "👍", "👎", "🙏", "💪", "🤝", "🫶",
  "🔥", "✨", "💯", "⭐", "🎉", "🎊", "🌈", "☀️",
  "🌸", "🌻", "🌿", "🍀", "🍂", "🍎", "🍑", "🍓",
  "🍕", "🍔", "🍰", "🍪", "🍫", "☕", "🍵", "🍷",
  "🐶", "🐱", "🦊", "🐻", "🐼", "🦄", "🐝", "🐢",
  "🚀", "💌", "🎁", "📚", "🎵", "🎨", "🏔️", "🌊",
  "👀", "💀", "🤔", "😅", "😬", "😮", "🤯", "😱",
  "👻", "👋", "🫡", "🫠", "🫥", "🤌", "🤞", "✌️",
  "💔", "❣️", "💕", "💞", "💖", "💘", "💝", "💟",
];

export function GiphyPicker({
  onPicked,
  onClose,
  defaultTab = "emoji",
}: {
  onPicked: (selection: PickerSelection) => void;
  onClose: () => void;
  /** Initial tab. Reactions default to emoji; image composer flows pass "gifs". */
  defaultTab?: PickerTab;
}) {
  const [tab, setTab] = useState<PickerTab>(defaultTab);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<GiphyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const isEmoji = tab === "emoji";

  useEffect(() => {
    if (isEmoji) {
      setLoading(false);
      setError(null);
      setItems([]);
      return;
    }
    const id = ++requestRef.current;
    let cancelled = false;
    const handle = setTimeout(async () => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      try {
        const results = await searchGiphyAction(query, 0, tab);
        if (cancelled || requestRef.current !== id) return;
        setItems(results);
        setLoading(false);
      } catch (err) {
        if (cancelled || requestRef.current !== id) return;
        setError(err instanceof Error ? err.message : "Search failed.");
        setLoading(false);
      }
    }, query.trim() ? 280 : 0);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, tab, isEmoji]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const filteredEmojis = (() => {
    if (!isEmoji) return EMOJI_PALETTE;
    const q = query.trim();
    if (!q) return EMOJI_PALETTE;
    return EMOJI_PALETTE.filter((e) => e.includes(q));
  })();

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="giphy-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Pick a reaction"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="giphy-panel">
        <header className="giphy-header">
          <div className="giphy-tabs" role="tablist" aria-label="Reaction type">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "emoji"}
              className="giphy-tab"
              onClick={() => setTab("emoji")}
            >
              emoji
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "stickers"}
              className="giphy-tab"
              onClick={() => setTab("stickers")}
            >
              stickers
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "gifs"}
              className="giphy-tab"
              onClick={() => setTab("gifs")}
            >
              gifs
            </button>
          </div>
          {!isEmoji && (
            <input
              autoFocus
              type="text"
              className="giphy-search"
              placeholder={
                tab === "stickers" ? "search stickers…" : "search gifs…"
              }
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          )}
          <button
            type="button"
            className="pill pill-ghost"
            onClick={onClose}
          >
            close
          </button>
        </header>
        {error && <p className="compose-error giphy-error">{error}</p>}
        {isEmoji ? (
          <div className="emoji-grid">
            {filteredEmojis.map((e) => (
              <button
                key={e}
                type="button"
                className="emoji-tile"
                onClick={() => onPicked({ kind: "emoji", emoji: e })}
                aria-label={`react with ${e}`}
              >
                {e}
              </button>
            ))}
            {filteredEmojis.length === 0 && (
              <p className="giphy-empty">no match.</p>
            )}
          </div>
        ) : (
          <div
            className="giphy-grid"
            data-media={tab}
            aria-busy={loading || undefined}
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="giphy-tile"
                onClick={() =>
                  onPicked({
                    kind: "gif",
                    embedUrl: item.embedUrl,
                    width: item.width,
                    height: item.height,
                  })
                }
                aria-label={item.title}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt=""
                  loading="lazy"
                  width={item.width}
                  height={item.height}
                />
              </button>
            ))}
            {!loading && !error && items.length === 0 && (
              <p className="giphy-empty">
                {query.trim()
                  ? `nothing for “${query.trim()}”.`
                  : "no results."}
              </p>
            )}
            {loading && items.length === 0 && (
              <p className="giphy-empty">searching…</p>
            )}
          </div>
        )}
        <footer className="giphy-footer">
          {isEmoji ? "react with anything" : "powered by GIPHY"}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
