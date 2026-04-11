import { getLeadsFromSheet, type LeadsSourceRow } from "@/lib/leads-sheet";

/**
 * Google Sheets API vuče cele tabove; kako dokument raste, svaki admin refresh je sporiji.
 * Kratak TTL keš (po Node instanci) smanjuje wall-clock bez `unstable_cache` u Route Handler-u —
 * na Vercelu je `next/cache` u nekim verzijama problematičan za ove pozive.
 *
 * ADMIN_ANALYTICS_SHEET_CACHE_SECONDS: podrazumevano 30; 0 ili negativno = bez keša.
 */
function sheetCacheRevalidateSeconds(): number {
  const raw = process.env.ADMIN_ANALYTICS_SHEET_CACHE_SECONDS;
  if (raw == null || String(raw).trim() === "") return 30;
  const n = Number.parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(600, Math.max(5, n));
}

type SheetCacheEntry = { storedAtMs: number; rows: LeadsSourceRow[] };

let memoryCache: SheetCacheEntry | null = null;

export async function getLeadsFromSheetCachedForAdmin(): Promise<LeadsSourceRow[]> {
  const ttlSec = sheetCacheRevalidateSeconds();
  if (ttlSec <= 0) {
    return getLeadsFromSheet();
  }
  const ttlMs = ttlSec * 1000;
  const now = Date.now();
  if (memoryCache !== null && now - memoryCache.storedAtMs < ttlMs) {
    return memoryCache.rows;
  }
  const rows = await getLeadsFromSheet();
  memoryCache = { storedAtMs: now, rows };
  return rows;
}
