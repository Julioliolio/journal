"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { ThemeToggle } from "./ThemeToggle";

type DayEntry = { date: string; isToday?: boolean; cards: string[] };
type Person = { key: string; name: string; days: DayEntry[] };

const PEOPLE: Person[] = [
  {
    key: "marco",
    name: "Marco",
    days: [
      {
        date: "TUE · JAN 13",
        isToday: true,
        cards: [
          "First real snow of the season. Quiet walk before breakfast.",
          "Made coffee on the stovetop again. Better than the machine.",
        ],
      },
      {
        date: "SAT · JAN 10",
        cards: [
          "Finished Stoner. Sat with it for a while before putting it on the shelf.",
        ],
      },
    ],
  },
  {
    key: "sam",
    name: "Sam",
    days: [
      {
        date: "TUE · JAN 13",
        isToday: true,
        cards: [
          "New coffee shop on Elm. Better light than the old place.",
          "Called mom. She's coming to visit in March.",
        ],
      },
      {
        date: "THU · JAN 8",
        cards: ["Signed up for pottery. Starts Thursday."],
      },
    ],
  },
  {
    key: "ana",
    name: "Ana",
    days: [
      {
        date: "TUE · JAN 13",
        isToday: true,
        cards: [
          "Morning run 5k. New route past the river — all the way to the bridge.",
        ],
      },
      {
        date: "SAT · JAN 10",
        cards: [
          "Found a bookstore I'd never noticed before. Spent an hour inside.",
          "Soup for dinner — first time using the new pot.",
        ],
      },
    ],
  },
  {
    key: "leo",
    name: "Leo",
    days: [
      {
        date: "TUE · JAN 13",
        isToday: true,
        cards: [
          "Lost my keys. Found them in the freezer. Don't ask.",
          "Bought a tomato plant. Optimistic about it.",
        ],
      },
      {
        date: "SUN · JAN 11",
        cards: [
          "Decided to start learning guitar again. Got the dust off the case.",
        ],
      },
    ],
  },
];

