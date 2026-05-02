"use client";

import { useRef, useState } from "react";

import { processMedia, isVideoUrl, MEDIA_ACCEPT_ATTR } from "@/lib/image";
import type { PickerSelection } from "@/lib/giphy-types";

import { GiphyPicker } from "./GiphyPicker";

export function FeltImagePicker({
  url,
  onChange,
  disabled,
}: {
  /** Currently-selected media URL (object URL for local files, embed URL for Giphy), or null. */
  url: string | null;
  /** Called with the preview URL and the raw File (null for Giphy/clear). */
  onChange: (url: string | null, file?: File | null) => void;
  disabled?: boolean;
}) {
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track the object URL we created so we can revoke it on replacement/unmount.
  const objectUrlRef = useRef<string | null>(null);

  async function handlePick(file: File) {
    setError(null);
    setCompressing(true);
    try {
      const processed = await processMedia(file);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const preview = URL.createObjectURL(processed);
      objectUrlRef.current = preview;
      onChange(preview, processed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed.");
    } finally {
      setCompressing(false);
    }
  }

  function clear() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    onChange(null, null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function pickFromGiphy(picked: PickerSelection) {
    if (picked.kind !== "gif") return;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    onChange(picked.embedUrl, null);
    setPickerOpen(false);
  }

  const busy = compressing;
  const label = busy
    ? "compressing…"
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
