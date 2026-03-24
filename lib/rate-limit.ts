/**
 * Jednostavan in-memory rate limit po IP.
 * Koristi se za zaštitu API ruta od zloupotrebe.
 */
type RateEntry = { count: number; resetAt: number };
const rateMaps = new Map<string, Map<string, RateEntry>>();
const MAP_MAX_SIZE = 2000;

function getOrCreateMap(key: string): Map<string, RateEntry> {
  let m = rateMaps.get(key);
  if (!m) {
    m = new Map<string, RateEntry>();
    rateMaps.set(key, m);
  }
  return m;
}

function cleanup(map: Map<string, RateEntry>): void {
  if (map.size < MAP_MAX_SIZE) return;
  const now = Date.now();
  for (const [k, e] of map.entries()) {
    if (e.resetAt < now) map.delete(k);
  }
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export function isRateLimited(
  ip: string | null,
  options: RateLimitOptions
): boolean {
  if (!ip) return false;
  const mapKey = options.keyPrefix ?? "default";
  const map = getOrCreateMap(mapKey);
  cleanup(map);

  const now = Date.now();
  const current = map.get(ip);

  if (!current || current.resetAt < now) {
    map.set(ip, { count: 1, resetAt: now + options.windowMs });
    return false;
  }
  current.count += 1;
  return current.count > options.maxRequests;
}
