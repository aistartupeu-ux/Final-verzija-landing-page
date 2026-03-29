/** Uklanja nevidljive razmake/BOM iz .env (čest uzrok neusklađenosti tokena). */
export function getAdminAnalyticsSecret(): string | undefined {
  const s = process.env.ADMIN_ANALYTICS_SECRET;
  if (typeof s !== "string") return undefined;
  const t = s.trim();
  return t.length > 0 ? t : undefined;
}
