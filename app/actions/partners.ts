"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertAuthorToken } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { partners, PERSON_KEYS } from "@/lib/db/schema";
import { setCurrentUser } from "@/lib/cookies";
import type { PersonKey } from "@/lib/db/schema";

const NAME_MAX = 40;

function readName(formData: FormData): string {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required.");
  if (name.length > NAME_MAX) {
    throw new Error(`Name must be ${NAME_MAX} characters or fewer.`);
  }
  return name;
}

/**
 * First-run: creator signs up with their own name. Stored as name1 and
 * the current_user cookie is set so they don't have to pick. Name2 is
 * filled in later when the partner joins via the shared link.
 */
export async function setupPartnersAction(formData: FormData): Promise<void> {
  assertAuthorToken(formData.get("authToken"));
  const name = readName(formData);

  const existing = await db.select().from(partners).limit(1);
  if (existing[0]) {
    throw new Error("Already set up.");
  }

  await db.insert(partners).values({ id: 1, name1: name, name2: null });
  await setCurrentUser("name1");
  revalidatePath("/");
  redirect("/");
}

/**
 * Someone accepting the shared link: claim the next empty name slot
 * (name2 → name3 → name4) and set the cookie so future visits go straight
 * to the canvas.
 */
export async function joinAsPartnerAction(formData: FormData): Promise<void> {
  assertAuthorToken(formData.get("authToken"));
  const name = readName(formData);

  const existing = await db.select().from(partners).limit(1);
  const row = existing[0];
  if (!row) {
    throw new Error("Setup hasn't started yet.");
  }

  const slot = (["name2", "name3", "name4"] as const).find((k) => !row[k]);
  if (!slot) {
    throw new Error("All four seats are already filled.");
  }

  await db
    .update(partners)
    .set({ [slot]: name })
    .where(eq(partners.id, row.id));
  await setCurrentUser(slot);
  revalidatePath("/");
  redirect("/");
}

export async function pickCurrentUserAction(formData: FormData): Promise<void> {
  assertAuthorToken(formData.get("authToken"));
  const key = formData.get("personKey");
  if (typeof key !== "string" || !(PERSON_KEYS as readonly string[]).includes(key)) {
    throw new Error("Invalid person key.");
  }
  await setCurrentUser(key as PersonKey);
  revalidatePath("/");
  redirect("/");
}

