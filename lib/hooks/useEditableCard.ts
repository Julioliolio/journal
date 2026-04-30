"use client";

import { useEffect, useState } from "react";

import { todayISO } from "@/lib/date";

/**
 * A card is editable only on the day it was assigned to. Once midnight
 * passes, the card locks. Re-evaluates every minute so the lock flips
 * automatically as the day rolls over.
 */
export function useEditableCard(cardDate: string): boolean {
  const [today, setToday] = useState(() => todayISO());

  useEffect(() => {
    const id = setInterval(() => {
      const next = todayISO();
      setToday((prev) => (prev === next ? prev : next));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return cardDate === today;
}
