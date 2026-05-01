"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { createImageAction } from "@/app/actions/cards";
import { uploadImageAction } from "@/app/actions/upload";
import { processImage } from "@/lib/image";

type Status =
  | { kind: "idle" }
  | { kind: "drag" }
  | { kind: "processing" }
  | { kind: "uploading" }
  | { kind: "error"; message: string };

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

  async function ingest(file: File) {
    try {
      setStatus({ kind: "processing" });
      const processed = await processImage(file);
      setStatus({ kind: "uploading" });
      const uploadFd = new FormData();
      uploadFd.set("file", processed);
      const url = await uploadImageAction(uploadFd);
      const createFd = new FormData();
      createFd.set("date", today);
      createFd.set("clientToday", today);
      createFd.set("imageUrl", url);
      await createImageAction(createFd);
      qc.invalidateQueries({ queryKey: ["canvas"] });
      setStatus({ kind: "idle" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setStatus({ kind: "error", message });
      setTimeout(() => setStatus({ kind: "idle" }), 3000);
    }
  }

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const handler = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  return (
    <div
      ref={ref}
      tabIndex={0}
      className="dropzone-wrap"
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
      {children}

      {status.kind === "drag" && (
        <div className="dropzone-overlay" aria-hidden="true">
          <span className="dropzone-overlay-text">drop image to add</span>
        </div>
      )}
      {status.kind === "processing" && (
        <div className="dropzone-status" data-progress="processing">
          compressing image…
        </div>
      )}
      {status.kind === "uploading" && (
        <div className="dropzone-status" data-progress="uploading">
          uploading…
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
