import { NextRequest } from "next/server";
import { verifyAdminSessionToken } from "@/lib/admin-session";
import { getAdminLiveConsoleSecret } from "@/lib/admin-secret";
import { getCookieFromHeader } from "@/lib/cookie-header";

/** Samo live sesija ili sirovi LIVE secret — arhivski kolačić ne može da zove API. */
export async function isLiveAdminApiAuthorized(req: NextRequest): Promise<boolean> {
  const liveSecret = getAdminLiveConsoleSecret();
  if (!liveSecret) return false;

  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (bearerSecret === liveSecret) return true;

  const url = req.nextUrl ?? new URL(req.url);
  const paramSecret = url.searchParams.get("secret");
  if (paramSecret === liveSecret) return true;

  const sessionToken = getCookieFromHeader(req.headers.get("cookie"), "admin_live_session");
  if (sessionToken && (await verifyAdminSessionToken(sessionToken, liveSecret, "live"))) {
    return true;
  }

  return false;
}
