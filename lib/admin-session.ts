/**
 * HMAC-SHA256 potpísan admin session token.
 * Token: base64url(payload).base64url(signature)
 * Payload: { exp, iat } - expiry i issued-at (Unix sekunde)
 */
const TOKEN_TTL_SEC = 86400; // 24 sati

function base64UrlEncode(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array | null {
  try {
    const padded = str.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(padded);
    return new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

async function sign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64UrlEncode(new Uint8Array(sig));
}

async function verify(secret: string, payload: string, signature: string): Promise<boolean> {
  const expected = await sign(secret, payload);
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

export async function createAdminSessionToken(secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({ exp: now + TOKEN_TTL_SEC, iat: now });
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(payload));
  const sig = await sign(secret, payload);
  return `${payloadB64}.${sig}`;
}

export async function verifyAdminSessionToken(
  token: string,
  secret: string
): Promise<boolean> {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const payloadB64 = parts[0];
  const sig = parts[1];

  const payloadBytes = base64UrlDecode(payloadB64);
  if (!payloadBytes) return false;

  let payloadObj: { exp?: number; iat?: number };
  try {
    payloadObj = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return false;
  }

  const exp = payloadObj?.exp;
  if (typeof exp !== "number" || exp <= Math.floor(Date.now() / 1000)) return false;

  const payloadStr = new TextDecoder().decode(payloadBytes);
  return verify(secret, payloadStr, sig);
}
