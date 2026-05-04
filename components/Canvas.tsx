"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getCanvasDataAction, type CanvasData } from "@/app/actions/data";
import { todayISO } from "@/lib/date";
import {
  PERSON_KEYS,
  type Card,
  type Partners,
  type PersonKey,
  type Reaction,
} from "@/lib/db/schema";

import { Half } from "./Half";
import { ThemeToggle } from "./ThemeToggle";

type Person = { key: PersonKey; label: string; cards: Card[] };

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
    const refetch = () => queryClient.invalidateQueries({ queryKey: ["canvas"] });
    es.onmessage = refetch;
    let connected = false;
    es.onopen = () => {
      if (connected) refetch();
      connected = true;
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

  const [today, setToday] = useState(() => todayISO());
  useEffect(() => {
    const id = setInterval(() => {
      const next = todayISO();
      if (next !== today) setToday(next);
    }, 60_000);
    return () => clearInterval(id);
  }, [today]);

  const people: Person[] = useMemo(() => {
    return PERSON_KEYS.map((key) => ({
      key,
      label: partners[key],
      cards: cards.filter((c) => c.personKey === key),
    })).filter((p): p is Person => typeof p.label === "string" && p.label.length > 0);
  }, [partners, cards]);

  const isMobile = useIsMobile();
  const hasOpenSeats = people.length < PERSON_KEYS.length;

  return (
    <div className="canvas-root">
      <div className="app-toolbar">
        {currentUser && hasOpenSeats && inviteUrl && (
          <InviteButton inviteUrl={inviteUrl} />
        )}
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

function DesktopCanvas({
  people,
  currentUser,
  today,
  reactionsByCardId,
}: {
  people: Person[];
  currentUser: PersonKey | null;
  today: string;
  reactionsByCardId: Map<string, Reaction[]>;
}) {
  const [open, setOpen] = useState<Set<PersonKey>>(
    () => new Set(people.map((p) => p.key)),
  );

  // Reconcile open set when the joined-people list changes (e.g. a new
  // boss joins via the invite link). New people default to open; ones
  // that disappear get pruned.
  const knownKeys = people.map((p) => p.key).join("|");
  const [lastKnown, setLastKnown] = useState(knownKeys);
  if (knownKeys !== lastKnown) {
    setLastKnown(knownKeys);
    setOpen((prev) => {
      const next = new Set(prev);
      for (const p of people) if (!next.has(p.key)) next.add(p.key);
      for (const k of next) if (!people.find((p) => p.key === k)) next.delete(k);
      return next;
    });
  }

  const pillRefs = useRef<Map<PersonKey, HTMLElement>>(new Map());
  const columnRefs = useRef<Map<PersonKey, HTMLElement>>(new Map());
  const pendingPillRects = useRef<Map<PersonKey, DOMRect>>(new Map());
  const pendingToggledKey = useRef<PersonKey | null>(null);
  const pendingColumnFlips = useRef<Map<PersonKey, DOMRect>>(new Map());
  const pendingCardWidths = useRef<Map<HTMLElement, number>>(new Map());

  function toggle(key: PersonKey) {
    pendingToggledKey.current = key;
    pendingPillRects.current = new Map();
    pillRefs.current.forEach((el, k) => {
      pendingPillRects.current.set(k, el.getBoundingClientRect());
    });
    pendingColumnFlips.current = new Map();
    columnRefs.current.forEach((el, k) => {
      pendingColumnFlips.current.set(k, el.getBoundingClientRect());
    });
    pendingCardWidths.current = new Map();
    document
      .querySelectorAll<HTMLElement>(".canvas-desktop .day-card")
      .forEach((card) => {
        pendingCardWidths.current.set(card, card.getBoundingClientRect().width);
      });
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // FLIP: pills, columns, card widths. Runs after layout commit, before
  // paint, so animations start from the OLD geometry and land on the NEW.
  useLayoutEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const toggledKey = pendingToggledKey.current;
    pendingToggledKey.current = null;

    const pillRects = pendingPillRects.current;
    if (pillRects.size > 0 && !reduceMotion) {
      pillRects.forEach((from, k) => {
        const el = pillRefs.current.get(k);
        if (!el) return;
        const to = el.getBoundingClientRect();
        const dx = from.left - to.left;
        const dy = from.top - to.top;
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;

        if (k === toggledKey) {
          el.animate(
            [
              {
                transform: `translate(${dx}px, ${dy}px) scale(1) rotate(0deg)`,
                offset: 0,
              },
              {
                transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 10}px) scale(1.18) rotate(-6deg)`,
                offset: 0.45,
              },
              {
                transform: `translate(0px, 0px) scale(0.96) rotate(3deg)`,
                offset: 0.78,
              },
              {
                transform: "translate(0px, 0px) scale(1) rotate(0deg)",
                offset: 1,
              },
            ],
            {
              duration: 580,
              easing: "cubic-bezier(0.34, 1.45, 0.55, 1)",
              fill: "none",
            },
          );
        } else {
          // Other pills: only animate if currently in the rail. Pills
          // inside column headers ride their column's translateX from the
          // column flip below, so animating them too would double up.
          const inRail = !!el.closest(".canvas-rail");
          if (!inRail) return;
          el.animate(
            [
              { transform: `translate(${dx}px, ${dy}px)` },
              { transform: "translate(0px, 0px)" },
            ],
            {
              duration: 480,
              easing: "cubic-bezier(0.34, 1.42, 0.55, 1)",
              fill: "none",
            },
          );
        }
      });
    }
    pendingPillRects.current = new Map();

    const columnFlips = pendingColumnFlips.current;
    if (columnFlips.size > 0 && !reduceMotion) {
      columnFlips.forEach((from, key) => {
        const el = columnRefs.current.get(key);
        if (!el) return;
        const to = el.getBoundingClientRect();
        const dx = from.left - to.left;
        const dw = from.width - to.width;
        if (Math.abs(dx) < 2 && Math.abs(dw) < 2) return;
        el.animate(
          [
            { transform: `translateX(${dx}px)`, width: `${from.width}px` },
            { transform: "translateX(0px)", width: `${to.width}px` },
          ],
          {
            duration: 540,
            easing: "cubic-bezier(0.34, 1.42, 0.55, 1)",
            fill: "none",
          },
        );
      });
    }
    pendingColumnFlips.current = new Map();

    const cardWidths = pendingCardWidths.current;
    if (cardWidths.size > 0 && !reduceMotion) {
      cardWidths.forEach((oldW, card) => {
        if (!card.isConnected) return;
        const newW = card.getBoundingClientRect().width;
        if (Math.abs(oldW - newW) < 2) return;
        card.animate(
          [{ width: `${oldW}px` }, { width: `${newW}px` }],
          {
            duration: 540,
            easing: "cubic-bezier(0.34, 1.42, 0.55, 1)",
            fill: "none",
          },
        );
      });
    }
    pendingCardWidths.current = new Map();
  });

  function setPillRef(key: PersonKey) {
    return (el: HTMLElement | null) => {
      if (el) pillRefs.current.set(key, el);
      else if (pillRefs.current.get(key)) pillRefs.current.delete(key);
    };
  }

  function setColumnRef(key: PersonKey) {
    return (el: HTMLElement | null) => {
      if (el) columnRefs.current.set(key, el);
      else if (columnRefs.current.get(key)) columnRefs.current.delete(key);
    };
  }

  const openPeople = people.filter((p) => open.has(p.key));
  const closedPeople = people.filter((p) => !open.has(p.key));

  return (
    <>
      {closedPeople.length > 0 && (
        <div className="canvas-rail" aria-label="hidden people">
          {closedPeople.map((p) => (
            <button
              key={p.key}
              ref={setPillRef(p.key)}
              type="button"
              className="name-pill rail-pill"
              onClick={() => toggle(p.key)}
              aria-label={`show ${p.label}`}
            >
              {p.label}
              {currentUser === p.key && <span className="you">you</span>}
            </button>
          ))}
        </div>
      )}
      {openPeople.length === 0 ? (
        <div className="canvas-empty">click a name above to bring it back</div>
      ) : (
        <div
          className="canvas-desktop"
          style={{
            gridTemplateColumns: openPeople
              .map(() => "minmax(0, 1fr)")
              .join(" "),
          }}
        >
          {openPeople.map((p) => (
            <ColumnWithRef
              key={p.key}
              setColumnRef={setColumnRef(p.key)}
            >
              <Half
                personKey={p.key}
                label={p.label}
                cards={p.cards}
                reactionsByCardId={reactionsByCardId}
                today={today}
                isOwn={currentUser === p.key}
                onToggle={() => toggle(p.key)}
                pillRef={setPillRef(p.key)}
              />
            </ColumnWithRef>
          ))}
        </div>
      )}
    </>
  );
}

// Wraps Half so we can attach a column ref without modifying Half itself.
// Half renders its own <section>; we sit between it and the grid by
// passing the ref down via a thin wrapper that grabs the rendered child.
function ColumnWithRef({
  setColumnRef,
  children,
}: {
  setColumnRef: (el: HTMLElement | null) => void;
  children: React.ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) {
      setColumnRef(null);
      return;
    }
    // Half renders <section class="half"> as its only child.
    const section = wrapper.querySelector<HTMLElement>("section.half");
    setColumnRef(section);
    return () => setColumnRef(null);
  });
  return (
    <div ref={wrapperRef} className="canvas-column">
      {children}
    </div>
  );
}

function MobileCanvas({
  people,
  currentUser,
  today,
  reactionsByCardId,
}: {
  people: Person[];
  currentUser: PersonKey | null;
  today: string;
  reactionsByCardId: Map<string, Reaction[]>;
}) {
  const initialTab: PersonKey | null =
    currentUser && people.some((p) => p.key === currentUser)
      ? currentUser
      : people[0]?.key ?? null;
  const [tab, setTab] = useState<PersonKey | null>(initialTab);
  const [trackedUser, setTrackedUser] = useState(currentUser);
  if (currentUser !== trackedUser) {
    setTrackedUser(currentUser);
    if (currentUser && people.some((p) => p.key === currentUser)) {
      setTab(currentUser);
    }
  }
  if (tab && !people.some((p) => p.key === tab)) {
    setTab(people[0]?.key ?? null);
  }

  if (people.length === 0 || !tab) {
    return <div className="canvas-empty">no one has joined yet</div>;
  }

  const active = people.find((p) => p.key === tab) ?? people[0]!;

  return (
    <div className="canvas-mobile">
      <div className="canvas-mobile-tabs" role="tablist">
        {people.map((p) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={p.key === tab}
            className={`name-pill mobile-tab${p.key === tab ? " active" : ""}`}
            onClick={() => setTab(p.key)}
          >
            {p.label}
            {currentUser === p.key && <span className="you">you</span>}
          </button>
        ))}
      </div>
      <Half
        key={active.key}
        personKey={active.key}
        label={active.label}
        cards={active.cards}
        reactionsByCardId={reactionsByCardId}
        today={today}
        isOwn={currentUser === active.key}
      />
    </div>
  );
}

function InviteButton({ inviteUrl }: { inviteUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      const absolute = inviteUrl.startsWith("http")
        ? inviteUrl
        : window.location.origin + inviteUrl;
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Older browsers / insecure contexts: silently no-op.
    }
  }

  return (
    <button type="button" className="pill invite-pill" onClick={copy}>
      {copied ? "copied ✓" : "invite"}
    </button>
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
