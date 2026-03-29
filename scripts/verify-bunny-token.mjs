/**
 * Lokalna provera Bunny Basic token URL-a (isto kao lib/bunny-cdn-sign.ts).
 * Pokretanje: node --env-file=.env.local scripts/verify-bunny-token.mjs
 * (Node 20+; bez .env.local samo koristi trenutni environ)
 */
import crypto from "node:crypto";

const tokenKey = process.env.BUNNY_CDN_TOKEN_KEY?.trim() ?? "";
const baseUrl = process.env.NEXT_PUBLIC_BUNNY_VIDEO_BASE_URL?.trim() ?? "";
const path = "/hero-vsl.mp4";
const ttl = 3600;

function sign(pathOnly, key, base, ttlSec) {
  const normalized = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
  if (!key || !base) return { url: null, error: "Nedostaje BUNNY_CDN_TOKEN_KEY ili NEXT_PUBLIC_BUNNY_VIDEO_BASE_URL" };
  const expires = Math.floor(Date.now() / 1000) + ttlSec;
  const hashable = `${key}${normalized}${String(expires)}`;
  const md5Hash = crypto.createHash("md5").update(hashable, "utf8").digest();
  let token = md5Hash.toString("base64");
  token = token.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const baseTrim = base.replace(/\/+$/, "");
  return { url: `${baseTrim}${normalized}?token=${token}&expires=${expires}`, error: null };
}

const { url, error } = sign(path, tokenKey, baseUrl, ttl);
if (error) {
  console.error(error);
  process.exit(1);
}

console.log("Generisan URL (prvih 80 zn.):", url.slice(0, 80) + "…");

const res = await fetch(url, { method: "HEAD", redirect: "manual" });
console.log("HEAD status:", res.status, res.statusText);
if (res.status === 403) {
  console.error(
    "\n403: token ili Bunny podešavanje ne odgovara.\n" +
      "- U Bunny Pull Zone → Security mora biti Basic Token Authentication (MD5), ne Advanced.\n" +
      "- Security key mora biti isti kao BUNNY_CDN_TOKEN_KEY na Vercel-u.\n" +
      "- Host u NEXT_PUBLIC_BUNNY_VIDEO_BASE_URL mora biti ta pull zona."
  );
  process.exit(1);
}
if (res.status === 200 || res.status === 206) {
  console.log("OK: Bunny prihvata potpisani zahtev.");
  process.exit(0);
}
console.warn("Neočekivan status (proveri da li fajl postoji na CDN-u):", res.status);
