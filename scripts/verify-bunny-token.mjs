/**
 * Provera Bunny token URL-a: prvo MD5 (Basic), pa SHA256 (Advanced minimal).
 * Pokretanje: npm run verify:bunny  (Node 20+, .env.local sa BUNNY_CDN_TOKEN_KEY + NEXT_PUBLIC_BUNNY_VIDEO_BASE_URL)
 */
import crypto from "node:crypto";

const tokenKey = process.env.BUNNY_CDN_TOKEN_KEY?.trim() ?? "";
const baseUrl = process.env.NEXT_PUBLIC_BUNNY_VIDEO_BASE_URL?.trim() ?? "";
const testPath = "/hero-vsl.mp4";
const ttl = 3600;

function b64url(buf) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildSignedUrl(pathOnly, key, base, ttlSec, algo) {
  const normalized = pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
  const expires = Math.floor(Date.now() / 1000) + ttlSec;
  const hashable = `${key}${normalized}${String(expires)}`;
  const digest =
    algo === "sha256"
      ? crypto.createHash("sha256").update(hashable, "utf8").digest()
      : crypto.createHash("md5").update(hashable, "utf8").digest();
  const token = b64url(digest);
  const baseTrim = base.replace(/\/+$/, "");
  return `${baseTrim}${normalized}?token=${token}&expires=${expires}`;
}

if (!tokenKey || !baseUrl) {
  console.error("Nedostaje BUNNY_CDN_TOKEN_KEY ili NEXT_PUBLIC_BUNNY_VIDEO_BASE_URL u .env.local");
  process.exit(1);
}

for (const algo of ["md5", "sha256"]) {
  const url = buildSignedUrl(testPath, tokenKey, baseUrl, ttl, algo);
  const label = algo === "md5" ? "Basic (MD5)" : "Advanced-min (SHA256)";
  process.stdout.write(`${label}: HEAD … `);
  const res = await fetch(url, { method: "HEAD", redirect: "manual" });
  console.log(res.status, res.statusText);
  if (res.status === 200 || res.status === 206) {
    console.log("\n→ Ovo radi. Na Vercel postavi:");
    console.log(`   BUNNY_CDN_TOKEN_HASH=${algo === "md5" ? "md5" : "sha256"}`);
    if (algo === "sha256") console.log("   (ili advanced)");
    process.exit(0);
  }
}

console.error(
  "\nOba algoritma vraćaju grešku. Proveri:\n" +
    "1) Isti ključ kao „URL Token Authentication Key” u Bunny → Pull zone → Security\n" +
    "2) NEXT_PUBLIC_BUNNY_VIDEO_BASE_URL je hostname te pull zone (npr. https://xyz.b-cdn.net)\n" +
    "3) Fajl /hero-vsl.mp4 postoji na originu te zone\n" +
    "4) Na Vercel SU oba env-a (često imaš Bunny uključeno ali BUNNY_CDN_TOKEN_KEY nedostaje → HTML bez tokena → 403)\n" +
    "5) Probaj BUNNY_CDN_TOKEN_PATH_NO_LEADING_SLASH=1 ako Bunny očekuje putanju bez vodećeg / u hash-u"
);
process.exit(1);
