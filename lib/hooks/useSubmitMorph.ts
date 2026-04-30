"use client";

import { useCallback, useState } from "react";

/**
 * Adds a brief "saved ✓" confirmation morph to the end of a submit
 * flow. Call `flash()` after the action resolves but before closing
 * the form — it sets `saved=true`, waits `holdMs`, then resets.
 *
 * Use the `saved` flag to swap the button label and to set
 * `data-saved` on the submit pill so the CSS pop animation fires.
 */
export function useSubmitMorph(holdMs = 320) {
  const [saved, setSaved] = useState(false);
  const flash = useCallback(async () => {
    setSaved(true);
    await new Promise((resolve) => setTimeout(resolve, holdMs));
  }, [holdMs]);
  return { saved, flash };
}
