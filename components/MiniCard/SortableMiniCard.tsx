"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Card } from "@/lib/db/schema";

import { MiniCard } from "./index";

/**
 * Wraps a MiniCard with drag affordances. Only used on the user's own side.
 * The drag handle is hover-revealed three dots, no border, top-right of the
 * card — designed to disappear into the surface until the user reaches for it.
 */
export function SortableMiniCard({
  card,
  isOwn,
  editable,
  isFresh = false,
}: {
  card: Card;
  isOwn: boolean;
  editable: boolean;
  isFresh?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    transition: {
      duration: 240,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="sortable-wrap"
      data-dragging={isDragging || undefined}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <MiniCard card={card} isOwn={isOwn} editable={editable} isFresh={isFresh} />
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label="drag to reorder"
        className="drag-handle"
      >
        <span className="drag-dots" aria-hidden="true">
          <span /> <span />
          <span /> <span />
          <span /> <span />
        </span>
      </button>
    </div>
  );
}
