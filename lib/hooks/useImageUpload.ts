"use client";

import { useCallback, useState } from "react";

import { uploadImageAction } from "@/app/actions/upload";
import { processMedia } from "@/lib/image";

export type ImageUploadStatus =
  | "idle"
  | "processing"
  | "uploading"
  | "error";

export function useImageUpload() {
  const [status, setStatus] = useState<ImageUploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      setError(null);
      setStatus("processing");
      try {
        const processed = await processMedia(file);
        setStatus("uploading");
        const fd = new FormData();
        fd.set("file", processed);
        const url = await uploadImageAction(fd);
        setStatus("idle");
        return url;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
        setStatus("error");
        return null;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  const busy = status === "processing" || status === "uploading";

  return { uploadFile, status, error, busy, reset };
}
