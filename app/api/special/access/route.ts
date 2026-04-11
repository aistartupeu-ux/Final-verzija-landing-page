import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { appendLeadsToSheet } from "@/lib/leads-sheet";
import { formatBelgradeDateTime } from "@/lib/time-belgrade";
import { isAllowedEmailDomain, EMAIL_DOMAIN_ERROR, EMAIL_MX_ERROR } from "@/lib/email-domains";
import { hasValidMxRecords } from "@/lib/email-verify-server";

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

    if (!email || !String(email).includes("@")) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const emailNorm = String(email).trim().toLowerCase();
    if (!isAllowedEmailDomain(emailNorm)) {
      return NextResponse.json({ error: EMAIL_DOMAIN_ERROR }, { status: 400 });
    }
    if (!(await hasValidMxRecords(emailNorm))) {
      return NextResponse.json({ error: EMAIL_MX_ERROR }, { status: 400 });
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

    const aff = affiliate_code ? String(affiliate_code).trim().toLowerCase() : null;
    const resolvedSourceTag = String(source_tag ?? "").trim().toLowerCase() || (aff ? "affiliate" : "direct");

    const { error } = await supabase.from("leads").insert({
      email: emailNorm,
      phone: phone && String(phone).trim() ? String(phone).trim() : null,
      city,
      country,
      country_code,
      ip: ip || null,
      affiliate_code: aff,
      utm_source: utm_source != null ? String(utm_source).trim() || null : null,
      utm_medium: utm_medium != null ? String(utm_medium).trim() || null : null,
      utm_campaign: utm_campaign != null ? String(utm_campaign).trim() || null : null,
      source_tag: resolvedSourceTag,
      ...(process.env.SUPABASE_ENABLE_SUBMITTED_AT_BELGRADE === "1" &&
      process.env.SUPABASE_DISABLE_SUBMITTED_AT_BELGRADE !== "1"
        ? { submitted_at_belgrade: formatBelgradeDateTime() }
        : {}),
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
            date: formatBelgradeDateTime(),
            email: emailNorm,
            phone: phone ?? "",
            name: "",
            source_tag: resolvedSourceTag,
            utm_source: utm_source ?? "",
            utm_medium: utm_medium ?? "",
            utm_campaign: utm_campaign ?? "",
            affiliate_code: aff ?? "",
          }),
        });
      } catch (e) {
        console.error("Leads Source webhook error:", e);
      }
    }

    // Leads by Source: direktan upis u Google Sheet (bez Make)
    let sheetAppendOk = false;
    try {
      sheetAppendOk = await appendLeadsToSheet({
        date: formatBelgradeDateTime(),
        email: emailNorm,
        phone: phone ?? "",
        name: "",
        source_tag: resolvedSourceTag,
        utm_source: utm_source ?? "",
        utm_medium: utm_medium ?? "",
        utm_campaign: utm_campaign ?? "",
        affiliate_code: aff ?? "",
      });
    } catch (e) {
      console.error("Special access Sheet append error:", e);
      sheetAppendOk = false;
    }

    const ghlWebhook = process.env.GHL_WEBHOOK_URL;
    if (ghlWebhook) {
      try {
        await fetch(ghlWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailNorm,
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
    try {
      cookieStore.set(COOKIE_NAME, "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
    } catch (e) {
      console.error("special_access cookie error:", e);
    }

    return NextResponse.json({ success: true, sheet_append_ok: sheetAppendOk });
  } catch (err) {
    console.error("Special access API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
