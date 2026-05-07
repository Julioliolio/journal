"use client";

import { useEffect, useState } from "react";

import { todayISO } from "@/lib/date";

export function useTodayTick(): string {
  const [today, setToday] = useState(() => todayISO());
  useEffect(() => {
    const id = setInterval(() => {
      setToday((prev) => {
        const next = todayISO();
        return next === prev ? prev : next;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);
  return today;
}
