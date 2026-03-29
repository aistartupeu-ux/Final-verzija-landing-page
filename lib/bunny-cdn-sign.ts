import "server-only";
import crypto from "node:crypto";
import { getCdnMediaUrl } from "@/lib/cdn-media";

/**
 * Bunny CDN Basic Token Authentication (MD5).
 * @see https://docs.bunny.net/docs/cdn-token-authentication-basic
 *
 * Na pull zone u Bunny dashboard-u uključi "Token authentication" i isti ključ
 * stavi u BUNNY_CDN_TOKEN_KEY (nikad NEXT_PUBLIC_*).
 *
 * Bez ključa: ponašanje kao getCdnMediaUrl (lokalni dev, fallback).
 */
export function getServerCdnUrl(path: string, ttlSeconds?: number): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const signingOff =
    process.env.BUNNY_CDN_SIGNING === "0" || process.env.BUNNY_CDN_SIGNING === "false";
  const tokenKey = process.env.BUNNY_CDN_TOKEN_KEY?.trim() ?? "";
  const baseUrl = process.env.NEXT_PUBLIC_BUNNY_VIDEO_BASE_URL?.trim() ?? "";

  if (signingOff || !tokenKey || !baseUrl) {
    return getCdnMediaUrl(path);
  }

  const rawTtl = process.env.BUNNY_CDN_URL_TTL_SECONDS?.trim();
  const defaultTtl = 86_400;
  const parsedEnvTtl = rawTtl ? Number.parseInt(rawTtl, 10) : NaN;
  const ttl =
    ttlSeconds ??
    (Number.isFinite(parsedEnvTtl) && parsedEnvTtl > 0 ? parsedEnvTtl : defaultTtl);

  const expires = Math.floor(Date.now() / 1000) + Math.max(300, ttl);
  // Bunny primeri konkateniraju expiration kao ceo broj (isti string kao u query-ju).
  const hashable = `${tokenKey}${normalized}${String(expires)}`;
  const md5Hash = crypto.createHash("md5").update(hashable, "utf8").digest();
  let token = md5Hash.toString("base64");
  token = token.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const base = baseUrl.replace(/\/+$/, "");
  return `${base}${normalized}?token=${token}&expires=${expires}`;
}
