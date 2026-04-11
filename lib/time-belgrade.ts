/** Sva „ljudska“ vremena za Sheets / webhook / prikaz — Europe/Belgrade. */

export const EUROPE_BELGRADE = "Europe/Belgrade";

/**
 * Datum i vreme u Beogradu, pogodno za Google Sheet (kolona A) i logove.
 * Primer: "2026-04-10 23:45:12"
 */
export function formatBelgradeDateTime(d: Date = new Date()): string {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: EUROPE_BELGRADE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const hms = new Intl.DateTimeFormat("en-GB", {
    timeZone: EUROPE_BELGRADE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
  return `${ymd} ${hms}`;
}

/** Samo kalendar datum u Beogradu (YYYY-MM-DD). */
export function formatBelgradeDateOnly(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: EUROPE_BELGRADE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
