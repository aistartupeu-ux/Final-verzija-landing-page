/**
 * Legacy admin: Sheet redovi imaju često samo datum (bez sata).
 * Presek ADMIN_ANALYTICS_LEGACY_CUTOFF_ISO tumačimo u Europe/Belgrade.
 * Ako je vreme preseka tačno ponoć početka kalendarskog dana D, poslednji uključeni dan u Sheetu je D−1 (npr. presek 29.03. 00:00 → uključuje do 28.03.).
 */

const BEO = "Europe/Belgrade";

export function belgradeCalendarYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BEO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Izvlači YYYY-MM-DD iz Sheet ćelije (ili ISO stringa). */
export function extractYmdFromSheetDate(rowDate: string | undefined | null): string | null {
  if (rowDate == null) return null;
  const s = String(rowDate).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return belgradeCalendarYmd(d);
}

function belgradeTimeParts(d: Date): { h: number; m: number; s: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BEO,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const h = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const m = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  const s = parseInt(parts.find((p) => p.type === "second")?.value ?? "0", 10);
  return { h, m, s };
}

function ymdAddDays(ymd: string, delta: number): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d + delta));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Poslednji kalendarski dan (Beograd) čiji se ceo Sheet-datum još ubraja.
 * Ponoć prvog sledećeg dana = kraj prethodnog kalendarskog dana za date-only redove.
 */
export function lastInclusiveBelgradeYmdForLegacyCutoff(cutoff: Date): string {
  const ymd = belgradeCalendarYmd(cutoff);
  const { h, m, s } = belgradeTimeParts(cutoff);
  if (h === 0 && m === 0 && s === 0) {
    return ymdAddDays(ymd, -1);
  }
  return ymd;
}

/** Sheet red (samo YYYY-MM-DD): da li pada u legacy opseg do preseka. */
export function sheetRowYmdAllowedForLegacy(rowYmd: string, cutoff: Date): boolean {
  const last = lastInclusiveBelgradeYmdForLegacyCutoff(cutoff);
  return rowYmd <= last;
}

/** Period query Od–Do: poredi YMD stringove (inkluzivno). */
export function sheetRowYmdInPeriod(rowYmd: string, fromYmd: string | null, toYmd: string | null): boolean {
  if (fromYmd && rowYmd < fromYmd) return false;
  if (toYmd && rowYmd > toYmd) return false;
  return true;
}

export function queryParamToYmd(param: string | null): string | null {
  if (!param) return null;
  const m = param.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/**
 * UTC granice [startIso, endIso] koje odgovaraju celom kalendarskom danu `ymd` u Europe/Belgrade.
 * Koristi se za Supabase `created_at` filter da se poklopi sa Sheet YMD (ne koristiti `new Date("ymd")` — to je UTC ponoć).
 */
export function belgradeYmdUtcInclusiveBounds(ymd: string): { startIso: string; endIso: string } | null {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const lo = Date.UTC(y, mo - 1, d - 1, 0, 0, 0, 0);
  const hi = Date.UTC(y, mo - 1, d + 2, 23, 59, 59, 999);

  let firstMinute = -1;
  for (let t = lo; t <= hi; t += 60_000) {
    if (belgradeCalendarYmd(new Date(t)) === ymd) {
      firstMinute = t;
      break;
    }
  }
  if (firstMinute < 0) return null;

  let start = firstMinute;
  while (start > 0 && belgradeCalendarYmd(new Date(start - 1)) === ymd) {
    start -= 1;
  }

  let end = start;
  const endCap = start + 30 * 24 * 3600 * 1000;
  while (end < endCap && belgradeCalendarYmd(new Date(end + 1)) === ymd) {
    end += 1;
  }

  return { startIso: new Date(start).toISOString(), endIso: new Date(end).toISOString() };
}
