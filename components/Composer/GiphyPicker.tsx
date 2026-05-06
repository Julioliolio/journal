"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { searchGiphyAction } from "@/app/actions/giphy";
import { useEscapeKey } from "@/lib/hooks/useEscapeKey";
import { EMOJI_GROUPS, type EmojiEntry } from "@/lib/emoji-data";
import type { GiphyItem, PickerSelection } from "@/lib/giphy-types";

export type { PickerSelection };

type PickerTab = "emoji" | "stickers" | "gifs";

const PAGE_SIZE = 24;
const EMOJI_SEARCH_LIMIT = 240;

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const isEmoji = tab === "emoji";

  // Reset the giphy/sticker state synchronously when entering emoji mode
  // so we don't briefly flash stale items the next time the user comes
  // back to a media tab.
  const [trackedIsEmoji, setTrackedIsEmoji] = useState(isEmoji);
  if (trackedIsEmoji !== isEmoji) {
    setTrackedIsEmoji(isEmoji);
    if (isEmoji) {
      setLoading(false);
      setError(null);
      setItems([]);
      setHasMore(false);
    }
  }

  useEffect(() => {
    if (isEmoji) return;
    const id = ++requestRef.current;
    const handle = setTimeout(async () => {
      if (requestRef.current !== id) return;
      setLoading(true);
      setLoadingMore(false);
      setError(null);
      setItems([]);
      setHasMore(true);
      try {
        const results = await searchGiphyAction(query, 0, tab);
        if (requestRef.current !== id) return;
        setItems(results);
        setHasMore(results.length >= PAGE_SIZE);
        setLoading(false);
      } catch (err) {
        if (requestRef.current !== id) return;
        // Server-action errors are masked in production with a long
        // "omitted in production builds" boilerplate. Replace it with
        // something a guest can actually act on.
        const raw = err instanceof Error ? err.message : "";
        const friendly =
          !raw || raw.includes("omitted in production builds")
            ? `Couldn't load ${tab} from GIPHY. Try again in a moment.`
            : raw;
        setError(friendly);
        setLoading(false);
      }
    }, query.trim() ? 280 : 0);
    return () => clearTimeout(handle);
  }, [query, tab, isEmoji]);

  useEffect(() => {
    if (isEmoji) return;
    const grid = gridRef.current;
    if (!grid) return;
    const onScroll = async () => {
      if (loading || loadingMore || error || !hasMore) return;
      if (grid.scrollTop + grid.clientHeight < grid.scrollHeight - 240) return;
      const id = requestRef.current;
      const offset = items.length;
      setLoadingMore(true);
      try {
        const more = await searchGiphyAction(query, offset, tab);
        if (requestRef.current !== id) return;
        setItems((prev) => [...prev, ...more]);
        setHasMore(more.length >= PAGE_SIZE);
      } catch {
        if (requestRef.current !== id) return;
        setHasMore(false);
      } finally {
        if (requestRef.current === id) setLoadingMore(false);
      }
    };
    grid.addEventListener("scroll", onScroll, { passive: true });
    return () => grid.removeEventListener("scroll", onScroll);
  }, [isEmoji, items.length, query, tab, loading, loadingMore, hasMore, error]);

  useEscapeKey(onClose);

  // Flat list across all groups, used by search.
  const allEmojis = useMemo(() => EMOJI_GROUPS.flatMap((g) => g.e), []);

  const emojiQuery = isEmoji ? query.trim().toLowerCase() : "";
  const emojiMatches = useMemo<EmojiEntry[]>(() => {
    if (!isEmoji || !emojiQuery) return [];
    const q = emojiQuery;
    const out: EmojiEntry[] = [];
    // Direct glyph match (e.g. user pasted an emoji into search): exact hit.
    for (const em of allEmojis) {
      if (em.e === query.trim()) out.push(em);
    }
    // Then name/keyword matches, prefix-prioritized.
    const prefix: EmojiEntry[] = [];
    const contains: EmojiEntry[] = [];
    for (const em of allEmojis) {
      if (em.e === query.trim()) continue;
      if (em.n.startsWith(q)) prefix.push(em);
      else if (em.n.includes(q) || em.k.includes(q)) contains.push(em);
      if (prefix.length + contains.length >= EMOJI_SEARCH_LIMIT) break;
    }
    return out.concat(prefix, contains).slice(0, EMOJI_SEARCH_LIMIT);
  }, [isEmoji, emojiQuery, query, allEmojis]);

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
          <input
            autoFocus
            type="text"
            className="giphy-search"
            placeholder={
              isEmoji
                ? "search emoji…"
                : tab === "stickers"
                  ? "search stickers…"
                  : "search gifs…"
            }
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
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
          <div className="emoji-scroll">
            {emojiQuery ? (
              <div className="emoji-grid">
                {emojiMatches.map((em) => (
                  <button
                    key={em.e + em.n}
                    type="button"
                    className="emoji-tile"
                    title={em.n}
                    onClick={() => onPicked({ kind: "emoji", emoji: em.e })}
                    aria-label={em.n}
                  >
                    {em.e}
                  </button>
                ))}
                {emojiMatches.length === 0 && (
                  <p className="giphy-empty">
                    no emoji for “{query.trim()}”.
                  </p>
                )}
              </div>
            ) : (
              EMOJI_GROUPS.map((group) => (
                <section key={group.n} className="emoji-group">
                  <h3 className="emoji-group-heading">{group.n}</h3>
                  <div className="emoji-grid">
                    {group.e.map((em) => (
                      <button
                        key={em.e + em.n}
                        type="button"
                        className="emoji-tile"
                        title={em.n}
                        onClick={() => onPicked({ kind: "emoji", emoji: em.e })}
                        aria-label={em.n}
                      >
                        {em.e}
                      </button>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        ) : (
          <div
            ref={gridRef}
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
            {loadingMore && (
              <p className="giphy-empty giphy-loading-more">loading more…</p>
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
