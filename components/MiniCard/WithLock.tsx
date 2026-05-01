"use client";

import type { Card, Reaction } from "@/lib/db/schema";

import { MiniCard } from "./index";
import { SortableMiniCard } from "./SortableMiniCard";

/** Cards created within this window get the deliberate settle animation
 * instead of the generic card-enter fade. Short enough that a page
 * reload right after creation doesn't replay it on every visible card. */
const FRESH_WINDOW_MS = 2500;

/** Editable iff the card belongs to today. */
export function MiniCardWithLock({
  card,
  reactions,
  isOwn,
  sortable,
  today,
}: {
  card: Card;
  reactions: Reaction[];
  isOwn: boolean;
  sortable: boolean;
  today: string;
}) {
  const editable = card.date === today;
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
