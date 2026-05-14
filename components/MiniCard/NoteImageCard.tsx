"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";
import { formatCardTime } from "@/lib/date";
import { useEscapeKey } from "@/lib/hooks/useEscapeKey";
import { useSubmitMorph } from "@/lib/hooks/useSubmitMorph";
import { isVideoUrl } from "@/lib/image";
import type { Card, Reaction } from "@/lib/db/schema";

import { EditMenu, useUpdateCard } from "./EditMenu";
import { Reactions } from "./Reactions";

export function NoteImageCard({
  card,
  reactions,
  isOwn,
  editable,
  isFresh = false,
}: {
  card: Card;
  reactions: Reaction[];
  isOwn: boolean;
  editable: boolean;
  isFresh?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [enlarged, setEnlarged] = useState(false);
  const update = useUpdateCard();
  const { saved, flash } = useSubmitMorph();

  if (editing) {
    return (
      <div className="card-shell card-image" data-fresh={isFresh || undefined}>
        {card.imageUrl &&
          (isVideoUrl(card.imageUrl) ? (
            <video
              src={card.imageUrl}
              controls
              preload="metadata"
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.imageUrl} alt="" loading="lazy" />
          ))}
        <form
          className="edit-inline"
          style={{ padding: "14px 18px 16px" }}
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
            placeholder="add a note (optional)…"
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

  const reactionsEl = (
    <Reactions
      cardId={card.id}
      reactions={reactions}
      canAdd={!isOwn || !editable}
    />
  );

  return (
    <div className="card-shell card-image" data-fresh={isFresh || undefined}>
      <div className="card-image-figure">
        {card.imageUrl &&
          (isVideoUrl(card.imageUrl) ? (
            <video
              src={card.imageUrl}
              controls
              preload="metadata"
              playsInline
            />
          ) : (
            <button
              type="button"
              className="card-image-zoom"
              onClick={(e) => {
                e.stopPropagation();
                setEnlarged(true);
              }}
              aria-label="enlarge image"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card.imageUrl} alt="" loading="lazy" />
            </button>
          ))}
        <time
          className="card-time card-time-overlay"
          dateTime={card.createdAt.toISOString()}
        >
          {formatCardTime(card.createdAt)}
        </time>
        {!card.text && (
          <div className="card-image-reactions-wrap">{reactionsEl}</div>
        )}
      </div>
      {card.text && (
        <div className="image-note">
          <div className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {card.text}
            </ReactMarkdown>
          </div>
          {reactionsEl}
        </div>
      )}
      {isOwn && editable && (
        <EditMenu card={card} onEdit={() => setEditing(true)} inset />
      )}
      {enlarged && card.imageUrl && (
        <ImagePreview src={card.imageUrl} onClose={() => setEnlarged(false)} />
      )}
    </div>
  );
}

function ImagePreview({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) {
  useEscapeKey(onClose);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="reaction-preview-modal"
      role="dialog"
      aria-modal="true"
      aria-label="enlarged image"
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="reaction-preview-img" src={src} alt="" />
    </div>,
    document.body,
  );
}
