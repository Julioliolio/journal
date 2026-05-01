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
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebHaptics } from "web-haptics/react";

import { reorderCardsAction } from "@/app/actions/cards";
import { formatDayHeader, todayISO } from "@/lib/date";
import type { Card, Reaction } from "@/lib/db/schema";

import { Composer } from "./Composer";
import { MiniCard } from "./MiniCard";
import { MiniCardWithLock } from "./MiniCard/WithLock";

export function DayCard({
  date,
  cards,
  reactionsByCardId,
  isOwn,
  isToday,
}: {
  date: string;
  cards: Card[]; // already sorted DESC by position (newest first)
  reactionsByCardId: Map<string, Reaction[]>;
  isOwn: boolean;
  isToday: boolean;
}) {
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
        isToday={isToday}
      />
    </article>
  );
}

function EmptyHint({ isToday, isOwn }: { isToday: boolean; isOwn: boolean }) {
  if (!(isToday && isOwn)) return null;
  return (
    <p className="empty-quiet">hover to add — or drop / paste an image.</p>
  );
}

function DayBody({
  date,
  cards,
  reactionsByCardId,
  isOwn,
  isToday,
}: {
  date: string;
  cards: Card[];
  reactionsByCardId: Map<string, Reaction[]>;
  isOwn: boolean;
  isToday: boolean;
}) {
  const qc = useQueryClient();
  const haptic = useWebHaptics();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [orderedIds, setOrderedIds] = useState<string[]>(() =>
    cards.map((c) => c.id),
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  // Reset local order when the underlying cards array changes.
  const incomingIds = cards.map((c) => c.id).join(",");
  const localIds = orderedIds.join(",");
  if (incomingIds !== localIds) {
    setOrderedIds(cards.map((c) => c.id));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const byId = new Map(cards.map((c) => [c.id, c]));
  const items = orderedIds
    .map((id) => byId.get(id))
    .filter((c): c is Card => Boolean(c));

  if (items.length === 0) {
    return <EmptyHint isToday={isToday} isOwn={isOwn} />;
  }

  // Read-only side — no DndContext needed. Also rendered on first paint
  // for own side so SSR matches CSR (dnd-kit's id counter only ticks
  // post-mount in our setup).
  if (!isOwn || !mounted) {
    return (
      <div className="mini-stack">
        {items.map((c) => (
          <MiniCardWithLock
            key={c.id}
            card={c}
            reactions={reactionsByCardId.get(c.id) ?? []}
            isOwn={isOwn}
            sortable={false}
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
        clientToday: todayISO(),
      });
      qc.invalidateQueries({ queryKey: ["canvas"] });
    } catch {
      haptic.trigger("error");
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
          {items.map((c) => (
            <MiniCardWithLock
              key={c.id}
              card={c}
              reactions={reactionsByCardId.get(c.id) ?? []}
              isOwn={true}
              sortable={true}
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
