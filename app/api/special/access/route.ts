import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const COOKIE_NAME = "special_access";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      phone,
      utm_source,
      utm_medium,
      utm_campaign,
      affiliate_code,
      source_tag,
    } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") ?? "";
    const ipapiKey = process.env.IPAPI_API_KEY;
    let city: string | null = null;
    let country: string | null = null;
    let country_code: string | null = null;

    try {
      const path = ip ? `${ip}/json/` : "json/";
      const keyParam = ipapiKey ? `?key=${ipapiKey}` : "";
      const geoRes = await fetch(
        `https://ipapi.co/${path}${keyParam}`,
        { next: { revalidate: 0 } }
      );
      const geo = await geoRes.json();
      city = geo.city ?? null;
      country = geo.country_name ?? null;
      country_code = geo.country_code ?? null;
    } catch {
      // optional
    }

    const { error } = await supabase.from("leads").insert({
      email,
      phone: phone && String(phone).trim() ? String(phone).trim() : null,
      city,
      country,
      country_code,
      ip: ip || null,
    });

    if (error) {
      console.error("Special access Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Leads by Source Sheet: webhook za Meta / affiliate tracking
    const leadsSourceWebhook = process.env.LEADS_SOURCE_WEBHOOK_URL;
    if (leadsSourceWebhook) {
      try {
        await fetch(leadsSourceWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: new Date().toISOString(),
            email,
            phone: phone ?? "",
            name: "",
            source_tag: source_tag ?? (affiliate_code ? "affiliate" : "direct"),
            utm_source: utm_source ?? "",
            utm_medium: utm_medium ?? "",
            utm_campaign: utm_campaign ?? "",
            affiliate_code: affiliate_code ?? "",
          }),
        });
      } catch (e) {
        console.error("Leads Source webhook error:", e);
      }
    }

    const ghlWebhook = process.env.GHL_WEBHOOK_URL;
    if (ghlWebhook) {
      try {
        await fetch(ghlWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            firstName: "",
            lastName: "",
            name: "",
            phone: phone ?? "",
            source: "Special Offer",
            city: city ?? "",
            country: country ?? "",
          }),
        });
      } catch (e) {
        console.error("HighLevel webhook error:", e);
      }
    }

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Special access API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
