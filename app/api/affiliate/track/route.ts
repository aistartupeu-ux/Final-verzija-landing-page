import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { appendAffiliateClickToSheet, appendAffiliateLeadToSheet, isAffiliateSheetConfigured } from "@/lib/affiliate-sheet";

// Jednostavan rate limit za affiliate track endpoint.
const AFF_RATE_LIMIT_WINDOW_MS = 60_000;
const AFF_RATE_LIMIT_MAX_REQUESTS = 60;

type AffRateEntry = { count: number; resetAt: number };
const affRateMap = new Map<string, AffRateEntry>();
const AFF_RATE_MAP_MAX_SIZE = 3000;

function cleanupAffExpired(): void {
  if (affRateMap.size < AFF_RATE_MAP_MAX_SIZE) return;
  const now = Date.now();
  for (const [key, entry] of affRateMap.entries()) {
    if (entry.resetAt < now) affRateMap.delete(key);
  }
}

function isAffiliateRateLimited(ip: string | null): boolean {
  if (!ip) return false;
  cleanupAffExpired();
  const now = Date.now();
  const current = affRateMap.get(ip);
  if (!current || current.resetAt < now) {
    affRateMap.set(ip, { count: 1, resetAt: now + AFF_RATE_LIMIT_WINDOW_MS });
    return false;
  }
  current.count += 1;
  if (current.count > AFF_RATE_LIMIT_MAX_REQUESTS) return true;
  return false;
}

const MAKE_WEBHOOK = process.env.MAKE_WEBHOOK_URL;
const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

export async function POST(req: NextRequest) {
  const useMake = !!MAKE_WEBHOOK;
  const useSheet = isAffiliateSheetConfigured();
  if (!useMake && !useSheet) {
    return NextResponse.json(
      { ok: false, error: "Configure MAKE_WEBHOOK_URL or AFFILIATE_SHEET_ID + GOOGLE_SERVICE_ACCOUNT_JSON" },
      { status: 503 }
    );
  }

  if (req.method !== "POST") {
    return NextResponse.json({ ok: false }, { status: 405 });
  }

  try {
    const body = await req.json();
    const { event_type, affiliate_code, visitor_id, email, phone, page_url, utm_source, utm_campaign, created_at } = body;

    // Kod tretiramo kao case-insensitive, ali ga čuvamo u canonical obliku: lowercase.
    // To se poklapa sa kodovima poput "damijan01".
    const acode = (affiliate_code ?? "").toString().trim().toLowerCase();
    if (!acode) {
      return NextResponse.json({ ok: false, error: "affiliate_code required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") ?? null;
    if (isAffiliateRateLimited(ip)) {
      return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
    }

    if (event_type === "click") {
      if (!visitor_id) return NextResponse.json({ ok: false }, { status: 400 });
      const clickedAt = created_at ?? now;
      const payload = {
        event_type: "click",
        affiliate_code: acode,
        visitor_id,
        page_url: page_url ?? null,
        utm_source: utm_source ?? null,
        utm_campaign: utm_campaign ?? null,
        clicked_at: clickedAt,
      };

      // Glavni deo: zapiši click u Supabase (za dashboard).
      if (supabase) {
        const { data: affiliate } = await supabase
          .from("affiliates")
          .select("id")
          .eq("affiliate_code", acode)
          .eq("status", "active")
          .single();
        if (affiliate?.id) {
          await supabase.from("affiliate_clicks").insert({
            affiliate_id: affiliate.id,
            ip_address: ip,
            user_agent: req.headers.get("user-agent") ?? null,
            referrer: req.headers.get("referer") ?? null,
          });
        }
      }

      // Make u pozadini; Sheet MORA await — inače na Vercel-u se funkcija ugasi pre nego što upis stigne.
      if (MAKE_WEBHOOK) {
        (async () => {
          try {
            await fetch(MAKE_WEBHOOK, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
          } catch (err) {
            console.error("Affiliate click Make error:", err);
          }
        })();
      }

      if (useSheet) {
        try {
          await appendAffiliateClickToSheet({
            clicked_at: clickedAt,
            affiliate_code: acode,
            visitor_id,
            page_url: page_url ?? null,
            utm_source: utm_source ?? null,
            utm_campaign: utm_campaign ?? null,
          });
        } catch (err) {
          console.error("Affiliate click Sheet error:", err);
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (event_type === "lead") {
      if (!email || !(email + "").includes("@")) return NextResponse.json({ ok: false }, { status: 400 });
      const leadCreatedAt = created_at ?? now;
      const leadEmail = (email + "").trim().toLowerCase();
      const payload = {
        event_type: "lead",
        affiliate_code: acode,
        visitor_id: visitor_id ?? null,
        email: leadEmail,
        phone: phone ?? null,
        page_url: page_url ?? null,
        utm_source: utm_source ?? null,
        utm_campaign: utm_campaign ?? null,
        created_at: leadCreatedAt,
      };

      // Upis u Supabase za dashboard (affiliate_leads)
      if (supabase) {
        try {
          const { data: affiliate } = await supabase
            .from("affiliates")
            .select("id")
            .eq("affiliate_code", acode)
            .eq("status", "active")
            .single();

          if (affiliate?.id) {
            const { error: leadErr } = await supabase.from("affiliate_leads").insert({
              affiliate_id: affiliate.id,
              visitor_id: visitor_id ?? null,
              email: leadEmail,
              phone: phone ?? null,
              page_url: page_url ?? null,
              utm_source: utm_source ?? null,
              utm_campaign: utm_campaign ?? null,
              created_at: leadCreatedAt,
            });
            if (leadErr) {
              console.error("Affiliate lead Supabase insert error:", JSON.stringify({
                code: leadErr.code,
                message: leadErr.message,
                details: leadErr.details,
                hint: leadErr.hint,
              }));
            }
          }
        } catch (e) {
          console.error("Affiliate lead Supabase exception:", e);
        }
      }

      if (MAKE_WEBHOOK) {
        (async () => {
          try {
            await fetch(MAKE_WEBHOOK, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
          } catch (err) {
            console.error("Affiliate lead Make error:", err);
          }
        })();
      }

      if (useSheet) {
        try {
          await appendAffiliateLeadToSheet({
            created_at: leadCreatedAt,
            email: leadEmail,
            phone: phone ?? null,
            affiliate_code: acode,
            visitor_id: visitor_id ?? null,
            page_url: page_url ?? null,
            utm_source: utm_source ?? null,
            utm_campaign: utm_campaign ?? null,
            status: "new",
          });
        } catch (err) {
          console.error("Affiliate lead Sheet error:", err);
        }
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false }, { status: 400 });
  } catch (err) {
    console.error("Affiliate track error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
