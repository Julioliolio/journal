import "server-only";
import { asc, desc, eq } from "drizzle-orm";

import { db } from "./client";
import {
  cards,
  partners,
  reactions,
  type Card,
  type Partners,
  type Reaction,
} from "./schema";

export async function getPartners(): Promise<Partners | null> {
  const rows = await db.select().from(partners).limit(1);
  return rows[0] ?? null;
}

export async function getAllCards(): Promise<Card[]> {
  // Order by date asc (oldest day first → today last by string compare),
  // and position desc within a day so newest mini-card is on top.
  return db
    .select()
    .from(cards)
    .orderBy(asc(cards.date), desc(cards.position));
}

export async function getCardById(id: string): Promise<Card | null> {
  const rows = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getAllReactions(): Promise<Reaction[]> {
  // Oldest first within a card so additions read left-to-right.
  return db.select().from(reactions).orderBy(asc(reactions.createdAt));
}
