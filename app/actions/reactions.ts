"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db/client";
import { getCardById } from "@/lib/db/queries";
import { reactions, type Reaction } from "@/lib/db/schema";
import { isGiphyEmbedUrl } from "@/lib/giphy";
import { getCurrentUser } from "@/lib/cookies";
import { newId } from "@/lib/ids";

const MAX_REACTIONS_PER_CARD = 200;
const URL_MAX = 1000;
const EMOJI_MAX_LEN = 16;

export type AddReactionInput =
  | { kind: "emoji"; cardId: string; emoji: string }
  | {
      kind: "gif";
      cardId: string;
      embedUrl: string;
      width: number;
      height: number;
    };

export async function addReactionAction(
  input: AddReactionInput,
): Promise<Reaction> {
  const cardId = String(input.cardId ?? "").trim();
  if (!cardId) throw new Error("Missing card.");

  const card = await getCardById(cardId);
  if (!card) throw new Error("Card not found.");

  // Soft cap to prevent runaway spam from unauthenticated guests.
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reactions)
    .where(eq(reactions.cardId, cardId));
  if (count >= MAX_REACTIONS_PER_CARD) {
    throw new Error("This card has reached the reaction limit.");
  }

  const id = newId();
  const createdAt = new Date();

  let row: Reaction;
  if (input.kind === "emoji") {
    const emoji = String(input.emoji ?? "").trim();
    if (!emoji || emoji.length > EMOJI_MAX_LEN) throw new Error("Invalid emoji.");
    row = {
      id,
      cardId,
      kind: "emoji",
      content: emoji,
      width: null,
      height: null,
      createdAt,
    };
  } else {
    const embedUrl = String(input.embedUrl ?? "").trim();
    if (!embedUrl || embedUrl.length > URL_MAX) {
      throw new Error("Invalid URL.");
    }
    if (!isGiphyEmbedUrl(embedUrl)) {
      throw new Error("URL must be from GIPHY.");
    }
    const width = Math.max(
      1,
      Math.min(2000, Math.floor(Number(input.width) || 200)),
    );
    const height = Math.max(
      1,
      Math.min(2000, Math.floor(Number(input.height) || 200)),
    );
    row = {
      id,
      cardId,
      kind: "gif",
      content: embedUrl,
      width,
      height,
      createdAt,
    };
  }

  await db.insert(reactions).values(row);
  revalidatePath("/");
  return row;
}

export async function removeReactionAction(reactionId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Only the journal owners can remove reactions.");
  const id = String(reactionId ?? "").trim();
  if (!id) throw new Error("Missing reaction id.");
  await db.delete(reactions).where(eq(reactions.id, id));
  revalidatePath("/");
}
