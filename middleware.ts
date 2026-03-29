import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminSessionToken } from "@/lib/admin-session";
import { getAdminAnalyticsSecret, getAdminLiveConsoleSecret } from "@/lib/admin-secret";
import { getCookieFromHeader } from "@/lib/cookie-header";

const CLICK_ID_PARAMS = ["fbclid", "gclid", "ttclid"];
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign"];

function hasAny(searchParams: URLSearchParams, keys: string[]) {
  return keys.some((k) => {
    const v = searchParams.get(k);
    return typeof v === "string" && v.length > 0;
  });
}

function isLiveConsolePath(pathname: string): boolean {
  if (pathname === "/admin/live/login") return false;
  return pathname === "/admin/live" || pathname.startsWith("/admin/live/");
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login" || pathname === "/admin/live/login") {
      return NextResponse.next();
    }

    if (isLiveConsolePath(pathname)) {
      const liveSecret = getAdminLiveConsoleSecret();
      if (!liveSecret) {
        const loginUrl = new URL("/admin/live/login", req.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }
      const liveToken = getCookieFromHeader(req.headers.get("cookie"), "admin_live_session");
      if (!liveToken || !(await verifyAdminSessionToken(liveToken, liveSecret, "live"))) {
        const loginUrl = new URL("/admin/live/login", req.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    const archiveSecret = getAdminAnalyticsSecret();
    if (!archiveSecret) return NextResponse.next();

    const archiveToken = getCookieFromHeader(req.headers.get("cookie"), "admin_session");
    if (!archiveToken || !(await verifyAdminSessionToken(archiveToken, archiveSecret, "archive"))) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

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
