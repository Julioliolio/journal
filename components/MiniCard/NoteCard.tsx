"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";
import { useSubmitMorph } from "@/lib/hooks/useSubmitMorph";
import type { Card } from "@/lib/db/schema";

import { EditMenu, useUpdateCard } from "./EditMenu";

export function NoteCard({
  card,
  isOwn,
  editable,
  isFresh = false,
}: {
  card: Card;
  isOwn: boolean;
  editable: boolean;
  isFresh?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateCard();
  const { saved, flash } = useSubmitMorph();

  if (editing) {
    return (
      <div className="card-shell card-light" data-fresh={isFresh || undefined}>
        <form
          className="edit-inline"
          action={async (fd) => {
            fd.set("id", card.id);
            await update(fd);
            await flash();
            setEditing(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setEditing(false);
            }
          }}
        >
          <AutoGrowTextarea
            name="text"
            className="edit-inline-textarea"
            defaultValue={card.text ?? ""}
            required
            autoFocus
            minRows={2}
          />
          <div className="compose-footer">
            <span className="compose-spacer" />
            <button
              type="button"
              className="pill pill-ghost"
              onClick={() => setEditing(false)}
              disabled={saved}
            >
              cancel
            </button>
            <button
              type="submit"
              className="pill pill-primary pill-bouncy"
              data-saved={saved || undefined}
              disabled={saved}
            >
              {saved ? "✓" : "save"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="card-shell card-light" data-fresh={isFresh || undefined}>
      <div className="markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {card.text ?? ""}
        </ReactMarkdown>
      </div>
      {isOwn && editable && (
        <EditMenu card={card} onEdit={() => setEditing(true)} />
      )}
    </div>
  );
}
