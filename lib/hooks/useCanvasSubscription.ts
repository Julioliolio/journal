"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { invalidateCanvas } from "@/lib/queries";

/**
 * Tail the SSE stream for live updates. Refetches once on the initial
 * connect retry too, so writes that landed during a brief disconnect
 * still surface.
 */
export function useCanvasSubscription({
  refetchOnReconnect = false,
}: { refetchOnReconnect?: boolean } = {}): void {
  const qc = useQueryClient();
  useEffect(() => {
    const es = new EventSource("/api/events");
    const refetch = () => invalidateCanvas(qc);
    es.onmessage = refetch;
    if (refetchOnReconnect) {
      let connected = false;
      es.onopen = () => {
        if (connected) refetch();
        connected = true;
      };
    }
    return () => es.close();
  }, [qc, refetchOnReconnect]);
}
