"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useWebHaptics } from "web-haptics/react";

import {
  addReactionAction,
  removeReactionAction,
  type AddReactionInput,
} from "@/app/actions/reactions";
import type { CanvasData } from "@/app/actions/data";
import { GiphyPicker } from "@/components/Composer/GiphyPicker";
import type { PickerSelection } from "@/lib/giphy-types";
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
  canAdd: boolean;
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

  // Long-press on the parent card reveals the "+" on touch devices —
  // matches the desktop hover behaviour without making the button always
  // visible. CSS :hover sticks after a tap, so we drive this with state.
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
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: Reaction =
      picked.kind === "emoji"
        ? {
            id: tempId,
            cardId,
            kind: "emoji",
            content: picked.emoji,
            width: null,
            height: null,
            createdAt: new Date(),
          }
        : {
            id: tempId,
            cardId,
            kind: "gif",
            content: picked.embedUrl,
            width: picked.width,
            height: picked.height,
            createdAt: new Date(),
          };
    spliceReaction(qc, optimistic);
    haptic.trigger("light");

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
        const real = await addReactionAction(input);
        replaceReaction(qc, tempId, real);
      } catch (err) {
        removeReactionFromCache(qc, tempId);
        setError(err instanceof Error ? err.message : "Couldn't react.");
      }
    });
  }

  function remove(id: string) {
    setError(null);
    const previous = reactions.find((r) => r.id === id);
    removeReactionFromCache(qc, id);
    startTransition(async () => {
      try {
        await removeReactionAction(id);
      } catch (err) {
        if (previous) spliceReaction(qc, previous);
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
      {visibleReactions.map((r) => (
        <ReactionChip
          key={r.id}
          reaction={r}
          canRemove={canRemove}
          pending={pending}
          onRemove={remove}
        />
      ))}
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
            // Mouse clicks: drop focus so :focus-within doesn't keep the
            // icon visible after the picker closes. Keyboard activations
            // (detail === 0) keep focus so it can return after Escape.
            if (event.detail > 0) event.currentTarget.blur();
          }}
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

function ReactionChip({
  reaction: r,
  canRemove,
  pending,
  onRemove,
}: {
  reaction: Reaction;
  canRemove: boolean;
  pending: boolean;
  onRemove: (id: string) => void;
}) {
  const isOptimistic = r.id.startsWith("temp-");
  const [enlarged, setEnlarged] = useState(false);

  function open() {
    if (isOptimistic) return;
    setEnlarged(true);
  }

  return (
    <>
      <span
        className={`reaction-chip reaction-chip-${r.kind}`}
        data-pending={isOptimistic || undefined}
        role="button"
        tabIndex={isOptimistic ? -1 : 0}
        aria-label={
          r.kind === "emoji" ? `enlarge ${r.content}` : "enlarge reaction"
        }
        onClick={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
      >
        {r.kind === "emoji" ? (
          <span className="reaction-emoji" aria-hidden="true">
            {r.content}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.content}
            alt=""
            loading="lazy"
            width={r.width ?? undefined}
            height={r.height ?? undefined}
          />
        )}
        {canRemove && !isOptimistic && (
          <button
            type="button"
            className="reaction-remove"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(r.id);
            }}
            disabled={pending}
            aria-label="remove reaction"
            title="remove reaction"
          >
            ×
          </button>
        )}
      </span>
      {enlarged && (
        <ReactionPreview
          reaction={r}
          onClose={() => setEnlarged(false)}
        />
      )}
    </>
  );
}

function ReactionPreview({
  reaction: r,
  onClose,
}: {
  reaction: Reaction;
  onClose: () => void;
}) {
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

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="reaction-preview-modal"
      role="dialog"
      aria-modal="true"
      aria-label="enlarged reaction"
      onClick={onClose}
    >
      {r.kind === "emoji" ? (
        <span className="reaction-preview-emoji" aria-hidden="true">
          {r.content}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="reaction-preview-img"
          src={r.content}
          alt=""
          width={r.width ?? undefined}
          height={r.height ?? undefined}
        />
      )}
    </div>,
    document.body,
  );
}

type QC = ReturnType<typeof useQueryClient>;

function spliceReaction(qc: QC, next: Reaction) {
  qc.setQueryData<CanvasData>(["canvas"], (prev) =>
    prev ? { ...prev, reactions: [...prev.reactions, next] } : prev,
  );
}

function replaceReaction(qc: QC, tempId: string, real: Reaction) {
  // Race-safe: a background refetch could land between optimistic insert
  // and server response. Drop both ids before appending so we end up with
  // exactly one row regardless of who got there first.
  qc.setQueryData<CanvasData>(["canvas"], (prev) => {
    if (!prev) return prev;
    const others = prev.reactions.filter(
      (r) => r.id !== tempId && r.id !== real.id,
    );
    return { ...prev, reactions: [...others, real] };
  });
}

function removeReactionFromCache(qc: QC, id: string) {
  qc.setQueryData<CanvasData>(["canvas"], (prev) =>
    prev
      ? { ...prev, reactions: prev.reactions.filter((r) => r.id !== id) }
      : prev,
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
