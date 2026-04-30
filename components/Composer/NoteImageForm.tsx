"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  createImageAction,
  createNoteImageAction,
} from "@/app/actions/cards";
import { uploadImageAction } from "@/app/actions/upload";
import { processImage, UnsupportedImageTypeError } from "@/lib/image";
import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";
import { useSubmitMorph } from "@/lib/hooks/useSubmitMorph";

type Status = "idle" | "processing" | "uploading";

export function NoteImageForm({
  today,
  onDone,
}: {
  today: string;
  onDone: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const { saved, flash } = useSubmitMorph();
  const qc = useQueryClient();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!file) {
      setError("Pick an image first.");
      return;
    }
    try {
      setStatus("processing");
      const processed = await processImage(file);
      setStatus("uploading");
      const uploadFd = new FormData();
      uploadFd.set("file", processed);
      const url = await uploadImageAction(uploadFd);

      const createFd = new FormData();
      createFd.set("date", today);
      createFd.set("clientToday", today);
      createFd.set("imageUrl", url);
      const note = text.trim();
      if (note) {
        createFd.set("text", note);
        await createNoteImageAction(createFd);
      } else {
        await createImageAction(createFd);
      }
      qc.invalidateQueries({ queryKey: ["canvas"] });
      await flash();
      onDone();
    } catch (err) {
      const message =
        err instanceof UnsupportedImageTypeError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Upload failed.";
      setError(message);
      setStatus("idle");
    }
  }

  const busy = status !== "idle" || saved;
  const saveLabel = saved
    ? "✓"
    : status === "processing"
      ? "compressing"
      : status === "uploading"
        ? "uploading"
        : "save";

  return (
    <form
      className="compose"
      onSubmit={submit}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !busy) {
          event.preventDefault();
          onDone();
        }
      }}
    >
      <label className="file-pill">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          required
          disabled={busy}
          onChange={(event) => {
            setError(null);
            setFile(event.target.files?.[0] ?? null);
          }}
        />
        {file ? (
          <span className="file-name">{file.name}</span>
        ) : (
          <>choose image</>
        )}
      </label>
      <AutoGrowTextarea
        className="compose-textarea"
        placeholder="and a note (optional)…"
        value={text}
        onChange={(event) => setText(event.target.value)}
        disabled={busy}
        minRows={2}
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
          disabled={busy || !file}
        >
          {saveLabel}
        </button>
      </div>
    </form>
  );
}
