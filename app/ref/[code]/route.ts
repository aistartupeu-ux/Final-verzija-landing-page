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

  // Kod čuvamo canonical kao lowercase (npr. "damijan01"),
  // da bi se uvek poklapao sa kodovima u Sheet-u i GHL-u.
  const redirectUrl = new URL("/", req.url);
  const normalizedCode = code.trim().toLowerCase();
  redirectUrl.searchParams.set("ref", normalizedCode);

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set("af_ref", normalizedCode, {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
