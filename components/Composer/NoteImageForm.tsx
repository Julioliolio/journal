"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebHaptics } from "web-haptics/react";

import {
  createImageAction,
  createNoteImageAction,
} from "@/app/actions/cards";
import { uploadImageAction } from "@/app/actions/upload";
import { processImage, IMAGE_ACCEPT_ATTR } from "@/lib/image";
import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";
import { useSubmitMorph } from "@/lib/hooks/useSubmitMorph";
import type { PickerSelection } from "@/lib/giphy-types";

import { GiphyPicker } from "./GiphyPicker";

type Status = "idle" | "processing" | "uploading";

const STATUS_LABEL: Record<Status, string> = {
  idle: "save",
  processing: "compressing",
  uploading: "uploading",
};

export function NoteImageForm({
  today,
  onDone,
}: {
  today: string;
  onDone: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [giphyUrl, setGiphyUrl] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const { saved, flash } = useSubmitMorph();
  const qc = useQueryClient();
  const haptic = useWebHaptics();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!file && !giphyUrl) {
      setError("Pick an image first.");
      return;
    }
    // Fire synchronously inside the gesture handler — Firefox Android and
    // iOS Safari both drop the haptic if it lands after an await.
    haptic.trigger("medium");
    try {
      let url: string;
      if (giphyUrl) {
        url = giphyUrl;
      } else {
        setStatus("processing");
        const processed = await processImage(file!);
        setStatus("uploading");
        const uploadFd = new FormData();
        uploadFd.set("file", processed);
        url = await uploadImageAction(uploadFd);
      }

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
      // Run the flash hold and the refetch in parallel, then close.
      // Awaiting invalidateQueries ensures the just-saved card is in
      // the cache (and rendered in the day stack) by the time the form
      // unmounts — no empty gap between form-close and card-in.
      await Promise.all([
        flash(),
        qc.invalidateQueries({ queryKey: ["canvas"] }),
      ]);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setStatus("idle");
    }
  }

  const busy = status !== "idle" || saved;
  const saveLabel = saved ? "✓" : STATUS_LABEL[status];
  const hasMedia = Boolean(file || giphyUrl);

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
              <>choose image</>
            )}
          </label>
          <button
            type="button"
            className="file-pill"
            disabled={busy}
            onClick={() => setPickerOpen(true)}
          >
            search GIPHY
          </button>
        </div>
      )}
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
          disabled={busy || !hasMedia}
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
