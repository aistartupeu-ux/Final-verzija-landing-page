/**
 * Oznake za lead magnet (free-guide / promo LM).
 * - Supabase / kolona E u Sheet-u: oba taga (čist LM vs LM + affiliate).
 * - Google Sheet **tab LM**: samo `lead_magnet` (bez affiliate). Sa affiliate → Лист1.
 */

export const SOURCE_TAG_LEAD_MAGNET = "lead_magnet";
/** Ista LM stranica + affiliate; upis u glavni list (Лист1), ne u LM tab. */
export const SOURCE_TAG_LEAD_MAGNET_AFFILIATE = "lead_magnet_affiliate";

export function isLeadMagnetSourceTag(tag: string | null | undefined): boolean {
  const t = String(tag ?? "").trim().toLowerCase();
  return t === SOURCE_TAG_LEAD_MAGNET || t === SOURCE_TAG_LEAD_MAGNET_AFFILIATE;
}

/** Samo čist LM (bez affiliate_code u toku) → poseban Sheet tab LM. */
export function usesLeadMagnetSheetTab(tag: string | null | undefined): boolean {
  return String(tag ?? "").trim().toLowerCase() === SOURCE_TAG_LEAD_MAGNET;
}
