"use client";

import { useEffect } from "react";

/**
 * Calls `onClose` when Escape is pressed. Listens in capture phase so
 * nested modals (eg the GIPHY picker rendered from inside a card editor)
 * close themselves before the parent sees the key.
 */
export function useEscapeKey(onClose: () => void): void {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);
}
