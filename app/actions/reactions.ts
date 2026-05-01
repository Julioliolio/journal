"use server";

import { eq } from "drizzle-orm";
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

  // Soft cap to prevent runaway spam. We don't authenticate guests, so
  // this is the only ceiling on a single card's reaction list.
  const existing = await db
    .select({ id: reactions.id })
    .from(reactions)
    .where(eq(reactions.cardId, cardId))
    .limit(MAX_REACTIONS_PER_CARD + 1);
  if (existing.length >= MAX_REACTIONS_PER_CARD) {
    throw new Error("This card has reached the reaction limit.");
  }

  const id = newId();

  if (input.kind === "emoji") {
    const emoji = String(input.emoji ?? "").trim();
    // Strip ZWJ trailing nonsense; keep small. We don't need to police the
    // whole Unicode emoji set — just keep payloads tiny.
    if (!emoji || emoji.length > EMOJI_MAX_LEN) {
      throw new Error("Invalid emoji.");
    }
    await db.insert(reactions).values({
      id,
      cardId,
      kind: "emoji",
      content: emoji,
    });
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
    await db.insert(reactions).values({
      id,
      cardId,
      kind: "gif",
      content: embedUrl,
      width,
      height,
    });
  }

  revalidatePath("/");
  const row = (
    await db.select().from(reactions).where(eq(reactions.id, id)).limit(1)
  )[0];
  if (!row) throw new Error("Failed to read reaction back.");
  return row;
}

export async function removeReactionAction(reactionId: string): Promise<void> {
  // Authors only — guests can add but not curate.
  const user = await getCurrentUser();
  if (!user) throw new Error("Only the journal owners can remove reactions.");
  const id = String(reactionId ?? "").trim();
  if (!id) throw new Error("Missing reaction id.");
  await db.delete(reactions).where(eq(reactions.id, id));
  revalidatePath("/");
}
