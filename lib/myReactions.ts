const WINDOW_MS = 5 * 60 * 1000;

const expiries = new Map<string, number>();

export function trackMyReaction(id: string) {
  expiries.set(id, Date.now() + WINDOW_MS);
}

export function getMyReactionExpiry(id: string): number | undefined {
  const exp = expiries.get(id);
  if (exp === undefined) return undefined;
  if (exp <= Date.now()) {
    expiries.delete(id);
    return undefined;
  }
  return exp;
}
