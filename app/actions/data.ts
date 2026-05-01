"use server";

import { getCurrentUser } from "@/lib/cookies";
import {
  getAllCards,
  getAllReactions,
  getPartners,
} from "@/lib/db/queries";
import type {
  Card,
  Partners,
  PersonKey,
  Reaction,
} from "@/lib/db/schema";

export type CanvasData = {
  partners: Partners | null;
  currentUser: PersonKey | null;
  cards: Card[];
  reactions: Reaction[];
};

export async function getCanvasDataAction(): Promise<CanvasData> {
  const [partners, currentUser, cards, reactions] = await Promise.all([
    getPartners(),
    getCurrentUser(),
    getAllCards(),
    getAllReactions(),
  ]);
  return { partners, currentUser, cards, reactions };
}
