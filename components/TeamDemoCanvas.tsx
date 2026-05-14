"use client";

import { useMemo } from "react";

import { DEMO_PARTNERS_TEAM, buildDemoDataTeam } from "@/lib/demo-data";
import { PERSON_KEYS, type PersonKey } from "@/lib/db/schema";
import { useCanvasSubscription } from "@/lib/hooks/useCanvasSubscription";
import { useDemoCanvasData } from "@/lib/hooks/useDemoCanvasData";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { useReactionsByCardId } from "@/lib/hooks/useReactionsByCardId";
import { useTodayTick } from "@/lib/hooks/useTodayTick";

import { DesktopCanvas, MobileCanvas, type Person } from "./Canvas";
import { ThemeToggle } from "./ThemeToggle";

const CURRENT_USER: PersonKey = "name1";

export function TeamDemoCanvas() {
  const today = useTodayTick();
  useCanvasSubscription();

  const { data } = useDemoCanvasData({
    sessionKey: "demo-team-session-start",
    partners: DEMO_PARTNERS_TEAM,
    // Always Julio so the "you" badge stays put regardless of cookie.
    currentUser: CURRENT_USER,
    buildMock: buildDemoDataTeam,
    today,
  });

  const reactionsByCardId = useReactionsByCardId(data?.reactions ?? []);

  const partners = data?.partners ?? DEMO_PARTNERS_TEAM;

  const people: Person[] = useMemo(() => {
    const cards = data?.cards ?? [];
    return PERSON_KEYS.map((key) => ({
      key,
      label: partners[key],
      cards: cards.filter((c) => c.personKey === key),
    })).filter(
      (p): p is Person =>
        typeof p.label === "string" && p.label.length > 0,
    );
  }, [data?.cards, partners]);

  const isMobile = useIsMobile();

  return (
    <div className="canvas-root">
      <div className="app-toolbar">
        <ThemeToggle />
      </div>

      {isMobile ? (
        <MobileCanvas
          people={people}
          currentUser={CURRENT_USER}
          today={today}
          reactionsByCardId={reactionsByCardId}
        />
      ) : (
        <DesktopCanvas
          people={people}
          currentUser={CURRENT_USER}
          today={today}
          reactionsByCardId={reactionsByCardId}
        />
      )}
    </div>
  );
}
