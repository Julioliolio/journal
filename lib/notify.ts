type Ctrl = ReadableStreamDefaultController<Uint8Array>;

const clients = new Set<Ctrl>();
const ping = new TextEncoder().encode("data: update\n\n");

export function subscribeToUpdates(ctrl: Ctrl): () => void {
  clients.add(ctrl);
  return () => clients.delete(ctrl);
}

export function notifyClients(): void {
  for (const ctrl of clients) {
    try {
      ctrl.enqueue(ping);
    } catch {
      clients.delete(ctrl);
    }
  }
}
