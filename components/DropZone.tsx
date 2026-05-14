"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { createImageAction } from "@/app/actions/cards";
import { processMedia } from "@/lib/image";
import { invalidateCanvas } from "@/lib/queries";

type Status =
  | { kind: "idle" }
  | { kind: "drag" }
  | { kind: "processing"; percent: number }
  | { kind: "uploading" }
  | { kind: "error"; message: string };

export type UploadState = {
  /** Stage label shown next to the bar. */
  stage: "compressing" | "uploading";
  /** 0–100 progress for the compression step; null while uploading
   *  (we don't get progress events from the server action — the bar
   *  fills to 100% on stage transition). */
  percent: number | null;
};

/** State of a drop-initiated upload, or null when idle. The today
 *  day-card subscribes to this so it can render an optimistic
 *  placeholder card while the file is compressing / uploading — without
 *  it the user just sees a long pause between the drop and the new card
 *  showing up. */
const UploadInFlightContext = createContext<UploadState | null>(null);

export function useUploadInFlight(): UploadState | null {
  return useContext(UploadInFlightContext);
}

export function DropZone({
  today,
  children,
}: {
  today: string;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const dragDepth = useRef(0);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const ingest = useCallback(
    async (file: File) => {
      try {
        setStatus({ kind: "processing", percent: 0 });
        const processed = await processMedia(file, (percent) => {
          setStatus({ kind: "processing", percent });
        });
        setStatus({ kind: "uploading" });
        const createFd = new FormData();
        createFd.set("date", today);
        createFd.set("clientToday", today);
        createFd.set("imageFile", processed);
        const result = await createImageAction(createFd);
        if (result?.error) throw new Error(result.error);
        // Hold the "uploading…" indicator until the new card is in cache
        // so it doesn't disappear before the card pops in.
        await invalidateCanvas(qc);
        setStatus({ kind: "idle" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed.";
        setStatus({ kind: "error", message });
        setTimeout(() => setStatus({ kind: "idle" }), 3000);
      }
    },
    [today, qc],
  );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const handler = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (
          item.kind === "file" &&
          (item.type.startsWith("image/") || item.type.startsWith("video/"))
        ) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            void ingest(file);
            return;
          }
        }
      }
    };
    node.addEventListener("paste", handler);
    return () => node.removeEventListener("paste", handler);
  }, [ingest]);

  const showStatusBar =
    status.kind === "processing" ||
    status.kind === "uploading" ||
    status.kind === "error";

  const uploadState: UploadState | null =
    status.kind === "processing"
      ? { stage: "compressing", percent: status.percent }
      : status.kind === "uploading"
        ? { stage: "uploading", percent: null }
        : null;

  return (
    <div
      ref={ref}
      tabIndex={0}
      className="dropzone-wrap"
      data-upload={showStatusBar ? "active" : undefined}
      onDragEnter={(event) => {
        if (event.dataTransfer?.types.includes("Files")) {
          event.preventDefault();
          dragDepth.current += 1;
          setStatus({ kind: "drag" });
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
        if (dragDepth.current === 0 && status.kind === "drag") {
          setStatus({ kind: "idle" });
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragDepth.current = 0;
        const file = event.dataTransfer?.files?.[0];
        if (file) void ingest(file);
        else setStatus({ kind: "idle" });
      }}
    >
      <UploadInFlightContext.Provider value={uploadState}>
        {children}
      </UploadInFlightContext.Provider>

      {status.kind === "drag" && (
        <div className="dropzone-overlay" aria-hidden="true">
          <span className="dropzone-overlay-text">drop media to add</span>
        </div>
      )}
      {status.kind === "error" && (
        <div className="dropzone-status dropzone-error">
          {status.message}
        </div>
      )}
    </div>
  );
}
