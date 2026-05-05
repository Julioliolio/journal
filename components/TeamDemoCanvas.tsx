"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { getCanvasDataAction, type CanvasData } from "@/app/actions/data";
import { todayISO } from "@/lib/date";
import { DEMO_PARTNERS_TEAM, buildDemoDataTeam } from "@/lib/demo-data";
import {
  PERSON_KEYS,
  type PersonKey,
  type Reaction,
} from "@/lib/db/schema";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { CANVAS_KEY, invalidateCanvas } from "@/lib/queries";

import { DesktopCanvas, MobileCanvas, type Person } from "./Canvas";
import { ThemeToggle } from "./ThemeToggle";

const SESSION_START_KEY = "demo-team-session-start";

export function TeamDemoCanvas() {
  const [today, setToday] = useState(() => todayISO());
  const qc = useQueryClient();

  const sessionStartRef = useRef<number>(0);
  useEffect(() => {
    if (sessionStartRef.current !== 0) return;
    const stored = window.sessionStorage.getItem(SESSION_START_KEY);
    if (stored) {
      sessionStartRef.current = Number(stored);
    } else {
      sessionStartRef.current = Date.now();
      window.sessionStorage.setItem(
        SESSION_START_KEY,
        String(sessionStartRef.current),
      );
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setToday((prev) => {
        const next = todayISO();
        return next === prev ? prev : next;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.onmessage = () => invalidateCanvas(qc);
    return () => es.close();
  }, [qc]);

  const { data } = useQuery<CanvasData & { __demo: true }>({
    queryKey: CANVAS_KEY,
    queryFn: async () => {
      const mock = buildDemoDataTeam(today);
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
        partners: DEMO_PARTNERS_TEAM,
        // Always Julio so the "you" badge stays put regardless of cookie.
        currentUser: "name1",
        cards: [...mock.cards, ...newCards],
        reactions: [...mock.reactions, ...newReactions],
      };
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const reactionsByCardId = useMemo(() => {
    const map = new Map<string, Reaction[]>();
    for (const r of data?.reactions ?? []) {
      const arr = map.get(r.cardId);
      if (arr) arr.push(r);
      else map.set(r.cardId, [r]);
    }
    return map;
  }, [data?.reactions]);

  const people: Person[] = useMemo(() => {
    const cards = data?.cards ?? [];
    return PERSON_KEYS.map((key) => ({
      key,
      label: DEMO_PARTNERS_TEAM[key],
      cards: cards.filter((c) => c.personKey === key),
    })).filter(
      (p): p is Person =>
        typeof p.label === "string" && p.label.length > 0,
    );
  }, [data?.cards]);

  const isMobile = useIsMobile();
  const currentUser: PersonKey = "name1";

  return (
    <div className="canvas-root">
      <div className="app-toolbar">
        <ThemeToggle />
      </div>

      {isMobile ? (
        <MobileCanvas
          people={people}
          currentUser={currentUser}
          today={today}
          reactionsByCardId={reactionsByCardId}
        />
      ) : (
        <DesktopCanvas
          people={people}
          currentUser={currentUser}
          today={today}
          reactionsByCardId={reactionsByCardId}
        />
      )}
    </div>
  );
}
