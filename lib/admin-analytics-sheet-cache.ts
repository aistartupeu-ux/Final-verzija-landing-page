import { unstable_cache } from "next/cache";
import { getLeadsFromSheet, type LeadsSourceRow } from "@/lib/leads-sheet";

/**
 * Google Sheets API uvek vuče cele tabove (List1+LM+GW); kako dokument raste, svaki admin refresh
 * postaje sporiji iako je Od–Do kratak. Kratak server keš drži wall-clock blizu starijeg ponašanja.
 *
 * ADMIN_ANALYTICS_SHEET_CACHE_SECONDS: podrazumevano 30; 0 ili negativno = bez keša (uvek svež Sheet).
 */
function sheetCacheRevalidateSeconds(): number {
  const raw = process.env.ADMIN_ANALYTICS_SHEET_CACHE_SECONDS;
  if (raw === undefined || raw.trim() === "") return 30;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(600, Math.max(5, n));
}

const SHEET_CACHE_REVALIDATE_SEC = sheetCacheRevalidateSeconds();

const getCachedLeadsFromSheet =
  SHEET_CACHE_REVALIDATE_SEC > 0
    ? unstable_cache(
        async () => getLeadsFromSheet(),
        ["admin-analytics-full-sheet-read-v1"],
        { revalidate: SHEET_CACHE_REVALIDATE_SEC }
      )
    : null;

export async function getLeadsFromSheetCachedForAdmin(): Promise<LeadsSourceRow[]> {
  if (!getCachedLeadsFromSheet) {
    return getLeadsFromSheet();
  }
  return getCachedLeadsFromSheet();
}
