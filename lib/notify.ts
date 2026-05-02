type Ctrl = ReadableStreamDefaultController<Uint8Array>;

// globalThis ensures one shared Set across all module evaluations (Next.js
// can re-evaluate modules in dev mode, which would otherwise give server
// actions and the SSE route handler separate empty Sets).
declare global {
  var __sseClients: Set<Ctrl> | undefined;
}
const clients: Set<Ctrl> = (globalThis.__sseClients ??= new Set());

export function subscribeToUpdates(ctrl: Ctrl): () => void {
  clients.add(ctrl);
  return () => clients.delete(ctrl);
}

export function notifyClients(): void {
  const ping = new TextEncoder().encode("data: update\n\n");
  for (const ctrl of clients) {
    try {
      ctrl.enqueue(ping);
    } catch {
      clients.delete(ctrl);
    }
  }
}
