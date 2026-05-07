"use client";

import { type RefObject, useEffect } from "react";

/**
 * Closes a popover when the user clicks outside `ref`. No-op while
 * `open` is false so we don't keep a listener attached unnecessarily.
 */
export function useDismissOnOutsideClick(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
): void {
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      const node = ref.current;
      if (node && !node.contains(event.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [ref, open, onClose]);
}
