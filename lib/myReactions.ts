const WINDOW_MS = 5 * 60 * 1000;

const expiries = new Map<string, number>();

export function trackMyReaction(id: string) {
  expiries.set(id, Date.now() + WINDOW_MS);
  setTimeout(() => expiries.delete(id), WINDOW_MS);
}

export function getMyReactionExpiry(id: string): number | undefined {
  return expiries.get(id);
}
