"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { getCanvasDataAction, type CanvasData } from "@/app/actions/data";
import { todayISO } from "@/lib/date";
import { DEMO_PARTNERS, buildDemoData } from "@/lib/demo-data";
import type { PersonKey, Reaction } from "@/lib/db/schema";

import { Half } from "./Half";
import { ThemeToggle } from "./ThemeToggle";

const SESSION_START_KEY = "demo-session-start";

export function DemoCanvas() {
  const [today, setToday] = useState(() => todayISO());
  const qc = useQueryClient();

  // Persist across reloads so cards saved in a previous tab still show
  // after refresh. Initialized in useEffect (post-mount) so rendering
  // stays pure; the query reads sessionStartRef.current at call time, by
  // which point it's been set.
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
      const next = todayISO();
      if (next !== today) setToday(next);
    }, 60_000);
    return () => clearInterval(id);
  }, [today]);

  // Tail SSE so live writes (composer save, reactions) refresh the merge.
  useEffect(() => {
    const es = new EventSource("/api/events");
    es.onmessage = () => qc.invalidateQueries({ queryKey: ["canvas"] });
    return () => es.close();
  }, [qc]);

  // queryKey must be ["canvas"] so the existing Composer/EditMenu/Reactions
  // components hit the same cache when they invalidate or splice.
  const { data } = useQuery<CanvasData & { __demo: true }>({
    queryKey: ["canvas"],
    queryFn: async () => {
      const mock = buildDemoData(today);
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
        partners: DEMO_PARTNERS,
        currentUser: real?.currentUser ?? "name1",
        cards: [...mock.cards, ...newCards],
        reactions: [...mock.reactions, ...newReactions],
      };
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const cards = data?.cards ?? [];

  const reactionsByCardId = useMemo(() => {
    const map = new Map<string, Reaction[]>();
    for (const r of data?.reactions ?? []) {
      const arr = map.get(r.cardId);
      if (arr) arr.push(r);
      else map.set(r.cardId, [r]);
    }
    return map;
  }, [data?.reactions]);

  const isMobile = useIsMobile();
  const [tab, setTab] = useState<PersonKey>("name1");

  const name1Cards = cards.filter((c) => c.personKey === "name1");
  const name2Cards = cards.filter((c) => c.personKey === "name2");

  return (
    <div className="canvas-root">
      <div className="app-toolbar">
        <ThemeToggle />
      </div>

      {isMobile ? (
        <div className="canvas-mobile">
          <div className="canvas-mobile-track" data-tab={tab}>
            <Half
              personKey="name1"
              label={DEMO_PARTNERS.name1}
              cards={name1Cards}
              reactionsByCardId={reactionsByCardId}
              today={today}
              isOwn={true}
              onToggle={() => setTab("name2")}
            />
            <Half
              personKey="name2"
              label={DEMO_PARTNERS.name2 as string}
              cards={name2Cards}
              reactionsByCardId={reactionsByCardId}
              today={today}
              isOwn={false}
              onToggle={() => setTab("name1")}
            />
          </div>
        </div>
      ) : (
        <div className="canvas-desktop">
          <Half
            personKey="name1"
            label={DEMO_PARTNERS.name1}
            cards={name1Cards}
            reactionsByCardId={reactionsByCardId}
            today={today}
            isOwn={true}
          />
          <Half
            personKey="name2"
            label={DEMO_PARTNERS.name2 as string}
            cards={name2Cards}
            reactionsByCardId={reactionsByCardId}
            today={today}
            isOwn={false}
          />
        </div>
      )}
    </div>
  );
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}
