"use client";

import { useRef, useState } from "react";

import { useImageUpload } from "@/lib/hooks/useImageUpload";
import { isVideoUrl, MEDIA_ACCEPT_ATTR } from "@/lib/image";
import type { PickerSelection } from "@/lib/giphy-types";

import { GiphyPicker } from "./GiphyPicker";

export function FeltImagePicker({
  url,
  onChange,
  disabled,
}: {
  /** Currently-selected media URL, or null. Controlled by the parent. */
  url: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}) {
  const { uploadFile, status, error, busy } = useImageUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function handlePick(file: File) {
    const next = await uploadFile(file);
    if (next) onChange(next);
  }

  function clear() {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function pickFromGiphy(picked: PickerSelection) {
    if (picked.kind !== "gif") return;
    onChange(picked.embedUrl);
    setPickerOpen(false);
  }

  const label = busy
    ? status === "processing"
      ? "compressing…"
      : "uploading…"
    : url
      ? "replace"
      : "add media";

  return (
    <div className="felt-picker">
      {url && (
        <div className="felt-picker-preview">
          {isVideoUrl(url) ? (
            <video src={url} controls preload="metadata" playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" />
          )}
        </div>
      )}
      <div className="felt-picker-row">
        <label className="file-pill">
          <input
            ref={inputRef}
            type="file"
            accept={MEDIA_ACCEPT_ATTR}
            disabled={disabled || busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handlePick(file);
            }}
          />
          {label}
        </label>
        <button
          type="button"
          className="file-pill"
          disabled={disabled || busy}
          onClick={() => setPickerOpen(true)}
        >
          search GIPHY
        </button>
        {url && !busy && (
          <button
            type="button"
            className="pill pill-ghost"
            onClick={clear}
            disabled={disabled}
          >
            remove
          </button>
        )}
      </div>
      {error && <p className="compose-error">{error}</p>}
      {pickerOpen && (
        <GiphyPicker
          defaultTab="gifs"
          onPicked={pickFromGiphy}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
