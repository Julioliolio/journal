"use client";

import type { Card } from "@/lib/db/schema";

import { NoteCard } from "./NoteCard";
import { NoteImageCard } from "./NoteImageCard";
import { ReflectionCard } from "./ReflectionCard";

export function MiniCard({
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
  switch (card.type) {
    case "note":
      return <NoteCard card={card} isOwn={isOwn} editable={editable} isFresh={isFresh} />;
    case "image":
    case "note_image":
      return <NoteImageCard card={card} isOwn={isOwn} editable={editable} isFresh={isFresh} />;
    case "reflection":
      return <ReflectionCard card={card} isOwn={isOwn} editable={editable} isFresh={isFresh} />;
  }
}
