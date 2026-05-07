"use client";

import { useState } from "react";

import { DEMO_PARTNERS, buildDemoData } from "@/lib/demo-data";
import type { PersonKey } from "@/lib/db/schema";
import { useCanvasSubscription } from "@/lib/hooks/useCanvasSubscription";
import { useDemoCanvasData } from "@/lib/hooks/useDemoCanvasData";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { useReactionsByCardId } from "@/lib/hooks/useReactionsByCardId";
import { useTodayTick } from "@/lib/hooks/useTodayTick";

import { Half } from "./Half";
import { ThemeToggle } from "./ThemeToggle";

export function DemoCanvas() {
  const today = useTodayTick();
  useCanvasSubscription();

  const { data } = useDemoCanvasData({
    sessionKey: "demo-session-start",
    partners: DEMO_PARTNERS,
    currentUser: "name1",
    buildMock: buildDemoData,
    today,
  });

  const cards = data?.cards ?? [];
  const reactionsByCardId = useReactionsByCardId(data?.reactions ?? []);

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
