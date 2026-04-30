"use server";

import { getCurrentUser } from "@/lib/cookies";
import { getAllCards, getPartners } from "@/lib/db/queries";
import type { Card, Partners, PersonKey } from "@/lib/db/schema";

export type CanvasData = {
  partners: Partners | null;
  currentUser: PersonKey | null;
  cards: Card[];
};

export async function getCanvasDataAction(): Promise<CanvasData> {
  const [partners, currentUser, cards] = await Promise.all([
    getPartners(),
    getCurrentUser(),
    getAllCards(),
  ]);
  return { partners, currentUser, cards };
}
