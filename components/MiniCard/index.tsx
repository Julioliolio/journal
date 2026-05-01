"use client";

import type { Card, Reaction } from "@/lib/db/schema";

import { NoteCard } from "./NoteCard";
import { NoteImageCard } from "./NoteImageCard";
import { ReflectionCard } from "./ReflectionCard";

export function MiniCard({
  card,
  reactions = [],
  isOwn,
  editable,
  isFresh = false,
}: {
  card: Card;
  reactions?: Reaction[];
  isOwn: boolean;
  editable: boolean;
  isFresh?: boolean;
}) {
  switch (card.type) {
    case "note":
      return (
        <NoteCard
          card={card}
          reactions={reactions}
          isOwn={isOwn}
          editable={editable}
          isFresh={isFresh}
        />
      );
    case "image":
    case "note_image":
      return (
        <NoteImageCard
          card={card}
          reactions={reactions}
          isOwn={isOwn}
          editable={editable}
          isFresh={isFresh}
        />
      );
    case "reflection":
      return (
        <ReflectionCard
          card={card}
          reactions={reactions}
          isOwn={isOwn}
          editable={editable}
          isFresh={isFresh}
        />
      );
  }
}
