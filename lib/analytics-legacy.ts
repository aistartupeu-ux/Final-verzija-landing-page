const BEO = "Europe/Belgrade";

export function belgradeCalendarYmd(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BEO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

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

export function lastInclusiveBelgradeYmdForLegacyCutoff(cutoff: Date): string {
  const ymd = belgradeCalendarYmd(cutoff);
  const { h, m, s } = belgradeTimeParts(cutoff);
  if (h === 0 && m === 0 && s === 0) {
    return ymdAddDays(ymd, -1);
  }
  return ymd;
}

export function sheetRowYmdAllowedForLegacy(rowYmd: string, cutoff: Date): boolean {
  const last = lastInclusiveBelgradeYmdForLegacyCutoff(cutoff);
  return rowYmd <= last;
}

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

  let a = lo;
  let b = hi;
  while (a < b) {
    const mid = Math.floor((a + b) / 2);
    if (ymdAtUtcMs(mid) < ymd) a = mid + 1;
    else b = mid;
  }
  if (ymdAtUtcMs(a) !== ymd) return null;

  let sLo = a - 3 * 86400000;
  let sHi = a;
  while (sLo < sHi) {
    const mid = Math.floor((sLo + sHi) / 2);
    if (ymdAtUtcMs(mid) === ymd) sHi = mid;
    else sLo = mid + 1;
  }
  const start = sLo;

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
