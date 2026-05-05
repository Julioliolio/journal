"use client";

import { useEffect, useRef, useState } from "react";

import { formatDayHeader } from "@/lib/date";
import type { Card, PersonKey, Reaction } from "@/lib/db/schema";
import { useEscapeKey } from "@/lib/hooks/useEscapeKey";

import { DayCard } from "./DayCard";
import { DropZone } from "./DropZone";

export function Half({
  personKey,
  label,
  cards,
  reactionsByCardId,
  today,
  isOwn,
  onToggle,
  hideToggleIcon = false,
  pillRef,
  sectionRef,
  nameOptions,
  onSelectPerson,
}: {
  personKey: PersonKey;
  label: string;
  cards: Card[];
  reactionsByCardId: Map<string, Reaction[]>;
  today: string;
  isOwn: boolean;
  onToggle?: () => void;
  /** When true, render the toggle pill without the swap icon. */
  hideToggleIcon?: boolean;
  /** Captures the pill DOM node so the parent can FLIP-animate it. */
  pillRef?: (el: HTMLElement | null) => void;
  /** Captures the outer <section> so the parent can FLIP-animate it. */
  sectionRef?: (el: HTMLElement | null) => void;
  /** When provided, the name pill becomes a dropdown for switching to
   *  another person. Used on mobile where there's only one half on screen. */
  nameOptions?: { key: PersonKey; label: string; isOwn: boolean }[];
  onSelectPerson?: (key: PersonKey) => void;
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

  useEscapeKey(() => setPickerOpen(false));
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
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [pickerOpen]);

  const canPickPerson =
    !!nameOptions && nameOptions.length > 1 && !!onSelectPerson;
  const [namePickerOpen, setNamePickerOpen] = useState(false);
  const namePickerRef = useRef<HTMLDivElement>(null);
  useEscapeKey(() => setNamePickerOpen(false));
  useEffect(() => {
    if (!namePickerOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (
        namePickerRef.current &&
        !namePickerRef.current.contains(e.target as Node)
      ) {
        setNamePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [namePickerOpen]);

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
          {onToggle ? (
            <button
              ref={pillRef}
              type="button"
              className="name-pill name-pill-toggle"
              onClick={onToggle}
              aria-label={`switch to other person`}
            >
              {label}
              {isOwn && <span className="you">you</span>}
              {!hideToggleIcon && <SwapIcon />}
            </button>
          ) : canPickPerson ? (
            <div className="name-picker-wrap" ref={namePickerRef}>
              <button
                ref={pillRef}
                type="button"
                className="name-pill name-pill-picker"
                aria-haspopup="listbox"
                aria-expanded={namePickerOpen}
                onClick={() => setNamePickerOpen((v) => !v)}
              >
                {label}
                {isOwn && <span className="you">you</span>}
                <ChevronDownIcon />
              </button>
              {namePickerOpen && (
                <div className="name-picker" role="listbox">
                  {nameOptions!.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      role="option"
                      aria-selected={opt.key === personKey}
                      className={`name-picker-item${
                        opt.key === personKey ? " active" : ""
                      }`}
                      onClick={() => {
                        onSelectPerson!(opt.key);
                        setNamePickerOpen(false);
                      }}
                    >
                      <span>{opt.label}</span>
                      {opt.isOwn && <span className="you">you</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span ref={pillRef} className="name-pill">
              {label}
              {isOwn && <span className="you">you</span>}
            </span>
          )}
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

  const setSection = (el: HTMLElement | null) => {
    halfRef.current = el;
    sectionRef?.(el);
  };

  if (isOwn) {
    return (
      <section
        ref={setSection}
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
      ref={setSection}
      className="half"
      data-person={personKey}
      aria-label={`${label} side`}
    >
      {body}
    </section>
  );
}

function SwapIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="swap-icon"
    >
      <path d="M7 16V4m0 0L3 8m4-4 4 4" />
      <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="name-picker-chevron"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
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
