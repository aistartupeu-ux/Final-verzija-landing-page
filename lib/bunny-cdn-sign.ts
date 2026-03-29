import "server-only";
import crypto from "node:crypto";
import { getCdnMediaUrl } from "@/lib/cdn-media";

/**
 * Bunny CDN token URL (Pull Zone → Security → Token Authentication).
 * @see https://docs.bunny.net/docs/cdn-token-authentication-basic (MD5)
 * @see https://docs.bunny.net/cdn/security/token-authentication/advanced (SHA256)
 *
 * Podrazumevano: MD5 (Basic). Ako videi ne rade (403): na Vercel dodaj
 * `BUNNY_CDN_TOKEN_HASH=sha256` (Advanced sa praznim IP i bez token_path — isti string key+path+expires).
 *
 * `BUNNY_CDN_TOKEN_KEY` — isti kao URL Token Authentication Key u Bunny-ju.
 * `NEXT_PUBLIC_BUNNY_VIDEO_BASE_URL` — mora biti postavljen da bi se uopšte potpisivalo.
 */
function base64UrlToken(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * @param cacheBust Opcioni sufiks `&v=...` — drugačiji URL = novi keš kod CDN/pregledača kad zameniš istoimeni fajl na Bunny-ju.
 */
export function getServerCdnUrl(path: string, ttlSeconds?: number, cacheBust?: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const signingOff =
    process.env.BUNNY_CDN_SIGNING === "0" || process.env.BUNNY_CDN_SIGNING === "false";
  const tokenKey = process.env.BUNNY_CDN_TOKEN_KEY?.trim() ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_BUNNY_VIDEO_BASE_URL?.trim() ?? "";
  const bust = cacheBust?.trim() || process.env.EXPLAINER_VSL_CACHE_BUST?.trim() || "";
  const bustQs = bust ? `&v=${encodeURIComponent(bust)}` : "";

  if (signingOff || !tokenKey || !baseUrl) {
    let url = getCdnMediaUrl(path);
    if (bust) {
      const sep = url.includes("?") ? "&" : "?";
      url = `${url}${sep}v=${encodeURIComponent(bust)}`;
    }
    return url;
  }

  const rawTtl = process.env.BUNNY_CDN_URL_TTL_SECONDS?.trim();
  const defaultTtl = 86_400;
  const parsedEnvTtl = rawTtl ? Number.parseInt(rawTtl, 10) : NaN;
  const ttl =
    ttlSeconds ??
    (Number.isFinite(parsedEnvTtl) && parsedEnvTtl > 0 ? parsedEnvTtl : defaultTtl);

  const expires = Math.floor(Date.now() / 1000) + Math.max(300, ttl);

  const pathForHash =
    process.env.BUNNY_CDN_TOKEN_PATH_NO_LEADING_SLASH === "1" ||
    process.env.BUNNY_CDN_TOKEN_PATH_NO_LEADING_SLASH === "true"
      ? normalized.replace(/^\//, "")
      : normalized;

  const hashable = `${tokenKey}${pathForHash}${String(expires)}`;
  const hashMode = (process.env.BUNNY_CDN_TOKEN_HASH ?? "md5").toLowerCase();
  const useSha256 = hashMode === "sha256" || hashMode === "advanced";

  const digest = useSha256
    ? crypto.createHash("sha256").update(hashable, "utf8").digest()
    : crypto.createHash("md5").update(hashable, "utf8").digest();

  const token = base64UrlToken(digest);
  const base = baseUrl.replace(/\/+$/, "");
  // Ostaje kao u Bunny primerima (token je base64url, ne zahteva encode u praksi)
  return `${base}${normalized}?token=${token}&expires=${expires}${bustQs}`;
}
