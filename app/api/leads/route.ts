import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { appendLeadsToSheet } from "@/lib/leads-sheet";

// Jednostavan in-memory rate limit po IP za ovu funkciju.
// Nije savršen (serverless instanciranje), ali pomaže da se smanji udar na API.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minut
const RATE_LIMIT_MAX_REQUESTS = 20; // po IP u okviru prozora

type RateEntry = { count: number; resetAt: number };
const rateMap = new Map<string, RateEntry>();
const RATE_MAP_MAX_SIZE = 2000; // očisti istekle da mapa ne raste u beskonačnost

function cleanupExpiredRateEntries(): void {
  if (rateMap.size < RATE_MAP_MAX_SIZE) return;
  const now = Date.now();
  for (const [key, entry] of rateMap.entries()) {
    if (entry.resetAt < now) rateMap.delete(key);
  }
}

function isRateLimited(ip: string | null): boolean {
  if (!ip) return false;
  cleanupExpiredRateEntries();
  const now = Date.now();
  const current = rateMap.get(ip);
  if (!current || current.resetAt < now) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  current.count += 1;
  if (current.count > RATE_LIMIT_MAX_REQUESTS) return true;
  return false;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const id = setTimeout(() => resolve(null), ms);
    promise
      .then((v) => {
        clearTimeout(id);
        resolve(v);
      })
      .catch(() => {
        clearTimeout(id);
        resolve(null);
      });
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      phone,
      name,
      utm_source,
      utm_medium,
      utm_campaign,
      affiliate_code: bodyAffiliate,
      source_tag,
    } = body;

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

    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const ipapiKey = process.env.IPAPI_API_KEY;
    let city: string | null = null;
    let country: string | null = null;
    let country_code: string | null = null;

    try {
      const path = ip ? `${ip}/json/` : "json/";
      const keyParam = ipapiKey ? `?key=${ipapiKey}` : "";
      const geoRes = await withTimeout(
        fetch(`https://ipapi.co/${path}${keyParam}`, { next: { revalidate: 0 } }),
        3_000
      );
      if (geoRes) {
        const geo = await geoRes.json();
        city = geo.city ?? null;
        country = geo.country_name ?? null;
        country_code = geo.country_code ?? null;
      }
    } catch {
      // Location je opciono — ne blokiramo lead zbog ovoga
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

    const cookieStore = await cookies();
    const affiliateCode = bodyAffiliate ?? cookieStore.get("af_ref")?.value ?? null;

    // Leads by Source Sheet: webhook za Meta / affiliate tracking
    const leadsSourceWebhook = process.env.LEADS_SOURCE_WEBHOOK_URL;
    if (leadsSourceWebhook) {
      const payload = {
        date: new Date().toISOString(),
        email,
        phone: phone ?? "",
        name: name ?? "",
        source_tag: source_tag ?? (affiliateCode ? "affiliate" : "direct"),
        utm_source: utm_source ?? "",
        utm_medium: utm_medium ?? "",
        utm_campaign: utm_campaign ?? "",
        affiliate_code: affiliateCode ?? "",
      };
      // Fire-and-forget: ne čekamo odgovor da bismo lead bio brz.
      (async () => {
        try {
          const ctrl = new AbortController();
          const timeoutId = setTimeout(() => ctrl.abort(), 5_000);
          await fetch(leadsSourceWebhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: ctrl.signal,
          });
          clearTimeout(timeoutId);
        } catch (e) {
          console.error("Leads Source webhook error:", e);
        }
      })();
    }

    // Leads by Source: direktan upis u Google Sheet (bez Make)
    const row = {
      date: new Date().toISOString(),
      email,
      phone: phone ?? "",
      name: name ?? "",
      source_tag: source_tag ?? (affiliateCode ? "affiliate" : "direct"),
      utm_source: utm_source ?? "",
      utm_medium: utm_medium ?? "",
      utm_campaign: utm_campaign ?? "",
      affiliate_code: affiliateCode ?? "",
    };
    // Na Vercel-u moramo await — inače funkcija se ugasi pre nego Sheet upis stigne.
    try {
      await appendLeadsToSheet(row);
    } catch (e) {
      console.error("Leads Sheet append error:", e);
    }

    // HighLevel: pošalji lead u jedan workflow (welcome + affiliate logika)
    const ghlWebhook = process.env.GHL_WEBHOOK_URL;
    if (ghlWebhook) {
      // Ne blokiramo lead na sporom GHL webhook-u.
      (async () => {
        try {
          const ctrl = new AbortController();
          const timeoutId = setTimeout(() => ctrl.abort(), 5_000);
          await fetch(ghlWebhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              firstName: name?.split(" ")[0] ?? name ?? "",
              lastName: name?.split(" ").slice(1).join(" ") ?? "",
              name: name ?? "",
              phone: phone ?? "",
              source: affiliateCode ? "affiliate" : "AI Hype Academy",
              affiliate_code: affiliateCode ?? "",
              city: city ?? "",
              country: country ?? "",
            }),
            signal: ctrl.signal,
          });
          clearTimeout(timeoutId);
        } catch (e) {
          console.error("HighLevel webhook error:", e);
        }
      })();
    }

    // Welcome email šalje samo HighLevel preko webhook-a – Resend isključen da ne bi bilo duplo

    // Cookie za pristup special offer stranici
    cookieStore.set("special_access", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Lead API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
