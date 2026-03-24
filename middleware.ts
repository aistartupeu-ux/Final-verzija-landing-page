import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminSessionToken } from "@/lib/admin-session";
import { getAdminAnalyticsSecret } from "@/lib/admin-secret";
import { getCookieFromHeader } from "@/lib/cookie-header";

const CLICK_ID_PARAMS = ["fbclid", "gclid", "ttclid"];
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign"];

function hasAny(searchParams: URLSearchParams, keys: string[]) {
  return keys.some((k) => {
    const v = searchParams.get(k);
    return typeof v === "string" && v.length > 0;
  });
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Admin: /admin/* osim /admin/login zahtevaju validnu sesiju
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const expected = getAdminAnalyticsSecret();
    if (!expected) return NextResponse.next();

    const sessionToken = getCookieFromHeader(req.headers.get("cookie"), "admin_session");

    if (!sessionToken || !(await verifyAdminSessionToken(sessionToken, expected))) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // LP: samo guard za paid-ads landing
  if (!pathname.startsWith("/lp")) return NextResponse.next();

  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  const fromAds = hasAny(searchParams, CLICK_ID_PARAMS) || hasAny(searchParams, UTM_PARAMS);
  if (fromAds) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/lp/:path*", "/admin/:path*"],
};

