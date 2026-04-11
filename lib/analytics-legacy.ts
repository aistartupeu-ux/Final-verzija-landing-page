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

/**
 * Sheet red (samo YYYY-MM-DD): da li pada u legacy opseg do preseka.
 * Ne pozivati unutar velike petlje — `lastInclusiveBelgradeYmdForLegacyCutoff` zove Intl; izračunaj `last` jednom pa poredi `rowYmd <= last`.
 */
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
 *
 * Stara verzija je nakon pronalaženja dana išla unazad/unapred po **1 ms** (do ~86M Intl poziva po danu) —
 * to je moglo potpuno da zakoci `/api/admin/analytics` pre Sheet/Supabase poziva.
 */
export function belgradeYmdUtcInclusiveBounds(ymd: string): { startIso: string; endIso: string } | null {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);

  const ymdAtUtcMs = (t: number) => belgradeCalendarYmd(new Date(t));

  let lo = Date.UTC(y, mo - 1, d - 10, 12, 0, 0, 0);
  let hi = Date.UTC(y, mo - 1, d + 10, 12, 0, 0, 0);
  while (ymdAtUtcMs(hi) < ymd) hi += 5 * 86400000;
  while (ymdAtUtcMs(lo) > ymd) lo -= 5 * 86400000;
  if (ymdAtUtcMs(hi) < ymd || ymdAtUtcMs(lo) > ymd) return null;

  // Najmanji UTC ms gde je kalendar u Beogradu već `ymd`
  let a = lo;
  let b = hi;
  while (a < b) {
    const mid = Math.floor((a + b) / 2);
    if (ymdAtUtcMs(mid) < ymd) a = mid + 1;
    else b = mid;
  }
  if (ymdAtUtcMs(a) !== ymd) return null;

  // Prvi ms tog kalendarskog dana (granica prethodnog dana → ymd)
  let sLo = a - 3 * 86400000;
  let sHi = a;
  while (sLo < sHi) {
    const mid = Math.floor((sLo + sHi) / 2);
    if (ymdAtUtcMs(mid) === ymd) sHi = mid;
    else sLo = mid + 1;
  }
  const start = sLo;

  // Poslednji ms tog kalendarskog dana (do ~50h zbog letnjeg/zimskog vremena)
  let eLo = start;
  let eHi = start + 50 * 3600000;
  while (eLo < eHi) {
    const mid = eLo + Math.ceil((eHi - eLo) / 2);
    if (ymdAtUtcMs(mid) === ymd) eLo = mid;
    else eHi = mid - 1;
  }
  const end = eLo;

  return { startIso: new Date(start).toISOString(), endIso: new Date(end).toISOString() };
}
