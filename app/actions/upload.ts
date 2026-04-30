"use server";

import { uploadImageBlob } from "@/lib/blob";
import { getCurrentUser } from "@/lib/cookies";

/**
 * Uploads a single image and returns its public URL.
 * Called from the client (Composer / DropZone / paste handler) before
 * createImage* actions are invoked.
 */
export async function uploadImageAction(formData: FormData): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided.");

  try {
    return await uploadImageBlob(file);
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    // Translate Vercel Blob's missing-token error to user-facing copy.
    if (/no token found/i.test(raw) || /BLOB_READ_WRITE_TOKEN/i.test(raw)) {
      throw new Error(
        "Image storage isn't configured. See README for setup.",
      );
    }
    throw new Error(raw);
  }
}
