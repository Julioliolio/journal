"use client";

import type { QueryClient } from "@tanstack/react-query";

import type { CanvasData } from "@/app/actions/data";
import type { Reaction } from "@/lib/db/schema";

export const CANVAS_KEY = ["canvas"] as const;

export function invalidateCanvas(qc: QueryClient): Promise<void> {
  return qc.invalidateQueries({ queryKey: CANVAS_KEY });
}

export function spliceReaction(qc: QueryClient, next: Reaction): void {
  qc.setQueryData<CanvasData>(CANVAS_KEY, (prev) =>
    prev ? { ...prev, reactions: [...prev.reactions, next] } : prev,
  );
}

export function replaceReaction(
  qc: QueryClient,
  tempId: string,
  real: Reaction,
): void {
  // Race-safe: a background refetch could land between optimistic insert
  // and server response. Drop both ids before appending so we end up with
  // exactly one row regardless of who got there first.
  qc.setQueryData<CanvasData>(CANVAS_KEY, (prev) => {
    if (!prev) return prev;
    const others = prev.reactions.filter(
      (r) => r.id !== tempId && r.id !== real.id,
    );
    return { ...prev, reactions: [...others, real] };
  });
}

export function removeReactionFromCache(qc: QueryClient, id: string): void {
  qc.setQueryData<CanvasData>(CANVAS_KEY, (prev) =>
    prev
      ? { ...prev, reactions: prev.reactions.filter((r) => r.id !== id) }
      : prev,
  );
}
