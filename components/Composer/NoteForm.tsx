"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebHaptics } from "web-haptics/react";

import {
  createImageAction,
  createNoteAction,
  createNoteImageAction,
} from "@/app/actions/cards";
import { processImage, IMAGE_ACCEPT_ATTR } from "@/lib/image";
import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";
import { useSubmitMorph } from "@/lib/hooks/useSubmitMorph";
import type { PickerSelection } from "@/lib/giphy-types";
import { invalidateCanvas } from "@/lib/queries";

import { GiphyPicker } from "./GiphyPicker";

type Status = "idle" | "processing" | "saving";

const STATUS_LABEL: Record<Status, string> = {
  idle: "save",
  processing: "compressing",
  saving: "saving",
};

export function NoteForm({
  today,
  onDone,
}: {
  today: string;
  onDone: () => void;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [giphyUrl, setGiphyUrl] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const { saved, flash } = useSubmitMorph();
  const qc = useQueryClient();
  const haptic = useWebHaptics();

  const busy = status !== "idle" || saved;
  const hasMedia = Boolean(file || giphyUrl);
  const note = text.trim();
  const canSave = hasMedia || note.length > 0;
  const saveLabel = saved ? "✓" : STATUS_LABEL[status];

  function pickFile(next: File | null) {
    setError(null);
    setFile(next);
    if (next) setGiphyUrl(null);
  }

  function pickFromGiphy(picked: PickerSelection) {
    if (picked.kind !== "gif") return;
    setError(null);
    setGiphyUrl(picked.embedUrl);
    setFile(null);
    setPickerOpen(false);
  }

  function clearMedia() {
    setError(null);
    setFile(null);
    setGiphyUrl(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!canSave) {
      setError("Add a note or image.");
      return;
    }
    // Fire synchronously inside the gesture handler — Firefox Android and
    // iOS Safari both drop the haptic if it lands after an await.
    haptic.trigger("medium");
    try {
      const fd = new FormData();
      fd.set("date", today);
      fd.set("clientToday", today);
      let result;
      if (hasMedia) {
        if (giphyUrl) {
          fd.set("imageUrl", giphyUrl);
        } else {
          setStatus("processing");
          const processed = await processImage(file!);
          fd.set("imageFile", processed);
        }
        setStatus("saving");
        if (note) {
          fd.set("text", note);
          result = await createNoteImageAction(fd);
        } else {
          result = await createImageAction(fd);
        }
      } else {
        setStatus("saving");
        fd.set("text", note);
        result = await createNoteAction(fd);
      }
      if (result?.error) throw new Error(result.error);
      // Run the flash hold and the refetch in parallel, then close.
      // Awaiting invalidateQueries ensures the just-saved card is in
      // the cache (and rendered in the day stack) by the time the form
      // unmounts — no empty gap between form-close and card-in.
      await Promise.all([flash(), invalidateCanvas(qc)]);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
      setStatus("idle");
    }
  }

  return (
    <form
      className="compose"
      onSubmit={submit}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !busy && !pickerOpen) {
          event.preventDefault();
          onDone();
        }
      }}
    >
      {giphyUrl ? (
        <div className="image-pick-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={giphyUrl} alt="" />
        </div>
      ) : (
        <div className="compose-row">
          <label className="file-pill">
            <input
              type="file"
              accept={IMAGE_ACCEPT_ATTR}
              disabled={busy}
              onChange={(event) =>
                pickFile(event.target.files?.[0] ?? null)
              }
            />
            {file ? (
              <span className="file-name">{file.name}</span>
            ) : (
              <>+ image</>
            )}
          </label>
          {!file && (
            <button
              type="button"
              className="file-pill"
              disabled={busy}
              onClick={() => setPickerOpen(true)}
            >
              + GIPHY
            </button>
          )}
        </div>
      )}
      {hasMedia && (
        <div className="compose-row">
          <button
            type="button"
            className="file-pill"
            onClick={clearMedia}
            disabled={busy}
          >
            remove image
          </button>
        </div>
      )}
      <AutoGrowTextarea
        className="compose-textarea"
        autoFocus
        minRows={2}
        placeholder="what happened today?"
        value={text}
        onChange={(event) => setText(event.target.value)}
        disabled={busy}
      />
      {error && <p className="compose-error">{error}</p>}
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
          data-pending={status !== "idle" || undefined}
          disabled={busy || !canSave}
        >
          {saveLabel}
        </button>
      </div>
      {pickerOpen && (
        <GiphyPicker
          defaultTab="gifs"
          onPicked={pickFromGiphy}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </form>
  );
}
