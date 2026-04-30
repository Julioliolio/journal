"use client";

import { useState } from "react";

import type { CardType } from "@/lib/db/schema";

import { NoteForm } from "./NoteForm";
import { NoteImageForm } from "./NoteImageForm";
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
          <button
            type="button"
            className="pill pill-bouncy"
            onClick={() => setType("note_image")}
          >
            + image
          </button>
          <button
            type="button"
            className="pill pill-bouncy"
            onClick={() => setType("reflection")}
            disabled={reflectionExists}
            title={reflectionExists ? "already added today" : undefined}
          >
            + reflection
          </button>
        </div>
      </div>
    );
  }

  const close = () => setType(null);

  return (
    <div style={{ marginBottom: 12 }}>
      {type === "note" && <NoteForm today={today} onDone={close} />}
      {type === "note_image" && (
        <NoteImageForm today={today} onDone={close} />
      )}
      {type === "reflection" && (
        <ReflectionForm today={today} onDone={close} />
      )}
    </div>
  );
}
