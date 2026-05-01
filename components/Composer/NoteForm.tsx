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
        startTransition(async () => {
          try {
            await createNoteAction(fd);
            qc.invalidateQueries({ queryKey: ["canvas"] });
            haptic.trigger("success");
            await flash();
            onDone();
          } catch {
            haptic.trigger("error");
          }
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
