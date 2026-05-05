"use client";

import type { ComponentType } from "react";

import type { Card, CardType, Reaction } from "@/lib/db/schema";

import { NoteCard } from "./NoteCard";
import { NoteImageCard } from "./NoteImageCard";
import { ReflectionCard } from "./ReflectionCard";

type CardProps = {
  card: Card;
  reactions: Reaction[];
  isOwn: boolean;
  editable: boolean;
  isFresh?: boolean;
};

const VARIANTS: Record<CardType, ComponentType<CardProps>> = {
  note: NoteCard,
  image: NoteImageCard,
  note_image: NoteImageCard,
  reflection: ReflectionCard,
};

export function MiniCard({
  reactions = [],
  isFresh = false,
  ...rest
}: Omit<CardProps, "reactions" | "isFresh"> & {
  reactions?: Reaction[];
  isFresh?: boolean;
}) {
  const Component = VARIANTS[rest.card.type];
  return <Component reactions={reactions} isFresh={isFresh} {...rest} />;
}
