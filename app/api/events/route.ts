export const dynamic = "force-dynamic";

import { subscribeToUpdates } from "@/lib/notify";

const encoder = new TextEncoder();

export async function GET(request: Request) {
  let unsubscribe: (() => void) | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));
      unsubscribe = subscribeToUpdates(controller);
    },
    cancel() {
      unsubscribe?.();
    },
  });

  request.signal.addEventListener("abort", () => unsubscribe?.());

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
