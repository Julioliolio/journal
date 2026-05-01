"use server";

import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db/client";
import { cards, type Card, type CardType } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/cookies";
import { newId } from "@/lib/ids";
import { isISODate, isWithinUtcDayBound } from "@/lib/date";
import { deleteImageBlob } from "@/lib/blob";

/**
 * Best-effort cleanup of orphaned blobs after a card is deleted or its
 * image fields change. Runs after the DB write succeeds so a blob-storage
 * outage can't block the user-visible operation. deleteImageBlob already
 * swallows individual errors (missing file, missing token, …).
 */
async function deleteBlobs(urls: ReadonlyArray<string | null | undefined>) {
  await Promise.all(
    urls
      .filter((u): u is string => Boolean(u))
      .map((u) => deleteImageBlob(u)),
  );
}

const TEXT_MAX = 5000;
const SHORT_MAX = 1000;
const CAPTION_MAX = 280;
const URL_MAX = 1000;

async function requireUser(): Promise<"name1" | "name2"> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");
  return user;
}

function readDate(formData: FormData): string {
  const date = String(formData.get("date") ?? "").trim();
  if (!isISODate(date)) throw new Error("Invalid date (expected YYYY-MM-DD).");
  if (!isWithinUtcDayBound(date)) throw new Error("Date is out of range.");
  return date;
}

function readClientToday(formData: FormData): string {
  const today = String(formData.get("clientToday") ?? "").trim();
  if (!isISODate(today)) throw new Error("Missing clientToday.");
  if (!isWithinUtcDayBound(today)) throw new Error("clientToday is out of range.");
  return today;
}

function clip(input: unknown, max: number): string | null {
  const s = typeof input === "string" ? input.trim() : "";
  if (!s) return null;
  if (s.length > max) throw new Error(`Field too long (max ${max}).`);
  return s;
}

function requireClip(input: unknown, max: number, fieldName: string): string {
  const s = clip(input, max);
  if (!s) throw new Error(`${fieldName} is required.`);
  return s;
}

async function nextPosition(
  personKey: "name1" | "name2",
  date: string,
): Promise<number> {
  const rows = await db
    .select({ value: max(cards.position) })
    .from(cards)
    .where(and(eq(cards.personKey, personKey), eq(cards.date, date)));
  const current = rows[0]?.value ?? 0;
  return current + 1;
}

async function insertCardOnToday(
  formData: FormData,
  type: CardType,
  values: Partial<Pick<Card,
    | "text"
    | "imageUrl"
    | "imageCaption"
    | "reflectionDid"
    | "reflectionLearned"
    | "reflectionFelt"
    | "reflectionFeltImageUrl"
  >>,
): Promise<void> {
  const personKey = await requireUser();
  const today = readClientToday(formData);
  const date = readDate(formData);
  if (date !== today) {
    throw new Error("New cards can only be added to today.");
  }
  const position = await nextPosition(personKey, date);
  await db.insert(cards).values({
    id: newId(),
    personKey,
    date,
    type,
    position,
    ...values,
  });
  revalidatePath("/");
}

export async function createNoteAction(formData: FormData): Promise<void> {
  await insertCardOnToday(formData, "note", {
    text: requireClip(formData.get("text"), TEXT_MAX, "Note"),
  });
}

export async function createImageAction(formData: FormData): Promise<void> {
  const url = requireClip(formData.get("imageUrl"), SHORT_MAX, "Image URL");
  const caption = clip(formData.get("imageCaption"), CAPTION_MAX);
  await insertCardOnToday(formData, "image", {
    imageUrl: url,
    imageCaption: caption,
  });
}

export async function createNoteImageAction(
  formData: FormData,
): Promise<void> {
  const url = requireClip(formData.get("imageUrl"), SHORT_MAX, "Image URL");
  const text = requireClip(formData.get("text"), TEXT_MAX, "Note");
  const caption = clip(formData.get("imageCaption"), CAPTION_MAX);
  await insertCardOnToday(formData, "note_image", {
    text,
    imageUrl: url,
    imageCaption: caption,
  });
}

