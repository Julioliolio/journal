"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebHaptics } from "web-haptics/react";

import { reorderCardsAction } from "@/app/actions/cards";
import { formatDayHeader } from "@/lib/date";
import type { Card, Reaction } from "@/lib/db/schema";
import { invalidateCanvas } from "@/lib/queries";

import { Composer } from "./Composer";
import { useUploadInFlight } from "./DropZone";
import { MiniCard } from "./MiniCard";
import { MiniCardWithLock } from "./MiniCard/WithLock";

const subscribeNoop = () => () => {};

export function DayCard({
  date,
  cards,
  reactionsByCardId,
  isOwn,
  today,
}: {
  date: string;
  cards: Card[]; // already sorted DESC by position (newest first)
  reactionsByCardId: Map<string, Reaction[]>;
  isOwn: boolean;
  today: string;
}) {
  const isToday = date === today;
  const reflectionExists = cards.some((c) => c.type === "reflection");

  return (
    <article className="day-card" data-date={date}>
      <header className="day-card-header">
        <span className="date-pill">{formatDayHeader(date)}</span>
        {isToday && <span className="today-pill">today</span>}
      </header>
      {isToday && isOwn && (
        <Composer today={date} reflectionExists={reflectionExists} />
      )}
      <DayBody
        date={date}
        cards={cards}
        reactionsByCardId={reactionsByCardId}
        isOwn={isOwn}
        today={today}
      />
    </article>
  );
}

function EmptyHint({ isToday, isOwn }: { isToday: boolean; isOwn: boolean }) {
  if (!(isToday && isOwn)) return null;
  return (
    <p className="empty-quiet">hover to add — or drop / paste an image or video.</p>
  );
}

function UploadingPlaceholder({
  stage,
  percent,
}: {
  stage: "compressing" | "uploading";
  percent: number | null;
}) {
  // Compression progress is real (0–100 from browser-image-compression).
  // The upload step has no progress events, so we fill to 100% on
  // stage transition — a short determinate bar feels much more
  // responsive than another spinner.
  const fill = stage === "uploading" ? 100 : (percent ?? 0);
  const label =
    stage === "uploading"
      ? "uploading…"
      : percent === null
        ? "compressing…"
        : `compressing… ${Math.round(percent)}%`;
  return (
    <div
      className="card-shell card-uploading"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={fill}
      aria-label={stage === "uploading" ? "uploading" : "compressing image"}
    >
      <span className="card-uploading-label">{label}</span>
      <span className="card-uploading-bar" aria-hidden="true">
        <span
          className="card-uploading-bar-fill"
          style={{ width: `${fill}%` }}
        />
      </span>
    </div>
  );
}

function DayBody({
  date,
  cards,
  reactionsByCardId,
  isOwn,
  today,
}: {
  date: string;
  cards: Card[];
  reactionsByCardId: Map<string, Reaction[]>;
  isOwn: boolean;
  today: string;
}) {
  const isToday = date === today;
  const qc = useQueryClient();
  const haptic = useWebHaptics();
  const uploadState = useUploadInFlight();
  const showUploadingHere = !!uploadState && isToday && isOwn;
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const [orderedIds, setOrderedIds] = useState<string[]>(() =>
    cards.map((c) => c.id),
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  // Reset local order when the underlying cards array changes.
  const sameOrder =
    orderedIds.length === cards.length &&
    orderedIds.every((id, i) => id === cards[i]!.id);
  if (!sameOrder) {
    setOrderedIds(cards.map((c) => c.id));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { byId, items } = useMemo(() => {
    const byId = new Map(cards.map((c) => [c.id, c]));
    const items = orderedIds
      .map((id) => byId.get(id))
      .filter((c): c is Card => Boolean(c));
    return { byId, items };
  }, [cards, orderedIds]);

  if (items.length === 0) {
    if (showUploadingHere && uploadState) {
      return (
        <div className="mini-stack">
          <UploadingPlaceholder
            stage={uploadState.stage}
            percent={uploadState.percent}
          />
        </div>
      );
    }
    return <EmptyHint isToday={isToday} isOwn={isOwn} />;
  }

  // Read-only side — no DndContext needed. Also rendered on first paint
  // for own side so SSR matches CSR (dnd-kit's id counter only ticks
  // post-mount in our setup).
  if (!isOwn || !mounted) {
    return (
      <div className="mini-stack">
        {showUploadingHere && uploadState && (
            <UploadingPlaceholder
              stage={uploadState.stage}
              percent={uploadState.percent}
            />
          )}
        {items.map((c) => (
          <MiniCardWithLock
            key={c.id}
            card={c}
            reactions={reactionsByCardId.get(c.id) ?? []}
            isOwn={isOwn}
            sortable={false}
            today={today}
          />
        ))}
      </div>
    );
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedIds.indexOf(String(active.id));
    const newIndex = orderedIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(next);
    haptic.trigger("medium");
    try {
      await reorderCardsAction({
        date,
        orderedIds: next,
        clientToday: today,
      });
      invalidateCanvas(qc);
    } catch {
      setOrderedIds(cards.map((c) => c.id));
    }
  }

  const activeCard = activeId ? byId.get(activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
        <div className="mini-stack">
          {showUploadingHere && uploadState && (
            <UploadingPlaceholder
              stage={uploadState.stage}
              percent={uploadState.percent}
            />
          )}
          {items.map((c) => (
            <MiniCardWithLock
              key={c.id}
              card={c}
              reactions={reactionsByCardId.get(c.id) ?? []}
              isOwn={true}
              sortable={true}
              today={today}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay
        dropAnimation={{
          duration: 220,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        {activeCard ? (
          <div className="drag-overlay">
            <MiniCard card={activeCard} isOwn editable />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
