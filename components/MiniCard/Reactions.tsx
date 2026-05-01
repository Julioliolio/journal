"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebHaptics } from "web-haptics/react";

import {
  addReactionAction,
  removeReactionAction,
  type AddReactionInput,
} from "@/app/actions/reactions";
import {
  GiphyPicker,
  type PickerSelection,
} from "@/components/Composer/GiphyPicker";
import type { Reaction } from "@/lib/db/schema";

const LONG_PRESS_MS = 380;
const LONG_PRESS_TRAVEL = 6;
const VISIBLE_LIMIT = 4;

export function Reactions({
  cardId,
  reactions,
  canAdd,
  canRemove,
}: {
  cardId: string;
  reactions: Reaction[];
  /** False for cards the viewer authored AND can still edit — they shouldn't
   *  react to their own in-progress posts. Guests and old self-cards: true. */
  canAdd: boolean;
  /** True for the journal authors — they can prune. Guests cannot. */
  canRemove: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const haptic = useWebHaptics();

  const overflow = reactions.length - VISIBLE_LIMIT;
  const visibleReactions =
    expanded || overflow <= 0 ? reactions : reactions.slice(0, VISIBLE_LIMIT);

  // Long-press on the parent card reveals the "+" button on touch devices,
  // matching the desktop hover behaviour without making the button always
  // visible. Pointerdown outside the card hides it again. Skip wiring it
  // up when there is no "+" button to reveal.
  useEffect(() => {
    if (!canAdd) return;
    const root = rootRef.current;
    if (!root) return;
    const card = root.closest<HTMLElement>(".card-shell");
    if (!card) return;

    let timer: number | null = null;
    let startX = 0;
    let startY = 0;

    function cancel() {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    }

    function onTouchStart(event: TouchEvent) {
      const t = event.touches[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
      cancel();
      timer = window.setTimeout(() => setRevealed(true), LONG_PRESS_MS);
    }
    function onTouchMove(event: TouchEvent) {
      const t = event.touches[0];
      if (!t) return;
      if (
        Math.abs(t.clientX - startX) > LONG_PRESS_TRAVEL ||
        Math.abs(t.clientY - startY) > LONG_PRESS_TRAVEL
      ) {
        cancel();
      }
    }

    card.addEventListener("touchstart", onTouchStart, { passive: true });
    card.addEventListener("touchmove", onTouchMove, { passive: true });
    card.addEventListener("touchend", cancel, { passive: true });
    card.addEventListener("touchcancel", cancel, { passive: true });
    return () => {
      cancel();
      card.removeEventListener("touchstart", onTouchStart);
      card.removeEventListener("touchmove", onTouchMove);
      card.removeEventListener("touchend", cancel);
      card.removeEventListener("touchcancel", cancel);
    };
  }, [canAdd]);

  // Dismiss the long-press reveal when the user taps elsewhere.
  useEffect(() => {
    if (!revealed) return;
    function onPointerDown(event: PointerEvent) {
      const card = rootRef.current?.closest<HTMLElement>(".card-shell");
      if (!card) return;
      if (!card.contains(event.target as Node)) setRevealed(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [revealed]);

  function add(picked: PickerSelection) {
    setPickerOpen(false);
    setRevealed(false);
    setError(null);
    const input: AddReactionInput =
      picked.kind === "emoji"
        ? { kind: "emoji", cardId, emoji: picked.emoji }
        : {
            kind: "gif",
            cardId,
            embedUrl: picked.embedUrl,
            width: picked.width,
            height: picked.height,
          };
    startTransition(async () => {
      try {
        await addReactionAction(input);
        qc.invalidateQueries({ queryKey: ["canvas"] });
        haptic.trigger("light");
      } catch (err) {
        haptic.trigger("error");
        setError(err instanceof Error ? err.message : "Couldn't react.");
      }
    });
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      try {
        await removeReactionAction(id);
        qc.invalidateQueries({ queryKey: ["canvas"] });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't remove.");
      }
    });
  }

  const hasAny = reactions.length > 0;

  return (
    <div
      ref={rootRef}
      className="reactions"
      data-empty={hasAny ? undefined : true}
      data-reveal={revealed || undefined}
      onClick={(e) => e.stopPropagation()}
    >
      {visibleReactions.map((r) =>
        r.kind === "emoji" ? (
          <span
            key={r.id}
            className="reaction-chip reaction-chip-emoji"
          >
            <span className="reaction-emoji" aria-hidden="true">
              {r.content}
            </span>
            {canRemove && (
              <button
                type="button"
                className="reaction-remove"
                onClick={() => remove(r.id)}
                disabled={pending}
                aria-label="remove reaction"
                title="remove reaction"
              >
                ×
              </button>
            )}
          </span>
        ) : (
          <span
            key={r.id}
            className="reaction-chip reaction-chip-gif"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.content}
              alt=""
              loading="lazy"
              width={r.width ?? undefined}
              height={r.height ?? undefined}
            />
            {canRemove && (
              <button
                type="button"
                className="reaction-remove"
                onClick={() => remove(r.id)}
                disabled={pending}
                aria-label="remove reaction"
                title="remove reaction"
              >
                ×
              </button>
            )}
          </span>
        ),
      )}
      {!expanded && overflow > 0 && (
        <button
          type="button"
          className="reaction-overflow"
          onClick={() => setExpanded(true)}
          aria-label={`show ${overflow} more reaction${overflow === 1 ? "" : "s"}`}
          title={`show ${overflow} more`}
        >
          +{overflow}
        </button>
      )}
      {canAdd && (
        <button
          type="button"
          className="reaction-add"
          onClick={(event) => {
            setPickerOpen(true);
            setRevealed(false);
            // For mouse clicks (event.detail > 0), drop focus so the
            // card's :focus-within doesn't keep the icon visible after
            // the picker closes. Keyboard activations (detail === 0)
            // keep focus so it can return here after Escape.
            if (event.detail > 0) event.currentTarget.blur();
          }}
          disabled={pending}
          aria-label="add a reaction"
          title="add a reaction"
        >
          <SmilePlusIcon />
        </button>
      )}
      {error && (
        <span className="reaction-error" role="status">
          {error}
        </span>
      )}
      {pickerOpen && (
        <GiphyPicker
          defaultTab="emoji"
          onPicked={add}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function SmilePlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 11v1a10 10 0 1 1-9-10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" x2="9.01" y1="9" y2="9" />
      <line x1="15" x2="15.01" y1="9" y2="9" />
      <path d="M16 5h6" />
      <path d="M19 2v6" />
    </svg>
  );
}
