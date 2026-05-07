"use client";

import { useMemo } from "react";

import type { Reaction } from "@/lib/db/schema";

export function useReactionsByCardId(
  reactions: Reaction[],
): Map<string, Reaction[]> {
  return useMemo(() => {
    const map = new Map<string, Reaction[]>();
    for (const r of reactions) {
      const arr = map.get(r.cardId);
      if (arr) arr.push(r);
      else map.set(r.cardId, [r]);
    }
    return map;
  }, [reactions]);
}
