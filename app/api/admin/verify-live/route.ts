import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionToken } from "@/lib/admin-session";
import { getAdminLiveConsoleSecret } from "@/lib/admin-secret";

export async function POST(req: NextRequest) {
  const liveSecret = getAdminLiveConsoleSecret();
  if (!liveSecret) {
    return NextResponse.json(
      { error: "Live konzola nije konfigurisana. Postavi ADMIN_LIVE_CONSOLE_SECRET u Vercel / .env (drugi kod od arhive)." },
      { status: 503 }
    );
  }

  let body: { secret?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const secret = typeof body.secret === "string" ? body.secret.trim() : "";
  if (!secret || secret !== liveSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await createAdminSessionToken(liveSecret, "live");
  const res = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === "production";

  res.cookies.set("admin_live_session", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 3600,
  });

  return res;
}
