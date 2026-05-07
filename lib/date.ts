import { differenceInHours, format, parseISO } from "date-fns";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Today as YYYY-MM-DD in the runtime's local time zone.
 * On the client this is the user's TZ; on the server it's the host's TZ
 * (only used as a loose validation bound — the source of truth is the
 * client-supplied date passed with each write).
 */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isISODate(value: unknown): value is string {
  return typeof value === "string" && ISO_DATE_RE.test(value);
}

/**
 * Mini-cards are editable for 24h after creation.
 */
export function isLocked24h(createdAt: Date, now: Date = new Date()): boolean {
  return differenceInHours(now, createdAt) >= 24;
}

/**
 * "TUE · APR 29" — small uppercase day-card header label.
 */
export function formatDayHeader(dateISO: string): string {
  const d = parseISO(dateISO);
  return `${format(d, "EEE")} · ${format(d, "MMM d")}`.toUpperCase();
}

/**
 * "9:42 pm" — small lowercase clock label for individual cards.
 */
export function formatCardTime(date: Date): string {
  return format(date, "h:mm aaa");
}

/**
 * Loose server-side bound: accepts dates within ±1 day of UTC today
 * (covers any TZ offset). Past-day backdating is rejected by also
 * requiring the date to equal the client-supplied `today` on creation.
 */
export function isWithinUtcDayBound(dateISO: string, now: Date = new Date()): boolean {
  if (!isISODate(dateISO)) return false;
  const utcToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const target = parseISO(dateISO);
  const diffMs = Math.abs(target.getTime() - utcToday.getTime());
  return diffMs <= 36 * 60 * 60 * 1000; // 36h on either side
}
