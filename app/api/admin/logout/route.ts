import { NextRequest, NextResponse } from "next/server";

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 0,
} as const;

export async function POST(req: NextRequest) {
  let which: "archive" | "live" | "both" = "archive";
  try {
    const body = (await req.json()) as { which?: string };
    if (body?.which === "archive" || body?.which === "live" || body?.which === "both") {
      which = body.which;
    }
  } catch {
    // prazan body — samo arhiva (ponašanje kao pre live kolačića)
  }

  const res = NextResponse.json({ ok: true });

  if (which === "archive" || which === "both") {
    res.cookies.set("admin_session", "", { ...cookieBase, sameSite: "lax" });
  }
  if (which === "live" || which === "both") {
    res.cookies.set("admin_live_session", "", { ...cookieBase, sameSite: "strict" });
  }

  return res;
}
