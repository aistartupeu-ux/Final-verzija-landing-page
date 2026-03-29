import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminSessionToken } from "@/lib/admin-session";
import { getAdminAnalyticsSecret } from "@/lib/admin-secret";
import { getCookieFromHeader } from "@/lib/cookie-header";
import { arePromoLandingPagesEnabled, isPromoLandingPath } from "@/lib/promo-landing-pages";

/**
 * Napomena: agresivna „bot / WAF” pravila na Vercel-u ili drugom edge-u ponekad daju
 * osećaj punog reload-a ili „pucanja” taba na desktopu. Za CDN zloupotrebu smanji
 * hotlink kroz Bunny token URL-ove (BUNNY_CDN_TOKEN_KEY), ne kroz dodatni bot-filter ovde.
 */

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

  if (isPromoLandingPath(pathname) && !arePromoLandingPagesEnabled()) {
    const home = req.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    return NextResponse.redirect(home);
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const expected = getAdminAnalyticsSecret();
    if (!expected) return NextResponse.next();

    const sessionToken = getCookieFromHeader(req.headers.get("cookie"), "admin_session");

    if (!sessionToken || !(await verifyAdminSessionToken(sessionToken, expected, "archive"))) {
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
  matcher: [
    "/giveaway",
    "/free-guide",
    "/promo/giveaway-10-mesta",
    "/promo/giveaway-10-mesta/:path*",
    "/promo/lead-magnet",
    "/promo/lead-magnet/:path*",
    "/lp/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
