"use client";

import { useRef, useState } from "react";

import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";
import { FeltImagePicker } from "@/components/Composer/FeltImagePicker";
import { useSubmitMorph } from "@/lib/hooks/useSubmitMorph";
import { isVideoUrl, processMedia } from "@/lib/image";
import { insertIntoNamedField } from "@/lib/insertText";
import type { Card, Reaction } from "@/lib/db/schema";

import { EditMenu, useUpdateCard } from "./EditMenu";
import { Reactions } from "./Reactions";

export function ReflectionCard({
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
  const [feltImageUrl, setFeltImageUrl] = useState<string | null>(
    card.reflectionFeltImageUrl,
  );
  const [feltFile, setFeltFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dropping, setDropping] = useState(false);
  const dragDepth = useRef(0);
  // Object URL created during drag-drop; revoke when replaced or on unmount.
  const dropObjectUrlRef = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const update = useUpdateCard();
  const { saved, flash } = useSubmitMorph();

  async function ingestDrop(file: File) {
    setDropping(true);
    try {
      const processed = await processMedia(file);
      if (dropObjectUrlRef.current) URL.revokeObjectURL(dropObjectUrlRef.current);
      const preview = URL.createObjectURL(processed);
      dropObjectUrlRef.current = preview;
      setFeltImageUrl(preview);
      setFeltFile(processed);
    } finally {
      setDropping(false);
    }
  }

  function resetDragState() {
    dragDepth.current = 0;
    setDragging(false);
  }

  if (editing) {
    return (
      <div
        className="card-shell card-dark felt-drop"
        data-fresh={isFresh || undefined}
        data-dragging={dragging || undefined}
        onDragEnter={(event) => {
          if (event.dataTransfer?.types.includes("Files")) {
            event.preventDefault();
            dragDepth.current += 1;
            setDragging(true);
          }
        }}
        onDragOver={(event) => {
          if (event.dataTransfer?.types.includes("Files")) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }
        }}
        onDragLeave={() => {
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          resetDragState();
          const file = event.dataTransfer?.files?.[0];
          if (file) void ingestDrop(file);
        }}
      >
        <form
          ref={formRef}
          className="edit-inline"
          action={async (fd) => {
            fd.set("id", card.id);
            if (feltFile) fd.set("feltImageFile", feltFile);
            else if (feltImageUrl) fd.set("feltImageUrl", feltImageUrl);
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
          <Field
            name="did"
            label="did"
            defaultValue={card.reflectionDid ?? ""}
          />
          <Field
            name="learned"
            label="learned"
            defaultValue={card.reflectionLearned ?? ""}
          />
          <Field
            name="felt"
            label="felt"
            defaultValue={card.reflectionFelt ?? ""}
          >
            <FeltImagePicker
              url={feltImageUrl}
              onChange={(url, file) => {
                if (dropObjectUrlRef.current) {
                  URL.revokeObjectURL(dropObjectUrlRef.current);
                  dropObjectUrlRef.current = null;
                }
                setFeltImageUrl(url);
                setFeltFile(file ?? null);
              }}
              onEmojiPick={(emoji) =>
                insertIntoNamedField(formRef.current, "felt", emoji)
              }
              disabled={saved || dropping}
            />
          </Field>
          <div className="compose-footer">
            <span className="compose-spacer" />
            <button
              type="button"
              className="pill pill-ghost"
              onClick={() => {
                setFeltImageUrl(card.reflectionFeltImageUrl);
                setFeltFile(null);
                setEditing(false);
              }}
              disabled={saved}
            >
              cancel
            </button>
            <button
              type="submit"
              className="pill pill-primary pill-bouncy"
              data-saved={saved || undefined}
              disabled={saved || dropping}
            >
              {saved ? "✓" : "save"}
            </button>
          </div>
        </form>

        {dragging && (
          <div className="felt-drop-overlay" aria-hidden="true">
            <span className="felt-drop-overlay-text">drop to set felt image</span>
          </div>
        )}
        {dropping && (
          <div className="felt-drop-status">
            compressing…
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card-shell card-dark" data-fresh={isFresh || undefined}>
      <Section label="did" value={card.reflectionDid} />
      <Section label="learned" value={card.reflectionLearned} />
      <Section
        label="felt"
        value={card.reflectionFelt}
        imageUrl={card.reflectionFeltImageUrl}
      />
      <Reactions
        cardId={card.id}
        reactions={reactions}
        canAdd={!isOwn || !editable}
      />
      {isOwn && editable && (
        <EditMenu card={card} onEdit={() => setEditing(true)} />
      )}
    </div>
  );
}

function Section({
  label,
  value,
  imageUrl,
}: {
  label: string;
  value: string | null;
  imageUrl?: string | null;
}) {
  if (!value && !imageUrl) return null;
  return (
    <div className="reflection-section">
      <div className="reflection-label">{label}</div>
      {value && <div className="reflection-body">{value}</div>}
      {imageUrl && (
        <div className="reflection-image">
          {isVideoUrl(imageUrl) ? (
            <video src={imageUrl} controls preload="metadata" playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" loading="lazy" />
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  children,
}: {
  name: string;
  label: string;
  defaultValue: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="reflection-section">
      <div className="reflection-label">{label}</div>
      <AutoGrowTextarea
        name={name}
        className="edit-inline-textarea"
        defaultValue={defaultValue}
        minRows={1}
      />
      {children}
    </div>
  );
}
