import { NextRequest } from "next/server";
import { verifyAdminSessionToken } from "@/lib/admin-session";
import { getAdminAnalyticsSecret } from "@/lib/admin-secret";
import { getCookieFromHeader } from "@/lib/cookie-header";

export async function isAdminApiAuthorized(req: NextRequest): Promise<boolean> {
  const expected = getAdminAnalyticsSecret();
  if (!expected) return false;

  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (bearerSecret === expected) return true;

  const url = req.nextUrl ?? new URL(req.url);
  const paramSecret = url.searchParams.get("secret");
  if (paramSecret === expected) return true;

  const sessionToken = getCookieFromHeader(req.headers.get("cookie"), "admin_session");
  if (sessionToken && (await verifyAdminSessionToken(sessionToken, expected, "archive"))) {
    return true;
  }

  return false;
}