export function FourColumnsCanvas() {
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(PEOPLE.map((p) => p.key)),
  );

  // Pill DOM nodes by key — populated/removed by ref callbacks. The same
  // person's pill mounts in either the rail or the column header at any
  // given time, so the ref always points to the current node.
  const pillRefs = useRef<Map<string, HTMLElement>>(new Map());
  // Column DOM nodes by key (only mounted while open).
  const columnRefs = useRef<Map<string, HTMLElement>>(new Map());
  // FLIP measurement captured during click; consumed after re-render.
  // The toggled pill gets the dramatic lift; every other moving pill gets
  // a soft translate so the rail itself reflows smoothly when a new pill
  // joins or leaves it.
  const pendingPillRects = useRef<Map<string, DOMRect>>(new Map());
  const pendingToggledKey = useRef<string | null>(null);
  // Column rects captured for layout-shift FLIP — every column that's open
  // *before* the toggle gets measured, then animated from its old slot.
  const pendingColumnFlips = useRef<Map<string, DOMRect>>(new Map());
  // Card widths captured for size FLIP — when columns redistribute, the
  // cards inside grow / shrink with them.
  const pendingCardWidths = useRef<Map<HTMLElement, number>>(new Map());

  function toggle(key: string) {
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
      .querySelectorAll<HTMLElement>(".prototype-half .day-card")
      .forEach((card) => {
        pendingCardWidths.current.set(
          card,
          card.getBoundingClientRect().width,
        );
      });
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Run AFTER React commits the new layout, BEFORE paint — the pill is
  // already at its destination but we animate from the old origin to it
  // (FLIP technique: First, Last, Invert, Play).
  useLayoutEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ===== Pill flip =====
    // The toggled pill gets the dramatic lift+tilt+squash; every other
    // pill that moved gets a soft slide. Pills inside columns ride their
    // column's translateX, so we skip them to avoid double-animating.
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
          // Cross-container move: lift, tilt, land with overshoot.
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
          // Other pills: only animate if in the rail. Pills in column
          // headers ride their column's translateX from the column flip.
          const inRail = !!el.closest(".prototype-rail");
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

    // ===== Column flip =====
    // Slide every column that's still mounted from its old slot to its new.
    // Newly-opened columns weren't in the map → they appear with the
    // existing day-card sprout animation instead.
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

    // ===== Card-width flip =====
    // Each day-card that's still mounted but whose width changed (because
    // its column is now wider/narrower) animates from old to new width.
    // Card-shells inside fill the day-card so they grow/shrink along.
    const cardWidths = pendingCardWidths.current;
    if (cardWidths.size > 0 && !reduceMotion) {
      cardWidths.forEach((oldW, card) => {
        if (!card.isConnected) return;
        const newW = card.getBoundingClientRect().width;
        if (Math.abs(oldW - newW) < 2) return;
        card.animate(
          [
            { width: `${oldW}px` },
            { width: `${newW}px` },
          ],
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

  function setPillRef(key: string) {
    return (el: HTMLButtonElement | null) => {
      if (el) pillRefs.current.set(key, el);
      else if (pillRefs.current.get(key)) pillRefs.current.delete(key);
    };
  }

  function setColumnRef(key: string) {
    return (el: HTMLElement | null) => {
      if (el) columnRefs.current.set(key, el);
      else if (columnRefs.current.get(key)) columnRefs.current.delete(key);
    };
  }

  const openPeople = PEOPLE.filter((p) => open.has(p.key));
  const closedPeople = PEOPLE.filter((p) => !open.has(p.key));

  return (
    <>
      <PrototypeStyles />
      <div className="canvas-root prototype-canvas">
        <div className="app-toolbar">
          <ThemeToggle />
        </div>
        {closedPeople.length > 0 && (
          <TopRail
            people={closedPeople}
            onPick={toggle}
            setPillRef={setPillRef}
          />
        )}
        <Columns
          people={openPeople}
          onClose={toggle}
          setPillRef={setPillRef}
          setColumnRef={setColumnRef}
        />
      </div>
    </>
  );
}

function TopRail({
  people,
  onPick,
  setPillRef,
}: {
  people: Person[];
  onPick: (key: string) => void;
  setPillRef: (key: string) => (el: HTMLButtonElement | null) => void;
}) {
  return (
    <div className="prototype-rail" aria-label="hidden people">
      {people.map((p) => (
        <button
          key={p.key}
          ref={setPillRef(p.key)}
          type="button"
          className="name-pill prototype-pill"
          onClick={() => onPick(p.key)}
          aria-label={`show ${p.name}`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}

function Columns({
  people,
  onClose,
  setPillRef,
  setColumnRef,
}: {
  people: Person[];
  onClose: (key: string) => void;
  setPillRef: (key: string) => (el: HTMLButtonElement | null) => void;
  setColumnRef: (key: string) => (el: HTMLElement | null) => void;
}) {
  if (people.length === 0) {
    return (
      <div className="prototype-empty">
        click a name above to bring it back
      </div>
    );
  }
  const gridTemplateColumns = people
    .map(() => "minmax(0, 1fr)")
    .join(" ");
  return (
    <div
      className="canvas-desktop"
      style={{ gridTemplateColumns, flex: 1 }}
    >
      {people.map((person) => (
        <OpenColumn
          key={person.key}
          person={person}
          onClose={() => onClose(person.key)}
          setPillRef={setPillRef}
          setColumnRef={setColumnRef}
        />
      ))}
    </div>
  );
}

function OpenColumn({
  person,
  onClose,
  setPillRef,
  setColumnRef,
}: {
  person: Person;
  onClose: () => void;
  setPillRef: (key: string) => (el: HTMLButtonElement | null) => void;
  setColumnRef: (key: string) => (el: HTMLElement | null) => void;
}) {
  const todayLabel =
    person.days.find((d) => d.isToday)?.date ?? person.days[0]?.date ?? "";
  return (
    <section
      ref={setColumnRef(person.key)}
      className="half prototype-half"
      aria-label={`${person.name} side`}
    >
      <header className="half-header">
        <div className="half-header-inner">
          <button
            ref={setPillRef(person.key)}
            type="button"
            className="name-pill prototype-pill"
            onClick={onClose}
            aria-label={`hide ${person.name}`}
            title={`tap to send ${person.name} up to the rail`}
          >
            {person.name}
          </button>
          <span className="half-header-date">{todayLabel}</span>
        </div>
      </header>
      <div className="half-inner">
        <div className="masonry" style={{ columnCount: 1 }}>
          {person.days.map((day, dayIdx) => (
            <article
              key={day.date}
              className="day-card"
              data-date={day.date}
              style={{ ["--sprout-i" as string]: dayIdx } as React.CSSProperties}
            >
              <header className="day-card-header">
                <span className="date-pill">{day.date}</span>
                {day.isToday && <span className="today-pill">today</span>}
              </header>
              <div className="mini-stack">
                {day.cards.map((text, i) => (
                  <div
                    key={i}
                    className="card-shell card-light"
                    style={
                      { ["--sprout-j" as string]: i } as React.CSSProperties
                    }
                  >
                    <div className="markdown">
                      <p>{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrototypeStyles() {
  return (
    <style>{`
      /* Top horizontal rail of hidden people */
      .prototype-rail {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 8px;
        padding: 12px 24px 10px;
        flex-shrink: 0;
      }

      .prototype-empty {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-ink-mute);
        font-size: 13px;
        letter-spacing: 0.04em;
      }

      /* Pills bounce on hover/press. Transform here only fires when the
         FLIP animation isn't running — Web Animations API runs at a
         higher composite level so it stays clean. */
      .prototype-canvas .prototype-pill {
        cursor: pointer;
        transition:
          background 140ms ease,
          color 140ms ease,
          border-color 140ms ease,
          transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @media (hover: hover) {
        .prototype-canvas .prototype-pill:hover {
          transform: translateY(-1px) scale(1.04);
        }
      }
      .prototype-canvas .prototype-pill:active {
        transform: scale(0.94);
        transition-duration: 90ms;
      }

      /* Sprouting day cards: cards appearing in a newly-opened column
         drop in with a slight overshoot, staggered by index. */
      .prototype-canvas .day-card {
        animation: prototype-sprout 520ms cubic-bezier(0.34, 1.5, 0.55, 1) both;
        animation-delay: calc(80ms + var(--sprout-i, 0) * 90ms);
      }

      @keyframes prototype-sprout {
        0% {
          opacity: 0;
          transform: translateY(-18px) scale(0.86);
        }
        60% {
          opacity: 1;
          transform: translateY(2px) scale(1.02);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      /* Inner mini-cards land slightly later, smaller motion */
      .prototype-canvas .card-shell {
        animation: prototype-sprout-mini 420ms cubic-bezier(0.34, 1.45, 0.55, 1) both;
        animation-delay: calc(160ms + var(--sprout-i, 0) * 90ms + var(--sprout-j, 0) * 55ms);
      }

      @keyframes prototype-sprout-mini {
        0% {
          opacity: 0;
          transform: translateY(-8px) scale(0.92);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .prototype-canvas .day-card,
        .prototype-canvas .card-shell {
          animation: none;
        }
      }
    `}</style>
  );
}
