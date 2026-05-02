"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { getCanvasDataAction, type CanvasData } from "@/app/actions/data";
import { todayISO } from "@/lib/date";
import type { Partners, PersonKey, Reaction } from "@/lib/db/schema";

import { Half } from "./Half";
import { ThemeToggle } from "./ThemeToggle";

export function Canvas({
  initialData,
  inviteUrl = null,
}: {
  initialData: CanvasData & {
    partners: Partners;
    currentUser: PersonKey | null;
  };
  /** Full /login/<token> URL — only passed for authenticated authors. */
  inviteUrl?: string | null;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: ["canvas"] });
    };
    return () => es.close();
  }, [queryClient]);

  const { data } = useQuery({
    queryKey: ["canvas"],
    queryFn: getCanvasDataAction,
    initialData,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const partners = data.partners ?? initialData.partners;
  const currentUser = data.currentUser ?? initialData.currentUser;
  const cards = data.cards;
  const reactions = data.reactions;

  const reactionsByCardId = useMemo(() => {
    const map = new Map<string, Reaction[]>();
    for (const r of reactions) {
      const arr = map.get(r.cardId);
      if (arr) arr.push(r);
      else map.set(r.cardId, [r]);
    }
    return map;
  }, [reactions]);

  // Keep today's date label in sync across midnight without a refresh.
  const [today, setToday] = useState(() => todayISO());
  useEffect(() => {
    const id = setInterval(() => {
      const next = todayISO();
      if (next !== today) setToday(next);
    }, 60_000);
    return () => clearInterval(id);
  }, [today]);

  const isMobile = useIsMobile();
  const [tab, setTab] = useState<PersonKey>(currentUser ?? "name1");
  const [trackedUser, setTrackedUser] = useState(currentUser);
  if (currentUser !== trackedUser) {
    setTrackedUser(currentUser);
    if (currentUser) setTab(currentUser);
  }

  const name1Cards = cards.filter((c) => c.personKey === "name1");
  const name2Cards = cards.filter((c) => c.personKey === "name2");
  const partnerJoined = Boolean(partners.name2);

  const renderName2Side = () =>
    partnerJoined ? (
      <Half
        personKey="name2"
        label={partners.name2 as string}
        cards={name2Cards}
        reactionsByCardId={reactionsByCardId}
        today={today}
        isOwn={currentUser === "name2"}
      />
    ) : (
      <WaitingForPartner inviteUrl={inviteUrl} />
    );

  return (
    <div className="canvas-root">
      <div className="app-toolbar">
        <ThemeToggle />
      </div>

      {isMobile ? (
        <>
          <div className="mobile-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className="mobile-tab"
              aria-selected={tab === "name1"}
              onClick={() => setTab("name1")}
            >
              {partners.name1}
            </button>
            <button
              type="button"
              role="tab"
              className="mobile-tab"
              aria-selected={tab === "name2"}
              onClick={() => setTab("name2")}
              disabled={!partnerJoined}
              title={partnerJoined ? undefined : "waiting for partner"}
            >
              {partners.name2 ?? "—"}
            </button>
          </div>
          <div className="canvas-mobile">
            <div className="canvas-mobile-track" data-tab={tab}>
              <Half
                personKey="name1"
                label={partners.name1}
                cards={name1Cards}
                reactionsByCardId={reactionsByCardId}
                today={today}
                isOwn={currentUser === "name1"}
              />
              {renderName2Side()}
            </div>
          </div>
        </>
      ) : (
        <div className="canvas-desktop">
          <Half
            personKey="name1"
            label={partners.name1}
            cards={name1Cards}
            reactionsByCardId={reactionsByCardId}
            today={today}
            isOwn={currentUser === "name1"}
          />
          {renderName2Side()}
        </div>
      )}
    </div>
  );
}

function WaitingForPartner({ inviteUrl }: { inviteUrl: string | null }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!inviteUrl) return;
    try {
      const absolute = inviteUrl.startsWith("http")
        ? inviteUrl
        : window.location.origin + inviteUrl;
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Older browsers / insecure contexts: fall back to selecting the URL.
    }
  }

  return (
    <section className="half waiting-half" aria-label="invite partner">
      <div className="waiting-inner">
        <p className="waiting-eyebrow">waiting for your partner</p>
        {inviteUrl ? (
          <>
            <h2 className="waiting-title">share this private link</h2>
            <button
              type="button"
              className="pill pill-primary"
              onClick={copy}
            >
              {copied ? "copied ✓" : "copy invite link"}
            </button>
          </>
        ) : (
          <h2 className="waiting-title">no partner has joined yet</h2>
        )}
      </div>
    </section>
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
