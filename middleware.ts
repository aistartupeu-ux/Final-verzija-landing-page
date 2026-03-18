import { NextResponse, type NextRequest } from "next/server";

const CLICK_ID_PARAMS = ["fbclid", "gclid", "ttclid"];
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign"];

function hasAny(searchParams: URLSearchParams, keys: string[]) {
  return keys.some((k) => {
    const v = searchParams.get(k);
    return typeof v === "string" && v.length > 0;
  });
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Only guard the paid-ads landing page
  if (!pathname.startsWith("/lp")) return NextResponse.next();

  // Allow local development
  if (process.env.NODE_ENV !== "production") return NextResponse.next();

  const fromAds = hasAny(searchParams, CLICK_ID_PARAMS) || hasAny(searchParams, UTM_PARAMS);
  if (fromAds) return NextResponse.next();

  // If opened directly without ad params, redirect to homepage
  const url = req.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/lp/:path*"],
};

