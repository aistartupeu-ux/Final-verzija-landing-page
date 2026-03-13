import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, name } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!supabase) {
      console.error("Leads API: Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.");
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    // Get location from ipapi using the real visitor IP
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
      // Location is optional
    }

    const { error } = await supabase.from("leads").insert({
      email,
      phone: phone ?? null,
      city,
      country,
      country_code,
      ip: ip || null,
    });

    if (error) {
      console.error("Supabase insert error:", JSON.stringify({
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // HighLevel: pošalji lead u webhook (trigger za kontakt + welcome email)
    const ghlWebhook = process.env.GHL_WEBHOOK_URL;
    if (ghlWebhook) {
      try {
        await fetch(ghlWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            firstName: name?.split(" ")[0] ?? name ?? "",
            lastName: name?.split(" ").slice(1).join(" ") ?? "",
            name: name ?? "",
            phone: phone ?? "",
            source: "AI Hype Academy",
            city: city ?? "",
            country: country ?? "",
          }),
        });
      } catch (e) {
        console.error("HighLevel webhook error:", e);
      }
    }

    // Welcome email šalje samo HighLevel preko webhook-a – Resend isključen da ne bi bilo duplo

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Lead API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
