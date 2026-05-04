"use client";

import { useState } from "react";

import type { CardType } from "@/lib/db/schema";

import { NoteForm } from "./NoteForm";
import { ReflectionForm } from "./ReflectionForm";

export function Composer({
  today,
  reflectionExists,
}: {
  today: string;
  reflectionExists: boolean;
}) {
  const [type, setType] = useState<CardType | null>(null);

  if (!type) {
    return (
      <div className="composer-slot">
        <div className="composer-pills">
          <button
            type="button"
            className="pill pill-bouncy"
            onClick={() => setType("note")}
          >
            + note
          </button>
          {!reflectionExists && (
            <button
              type="button"
              className="pill pill-bouncy"
              onClick={() => setType("reflection")}
            >
              + reflection
            </button>
          )}
        </div>
      </div>
    );
  }

  const close = () => setType(null);

  return (
    <div style={{ marginBottom: 12 }}>
      {(type === "note" || type === "note_image" || type === "image") && (
        <NoteForm today={today} onDone={close} />
      )}
      {type === "reflection" && (
        <ReflectionForm today={today} onDone={close} />
      )}
    </div>
  );
}
