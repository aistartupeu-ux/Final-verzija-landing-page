import { createHash, randomBytes } from "crypto";

export function generateAffiliateCode(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 6)
    .padEnd(4, "x");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `${base}${suffix}`.toUpperCase();
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(salt + password)
    .digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const attempt = createHash("sha256")
    .update(salt + password)
    .digest("hex");
  return attempt === hash;
}

export function createAffiliateToken(affiliateId: string, email: string): string {
  return Buffer.from(JSON.stringify({ id: affiliateId, email, ts: Date.now() })).toString("base64");
}

export function parseAffiliateToken(token: string): { id: string; email: string; ts: number } | null {
  try {
    return JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}
