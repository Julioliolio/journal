"use client";

import { useState } from "react";

import { NoteForm } from "./NoteForm";
import { ReflectionForm } from "./ReflectionForm";

type Mode = "note" | "reflection";

export function Composer({
  today,
  reflectionExists,
}: {
  today: string;
  reflectionExists: boolean;
}) {
  const [mode, setMode] = useState<Mode | null>(null);

  if (!mode) {
    return (
      <div className="composer-slot">
        <div className="composer-pills">
          <button
            type="button"
            className="pill pill-bouncy"
            onClick={() => setMode("note")}
          >
            + note
          </button>
          {!reflectionExists && (
            <button
              type="button"
              className="pill pill-bouncy"
              onClick={() => setMode("reflection")}
            >
              + reflection
            </button>
          )}
        </div>
      </div>
    );
  }

  const close = () => setMode(null);
  const Form = mode === "note" ? NoteForm : ReflectionForm;
  return (
    <div className="composer-active">
      <Form today={today} onDone={close} />
    </div>
  );
}
