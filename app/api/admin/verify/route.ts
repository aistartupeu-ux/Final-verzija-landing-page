import { NextRequest, NextResponse } from "next/server";
import { createAdminSessionToken } from "@/lib/admin-session";
import { getAdminAnalyticsSecret } from "@/lib/admin-secret";

export async function POST(req: NextRequest) {
  const expected = getAdminAnalyticsSecret();
  if (!expected) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  let body: { secret?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const secret = typeof body.secret === "string" ? body.secret.trim() : "";
  if (!secret || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await createAdminSessionToken(expected);
  const res = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === "production";

  // path mora biti "/" da bi se kolačić slao i na /api/admin/* (ne samo na /admin/* stranice)
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: isProd,
    // lax: pouzdanije posle POST→redirect na istom sajtu nego strict u nekim browserima
    sameSite: "lax",
    path: "/",
    maxAge: 86400, // 24h
  });

  return res;
}
