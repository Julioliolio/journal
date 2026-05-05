"use server";

import { and, eq, inArray, max, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db/client";
import {
  cards,
  type Card,
  type CardType,
  type PersonKey,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/cookies";
import { newId } from "@/lib/ids";
import { notifyClients } from "@/lib/notify";
import { isISODate, isWithinUtcDayBound } from "@/lib/date";
import { deleteImageBlob, uploadImageBlob } from "@/lib/blob";

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

async function resolveImageUrl(formData: FormData): Promise<string> {
  const file = formData.get("imageFile");
  if (file instanceof File) return uploadImageBlob(file);
  return requireClip(formData.get("imageUrl"), SHORT_MAX, "Image URL");
}

async function resolveFeltImageUrl(formData: FormData): Promise<string | null> {
  const file = formData.get("feltImageFile");
  if (file instanceof File) return uploadImageBlob(file);
  return clip(formData.get("feltImageUrl"), URL_MAX);
}

const TEXT_MAX = 5000;
const SHORT_MAX = 1000;
const CAPTION_MAX = 280;
const URL_MAX = 1000;

async function requireUser(): Promise<PersonKey> {
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
  personKey: PersonKey,
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
  notifyClients();
  revalidatePath("/");
}

export async function createNoteAction(formData: FormData): Promise<void> {
  await insertCardOnToday(formData, "note", {
    text: requireClip(formData.get("text"), TEXT_MAX, "Note"),
  });
}

export async function createImageAction(
  formData: FormData,
): Promise<{ error: string } | void> {
  try {
    const url = await resolveImageUrl(formData);
    const caption = clip(formData.get("imageCaption"), CAPTION_MAX);
    await insertCardOnToday(formData, "image", {
      imageUrl: url,
      imageCaption: caption,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }
}

export async function createNoteImageAction(
  formData: FormData,
): Promise<{ error: string } | void> {
  try {
    const url = await resolveImageUrl(formData);
    const text = requireClip(formData.get("text"), TEXT_MAX, "Note");
    const caption = clip(formData.get("imageCaption"), CAPTION_MAX);
    await insertCardOnToday(formData, "note_image", {
      text,
      imageUrl: url,
      imageCaption: caption,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }
}

export async function createReflectionAction(
  formData: FormData,
): Promise<void> {
  const did = clip(formData.get("did"), TEXT_MAX);
  const learned = clip(formData.get("learned"), TEXT_MAX);
  const felt = clip(formData.get("felt"), TEXT_MAX);
  const feltImageUrl = await resolveFeltImageUrl(formData);
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
  personKey: PersonKey,
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
    case "reflection": {
      patch.reflectionDid = clip(formData.get("did"), TEXT_MAX);
      patch.reflectionLearned = clip(formData.get("learned"), TEXT_MAX);
      patch.reflectionFelt = clip(formData.get("felt"), TEXT_MAX);
      patch.reflectionFeltImageUrl = await resolveFeltImageUrl(formData);
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
  }

  await db.update(cards).set(patch).where(eq(cards.id, id));
  notifyClients();

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
  notifyClients();
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

  // First in array = top (newest visually) → highest position. Reverse so
  // index 0 in the input gets the largest position number. The single
  // UPDATE also acts as ownership/day check: rowcount must equal the
  // input length, otherwise the user passed an id that isn't theirs or
  // belongs to a different day.
  const total = input.orderedIds.length;
  const cases = sql.join(
    input.orderedIds.map(
      (id, i) => sql`when ${cards.id} = ${id} then ${total - i}`,
    ),
    sql` `,
  );
  const result = await db
    .update(cards)
    .set({
      position: sql`case ${cases} end`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(cards.personKey, personKey),
        eq(cards.date, input.date),
        inArray(cards.id, input.orderedIds),
      ),
    );
  if (result.rowsAffected !== total) {
    throw new Error("Some cards were not yours or not in this day.");
  }
  notifyClients();
  revalidatePath("/");
}
