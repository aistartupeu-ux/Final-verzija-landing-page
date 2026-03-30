import { headers } from "next/headers";
import { NextResponse } from "next/server";

/** ISO 3166-1 alpha-2 za PhoneInput defaultCountry (Vercel / Cloudflare). */
export async function GET() {
  const h = await headers();
  const raw =
    h.get("x-vercel-ip-country") ||
    h.get("cf-ipcountry") ||
    h.get("x-country-code") ||
    "";
  let code = raw.trim().toUpperCase();
  if (code.length !== 2 || !/^[A-Z]{2}$/.test(code)) {
    code = "RS";
  }
  if (code === "XK") code = "RS";

  return NextResponse.json({ defaultCountry: code });
}
