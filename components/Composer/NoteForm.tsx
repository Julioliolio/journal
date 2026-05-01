"use client";

import { useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebHaptics } from "web-haptics/react";

import { createNoteAction } from "@/app/actions/cards";
import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";
import { useSubmitMorph } from "@/lib/hooks/useSubmitMorph";

export function NoteForm({
  today,
  onDone,
}: {
  today: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const { saved, flash } = useSubmitMorph();
  const qc = useQueryClient();
  const haptic = useWebHaptics();
  const busy = pending || saved;

  return (
    <form
      className="compose"
      action={(fd) => {
        fd.set("date", today);
        fd.set("clientToday", today);
        // Fire synchronously inside the gesture handler — Firefox Android
        // and iOS Safari both drop the haptic if it lands after an await.
        haptic.trigger("medium");
        startTransition(async () => {
          await createNoteAction(fd);
          // Run the flash hold and the refetch in parallel, then close.
          // Awaiting invalidateQueries ensures the just-saved card is in
          // the cache (and rendered in the day stack) by the time the
          // form unmounts — no empty gap between form-close and card-in.
          await Promise.all([
            flash(),
            qc.invalidateQueries({ queryKey: ["canvas"] }),
          ]);
          onDone();
        });
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !busy) {
          event.preventDefault();
          onDone();
        }
      }}
    >
      <AutoGrowTextarea
        name="text"
        className="compose-textarea"
        autoFocus
        required
        minRows={2}
        placeholder="what happened today?"
      />
      <div className="compose-footer">
        <span className="compose-spacer" />
        <button
          type="button"
          className="pill pill-ghost"
          onClick={onDone}
          disabled={busy}
        >
          cancel
        </button>
        <button
          type="submit"
          className="pill pill-primary pill-bouncy"
          data-saved={saved || undefined}
          disabled={busy}
        >
          {saved ? "✓" : pending ? "saving" : "save"}
        </button>
      </div>
    </form>
  );
}
