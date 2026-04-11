import { NextResponse } from "next/server";
import { adminSessionCookieOpts } from "@/lib/admin-session-cookie";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const base = adminSessionCookieOpts();
  res.cookies.set("admin_session", "", { ...base, maxAge: 0 });
  res.cookies.set("admin_live_session", "", {
    ...base,
    sameSite: "strict",
    maxAge: 0,
  });
  return res;
}
