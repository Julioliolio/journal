"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertAuthorToken } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { partners } from "@/lib/db/schema";
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
 * Partner accepting the shared link: claim the empty name2 slot and set
 * the cookie so future visits go straight to the canvas.
 */
export async function joinAsPartnerAction(formData: FormData): Promise<void> {
  assertAuthorToken(formData.get("authToken"));
  const name = readName(formData);

  const existing = await db.select().from(partners).limit(1);
  const row = existing[0];
  if (!row) {
    throw new Error("Setup hasn't started yet.");
  }
  if (row.name2) {
    throw new Error("Both partners are already set up.");
  }

  await db.update(partners).set({ name2: name }).where(eq(partners.id, row.id));
  await setCurrentUser("name2");
  revalidatePath("/");
  redirect("/");
}

export async function pickCurrentUserAction(formData: FormData): Promise<void> {
  assertAuthorToken(formData.get("authToken"));
  const key = formData.get("personKey");
  if (key !== "name1" && key !== "name2") {
    throw new Error("Invalid person key.");
  }
  await setCurrentUser(key satisfies PersonKey);
  revalidatePath("/");
  redirect("/");
}

