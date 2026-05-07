"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { getCanvasDataAction, type CanvasData } from "@/app/actions/data";
import type { Card, Partners, PersonKey, Reaction } from "@/lib/db/schema";
import { CANVAS_KEY } from "@/lib/queries";

type DemoData = {
  cards: Card[];
  reactions: Reaction[];
};

type Params = {
  sessionKey: string;
  partners: Partners;
  /** Pinned to keep the "you" badge stable regardless of the cookie. */
  currentUser: PersonKey;
  buildMock: (today: string) => DemoData;
  today: string;
};

/**
 * Demo canvases use the production query key so existing Composer/Edit/
 * Reactions components write into the same cache. The result blends
 * pre-baked mock data with anything the visitor saved this session
 * (cards or reactions created after sessionStart).
 */
export function useDemoCanvasData({
  sessionKey,
  partners,
  currentUser,
  buildMock,
  today,
}: Params) {
  const sessionStartRef = useRef<number>(0);
  useEffect(() => {
    if (sessionStartRef.current !== 0) return;
    const stored = window.sessionStorage.getItem(sessionKey);
    if (stored) {
      sessionStartRef.current = Number(stored);
    } else {
      sessionStartRef.current = Date.now();
      window.sessionStorage.setItem(
        sessionKey,
        String(sessionStartRef.current),
      );
    }
  }, [sessionKey]);

  return useQuery<CanvasData & { __demo: true }>({
    queryKey: CANVAS_KEY,
    queryFn: async () => {
      const mock = buildMock(today);
      let real: CanvasData | null = null;
      try {
        real = await getCanvasDataAction();
      } catch {
        // Action may fail if the user isn't logged in; demo still works.
      }
      const cutoff = sessionStartRef.current;
      const newCards =
        real?.cards.filter((c) => c.createdAt.getTime() >= cutoff) ?? [];
      const newReactions =
        real?.reactions.filter((r) => r.createdAt.getTime() >= cutoff) ?? [];
      return {
        __demo: true as const,
        partners,
        currentUser: real?.currentUser ?? currentUser,
        cards: [...mock.cards, ...newCards],
        reactions: [...mock.reactions, ...newReactions],
      };
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}
