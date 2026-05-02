"use client";

import { useEffect, useRef, useState } from "react";

import { formatDayHeader } from "@/lib/date";
import type { Card, PersonKey, Reaction } from "@/lib/db/schema";

import { DayCard } from "./DayCard";
import { DropZone } from "./DropZone";

export function Half({
  personKey,
  label,
  cards,
  reactionsByCardId,
  today,
  isOwn,
}: {
  personKey: PersonKey;
  label: string;
  cards: Card[];
  reactionsByCardId: Map<string, Reaction[]>;
  today: string;
  isOwn: boolean;
}) {
  const grouped = groupByDate(cards);

  // Lazy day-cards: only days that actually have content. On own side,
  // always surface today (even empty) so the user has a target.
  const dates = Array.from(grouped.keys()).sort((a, b) =>
    a > b ? -1 : 1,
  );
  if (isOwn && !dates.includes(today)) dates.unshift(today);

  const halfRef = useRef<HTMLElement>(null);
  const initialDate = dates[0] ?? today;
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  if (!dates.includes(currentDate) && dates[0]) {
    setCurrentDate(dates[0]);
  }

  // Observe day-cards relative to the scroll container; whichever sits at
  // the top of the visible area (just under the sticky header) becomes
  // the "current" date shown in the header. Also flag the half as
  // "scrolled" once the user moves past the top so the header fade only
  // applies when there's actual content scrolling under it.
  const datesKey = dates.join(",");
  useEffect(() => {
    const root = halfRef.current;
    if (!root) return;

    const updateScrolled = () => {
      root.dataset.scrolled = root.scrollTop > 4 ? "true" : "false";
    };
    updateScrolled();
    root.addEventListener("scroll", updateScrolled, { passive: true });

    const cardEls = root.querySelectorAll<HTMLElement>("[data-date]");
    if (cardEls.length === 0) {
      return () => root.removeEventListener("scroll", updateScrolled);
    }

    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const date = (entry.target as HTMLElement).dataset.date;
          if (!date) continue;
          if (entry.isIntersecting) {
            visible.set(date, entry.boundingClientRect.top);
          } else {
            visible.delete(date);
          }
        }
        let topDate: string | undefined;
        let topY = Infinity;
        for (const [date, y] of visible) {
          if (y < topY) {
            topY = y;
            topDate = date;
          }
        }
        if (topDate) setCurrentDate(topDate);
      },
      { root, rootMargin: "-72px 0px -50% 0px", threshold: 0 },
    );

    cardEls.forEach((el) => observer.observe(el));
    return () => {
      root.removeEventListener("scroll", updateScrolled);
      observer.disconnect();
    };
  }, [datesKey]);

  // Close the picker on outside click or Escape.
  useEffect(() => {
    if (!pickerOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickerOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pickerOpen]);

  function jumpTo(date: string) {
    const root = halfRef.current;
    if (!root) return;
    const card = root.querySelector<HTMLElement>(
      `[data-date="${date}"]`,
    );
    if (!card) return;
    const cardTop =
      card.getBoundingClientRect().top - root.getBoundingClientRect().top;
    root.scrollTo({
      top: root.scrollTop + cardTop - 80,
      behavior: "smooth",
    });
    setCurrentDate(date);
    setPickerOpen(false);
  }

  const canPick = dates.length > 1;

  const body = (
    <>
      <header className="half-header">
        <div className="half-header-inner">
          <span className="name-pill">
            {label}
            {isOwn && <span className="you">you</span>}
          </span>
          {canPick ? (
            <div className="date-picker-wrap" ref={pickerRef}>
              <button
                type="button"
                className="half-header-date is-clickable"
                onClick={() => setPickerOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={pickerOpen}
              >
                {formatDayHeader(currentDate)}
              </button>
              {pickerOpen && (
                <div className="date-picker" role="listbox">
                  {dates.map((d) => (
                    <button
                      key={d}
                      type="button"
                      role="option"
                      aria-selected={d === currentDate}
                      className={`date-picker-item${
                        d === currentDate ? " active" : ""
                      }`}
                      onClick={() => jumpTo(d)}
                    >
                      <span>{formatDayHeader(d)}</span>
                      {d === today && (
                        <span className="today-pill">today</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="half-header-date">
              {formatDayHeader(currentDate)}
            </span>
          )}
        </div>
      </header>
      <div className="half-inner">
        {dates.length === 0 && (
          <div className="empty-centered">
            {isOwn ? "drop your first card" : "nothing yet"}
          </div>
        )}
        <div className="masonry">
          {dates.map((date) => {
            const dayCards = (grouped.get(date) ?? [])
              .slice()
              .sort((a, b) => b.position - a.position);
            return (
              <DayCard
                key={date}
                date={date}
                cards={dayCards}
                reactionsByCardId={reactionsByCardId}
                isOwn={isOwn}
                today={today}
              />
            );
          })}
        </div>
      </div>
    </>
  );

  if (isOwn) {
    return (
      <section
        ref={halfRef}
        className="half"
        data-person={personKey}
        aria-label={`${label} side`}
      >
        <DropZone today={today}>{body}</DropZone>
      </section>
    );
  }

  return (
    <section
      ref={halfRef}
      className="half"
      data-person={personKey}
      aria-label={`${label} side`}
    >
      {body}
    </section>
  );
}

function groupByDate(cards: Card[]): Map<string, Card[]> {
  const out = new Map<string, Card[]>();
  for (const c of cards) {
    const arr = out.get(c.date) ?? [];
    arr.push(c);
    out.set(c.date, arr);
  }
  return out;
}
