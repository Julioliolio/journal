"use client";

import { useEditableCard } from "@/lib/hooks/useEditableCard";
import type { Card, Reaction } from "@/lib/db/schema";

import { MiniCard } from "./index";
import { SortableMiniCard } from "./SortableMiniCard";

/** Cards created within this window get the deliberate settle animation
 * instead of the generic card-enter fade. Short enough that a page
 * reload right after creation doesn't replay it on every visible card. */
const FRESH_WINDOW_MS = 2500;

/**
 * Computes the 24h editable state per-card so the lock flips automatically
 * once the window closes.
 */
export function MiniCardWithLock({
  card,
  reactions,
  isOwn,
  sortable,
}: {
  card: Card;
  reactions: Reaction[];
  isOwn: boolean;
  sortable: boolean;
}) {
  const editable = useEditableCard(card.date);
  const isFresh = Date.now() - card.createdAt.getTime() < FRESH_WINDOW_MS;

  if (sortable && isOwn && editable) {
    return (
      <SortableMiniCard
        card={card}
        reactions={reactions}
        isOwn={isOwn}
        editable={editable}
        isFresh={isFresh}
      />
    );
  }
  return (
    <MiniCard
      card={card}
      reactions={reactions}
      isOwn={isOwn}
      editable={editable}
      isFresh={isFresh}
    />
  );
}
