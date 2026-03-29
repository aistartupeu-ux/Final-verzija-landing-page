/**
 * Giveaway (/giveaway), lead magnet (/free-guide) i /promo/* varijante.
 *
 * Na produkciji su podrazumevano isključene (redirect na početnu + API 403).
 * Kad budu gotove: NEXT_PUBLIC_PROMO_LANDING_PAGES=true na hostu (Vercel env).
 *
 * Lokalno (`next dev`) stranice ostaju dostupne radi razvoja.
 */
export function arePromoLandingPagesEnabled(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const v = process.env.NEXT_PUBLIC_PROMO_LANDING_PAGES?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/** Putanje koje middleware šalje na / kad su promo stranice isključene. */
export function isPromoLandingPath(pathname: string): boolean {
  if (pathname === "/giveaway" || pathname === "/free-guide") return true;
  if (pathname.startsWith("/promo/giveaway-10-mesta")) return true;
  if (pathname.startsWith("/promo/lead-magnet")) return true;
  return false;
}
