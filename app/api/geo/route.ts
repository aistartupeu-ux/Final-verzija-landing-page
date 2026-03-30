import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side geo lookup — koristi IPAPI_API_KEY iz env (ne eksponira ključ na klijentu).
 * Koristi se za UrgencyNotification i druge komponente koje trebaju lokaciju.
 */
export async function GET(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") ?? "";
    const ipapiKey = process.env.IPAPI_API_KEY;
    const path = ip ? `${ip}/json/` : "json/";
    const keyParam = ipapiKey ? `?key=${ipapiKey}` : "";

    const res = await fetch(`https://ipapi.co/${path}${keyParam}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.reason ?? "Geo failed" }, { status: 400 });
    }

    return NextResponse.json({
      city: data.city ?? null,
      country_name: data.country_name ?? null,
      country_code: data.country_code ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
