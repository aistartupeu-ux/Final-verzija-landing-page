import { NextRequest, NextResponse } from "next/server";

/** Redirect /ref/CODE → /?ref=CODE i postavi cookie. Klik se upisuje u /api/affiliate/track (client). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const upperCode = code.toUpperCase();
  const redirectUrl = new URL("/", req.url);
  redirectUrl.searchParams.set("ref", upperCode);

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set("af_ref", upperCode, {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