export async function createReflectionAction(
  formData: FormData,
): Promise<void> {
  const did = clip(formData.get("did"), TEXT_MAX);
  const learned = clip(formData.get("learned"), TEXT_MAX);
  const felt = clip(formData.get("felt"), TEXT_MAX);
  const feltImageUrl = clip(formData.get("feltImageUrl"), URL_MAX);
  if (!did && !learned && !felt && !feltImageUrl) {
    throw new Error("At least one reflection field is required.");
  }
  try {
    await insertCardOnToday(formData, "reflection", {
      reflectionDid: did,
      reflectionLearned: learned,
      reflectionFelt: felt,
      reflectionFeltImageUrl: feltImageUrl,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      /UNIQUE constraint failed/.test(error.message)
    ) {
      throw new Error("You already added a reflection today.");
    }
    throw error;
  }
}

async function loadOwnedCard(
  id: string,
  personKey: "name1" | "name2",
  clientToday: string,
) {
  const row = await db
    .select()
    .from(cards)
    .where(eq(cards.id, id))
    .limit(1);
  const card = row[0];
  if (!card) throw new Error("Card not found.");
  if (card.personKey !== personKey) throw new Error("Not your card.");
  if (card.date !== clientToday) {
    throw new Error("Only today's cards can be edited.");
  }
  return card;
}

export async function updateCardAction(formData: FormData): Promise<void> {
  const personKey = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing card id.");
  const clientToday = readClientToday(formData);

  const card = await loadOwnedCard(id, personKey, clientToday);

  const patch: Partial<Card> = { updatedAt: new Date() };
  switch (card.type) {
    case "note":
      patch.text = requireClip(formData.get("text"), TEXT_MAX, "Note");
      break;
    case "image":
    case "note_image":
      patch.text = clip(formData.get("text"), TEXT_MAX);
      patch.imageCaption = clip(formData.get("imageCaption"), CAPTION_MAX);
      break;
    case "reflection":
      patch.reflectionDid = clip(formData.get("did"), TEXT_MAX);
      patch.reflectionLearned = clip(formData.get("learned"), TEXT_MAX);
      patch.reflectionFelt = clip(formData.get("felt"), TEXT_MAX);
      patch.reflectionFeltImageUrl = clip(
        formData.get("feltImageUrl"),
        URL_MAX,
      );
      if (
        !patch.reflectionDid &&
        !patch.reflectionLearned &&
        !patch.reflectionFelt &&
        !patch.reflectionFeltImageUrl
      ) {
        throw new Error("At least one reflection field is required.");
      }
      break;
  }

  await db.update(cards).set(patch).where(eq(cards.id, id));

  // If the felt image was replaced or removed during a reflection edit,
  // drop the previous blob so we don't accumulate orphans.
  if (
    card.type === "reflection" &&
    card.reflectionFeltImageUrl &&
    card.reflectionFeltImageUrl !== patch.reflectionFeltImageUrl
  ) {
    await deleteBlobs([card.reflectionFeltImageUrl]);
  }

  revalidatePath("/");
}

export async function deleteCardAction(formData: FormData): Promise<void> {
  const personKey = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Missing card id.");
  const clientToday = readClientToday(formData);
  const card = await loadOwnedCard(id, personKey, clientToday);
  await db.delete(cards).where(eq(cards.id, id));
  await deleteBlobs([card.imageUrl, card.reflectionFeltImageUrl]);
  revalidatePath("/");
}

export async function reorderCardsAction(input: {
  date: string;
  orderedIds: string[];
  clientToday: string;
}): Promise<void> {
  const personKey = await requireUser();
  if (!isISODate(input.date)) throw new Error("Invalid date.");
  if (!isISODate(input.clientToday) || !isWithinUtcDayBound(input.clientToday)) {
    throw new Error("Invalid clientToday.");
  }
  if (input.date !== input.clientToday) {
    throw new Error("Only today's cards can be reordered.");
  }
  if (!Array.isArray(input.orderedIds) || input.orderedIds.length === 0) {
    throw new Error("orderedIds is required.");
  }

  const all = await db
    .select()
    .from(cards)
    .where(and(eq(cards.personKey, personKey), eq(cards.date, input.date)));
  const byId = new Map(all.map((c) => [c.id, c]));
  for (const id of input.orderedIds) {
    if (!byId.has(id)) throw new Error(`Unknown card ${id} in this day.`);
  }

  // First in array = top (newest visually) → highest position. Reverse so
  // index 0 in the input gets the largest position number.
  const total = input.orderedIds.length;
  await db.transaction(async (tx) => {
    for (let i = 0; i < input.orderedIds.length; i++) {
      const position = total - i;
      await tx
        .update(cards)
        .set({ position, updatedAt: new Date() })
        .where(eq(cards.id, input.orderedIds[i]!));
    }
  });
  revalidatePath("/");
}
