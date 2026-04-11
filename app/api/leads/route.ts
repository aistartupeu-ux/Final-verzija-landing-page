import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { appendLeadsToSheet } from "@/lib/leads-sheet";
import { formatBelgradeDateTime } from "@/lib/time-belgrade";
import {
  SOURCE_TAG_LEAD_MAGNET,
  SOURCE_TAG_LEAD_MAGNET_AFFILIATE,
  isLeadMagnetSourceTag,
} from "@/lib/lead-source-tags";
import { appendAffiliateLeadToSheet, isAffiliateSheetConfigured } from "@/lib/affiliate-sheet";
import { isAllowedEmailDomain, EMAIL_DOMAIN_ERROR, EMAIL_MX_ERROR } from "@/lib/email-domains";
import { hasValidMxRecords } from "@/lib/email-verify-server";

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

function normalizeSourceTag(
  sourceTag: string | null | undefined,
  utmSource: string | null | undefined,
  utmMedium: string | null | undefined,
  utmCampaign: string | null | undefined,
  hasAffiliate: boolean
): string {
  if (hasAffiliate) return "affiliate";
  const rawTag = String(sourceTag ?? "").trim().toLowerCase();
  const rawSource = String(utmSource ?? "").trim().toLowerCase();
  const rawMedium = String(utmMedium ?? "").trim().toLowerCase();
  const rawCampaign = String(utmCampaign ?? "").trim().toLowerCase();
  const probe = `${rawTag} ${rawSource} ${rawMedium} ${rawCampaign}`;

  if (
    probe.includes("instagram") ||
    probe.includes("insta") ||
    rawTag === "ig" ||
    rawSource === "ig" ||
    rawMedium === "ig"
  )
    return "instagram";
  if (
    probe.includes("facebook") ||
    rawTag === "fb" ||
    rawSource === "fb" ||
    rawMedium === "fb" ||
    probe.includes("fb_")
  )
    return "facebook";
  if (probe.includes("tiktok") || rawTag === "tt" || rawSource === "tt" || rawMedium === "tt") return "tiktok";
  if (!rawTag || rawTag === "meta") return "direct";
  return rawTag;
}

/** Interni poziv iz /api/lead-magnet — jedini pouzdan izvor za oznake lead_magnet* i LM Sheet tab. */
const TRUSTED_LEAD_MAGNET_HEADER = "x-aih-lead-magnet";

function isTrustedLeadMagnetRequest(req: NextRequest): boolean {
  const sent = req.headers.get(TRUSTED_LEAD_MAGNET_HEADER);
  const secret = process.env.LEAD_MAGNET_INTERNAL_SECRET?.trim();
  if (secret) return sent === secret;
  return sent === "1";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const trustedLeadMagnet = isTrustedLeadMagnetRequest(req);
    const {
      email,
      phone,
      utm_source,
      utm_medium,
      utm_campaign,
      affiliate_code: bodyAffiliate,
      source_tag,
      skip_leads_source_sheet,
      skip_ghl_webhook,
    } = body;
    const name = typeof body?.name === "string" ? body.name.trim() : null;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!isAllowedEmailDomain(String(email).trim())) {
      return NextResponse.json({ error: EMAIL_DOMAIN_ERROR }, { status: 400 });
    }
    if (!(await hasValidMxRecords(String(email).trim()))) {
      return NextResponse.json({ error: EMAIL_MX_ERROR }, { status: 400 });
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
    const eventSourceUrl = req.headers.get("referer");

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

    const cookieStore = await cookies();
    const affiliateCodeRaw = bodyAffiliate ?? cookieStore.get("af_ref")?.value ?? null;
    const affiliateCode = affiliateCodeRaw ? String(affiliateCodeRaw).trim().toLowerCase() : null;
    const hasAffiliate = Boolean(affiliateCode);
    let sourceTag = normalizeSourceTag(
      source_tag,
      utm_source,
      utm_medium ?? null,
      utm_campaign ?? null,
      hasAffiliate
    );
    if (trustedLeadMagnet) {
      sourceTag = hasAffiliate ? SOURCE_TAG_LEAD_MAGNET_AFFILIATE : SOURCE_TAG_LEAD_MAGNET;
    } else if (isLeadMagnetSourceTag(sourceTag)) {
      sourceTag = "direct";
    }

    /** Giveaway ide samo u GW tab (`appendGiveawayToSheet`); nikad u Лист1/LM preko ovog endpointa. */
    const isGiveawayLead = sourceTag === "giveaway";

    const emailNorm = String(email).trim().toLowerCase();
    const { data: existing } = await supabase
      .from("leads")
      .select("id, utm_campaign")
      .ilike("email", emailNorm)
      .limit(1)
      .maybeSingle();

    if (existing) {
      if (sourceTag === "giveaway") {
        const repeatTag = "giveaway_repeat";
        const campaignRaw = typeof existing.utm_campaign === "string" ? existing.utm_campaign.trim() : "";
        const hasRepeatTag = campaignRaw.toLowerCase().includes(repeatTag);
        const updatedCampaign = hasRepeatTag
          ? campaignRaw
          : campaignRaw
            ? `${campaignRaw}|${repeatTag}`
            : repeatTag;
        try {
          await supabase
            .from("leads")
            .update({ utm_campaign: updatedCampaign })
            .eq("id", existing.id);
        } catch {
          // duplicirani giveaway upis je opciona oznaka; ne blokiramo response
        }
      }

      try {
        cookieStore.set("special_access", "1", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24,
          path: "/",
        });
      } catch (e) {
        console.error("special_access cookie error (duplicate):", e);
      }
      return NextResponse.json({
        success: true,
        duplicate: true,
        giveaway_repeat_tagged: sourceTag === "giveaway",
      });
    }

    const leadInsert = {
      email: emailNorm,
      phone: phone ?? null,
      city,
      country,
      country_code,
      ip: ip || null,
      affiliate_code: affiliateCode,
      utm_source: utm_source ?? null,
      utm_medium: utm_medium ?? null,
      utm_campaign: utm_campaign ?? null,
      source_tag: sourceTag,
      // submitted_at_belgrade samo ako kolona postoji u Supabase (ENABLE=1). Inače insert pada sa PGRST204 i Sheet se ne pozove.
      ...(process.env.SUPABASE_ENABLE_SUBMITTED_AT_BELGRADE === "1" &&
      process.env.SUPABASE_DISABLE_SUBMITTED_AT_BELGRADE !== "1"
        ? { submitted_at_belgrade: formatBelgradeDateTime() }
        : {}),
    };

    const { error } = await supabase.from("leads").insert(leadInsert);

    if (error) {
      if (error.code === "23505") {
        if (sourceTag === "giveaway") {
          const repeatTag = "giveaway_repeat";
          const { data: rowAfterRace } = await supabase
            .from("leads")
            .select("id, utm_campaign")
            .ilike("email", emailNorm)
            .limit(1)
            .maybeSingle();
          if (rowAfterRace?.id) {
            const campaignRaw =
              typeof rowAfterRace.utm_campaign === "string" ? rowAfterRace.utm_campaign.trim() : "";
            const hasRepeatTag = campaignRaw.toLowerCase().includes(repeatTag);
            const updatedCampaign = hasRepeatTag
              ? campaignRaw
              : campaignRaw
                ? `${campaignRaw}|${repeatTag}`
                : repeatTag;
            try {
              await supabase.from("leads").update({ utm_campaign: updatedCampaign }).eq("id", rowAfterRace.id);
            } catch {}
          }
        }
        try {
          cookieStore.set("special_access", "1", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24,
            path: "/",
          });
        } catch (e) {
          console.error("special_access cookie error (duplicate):", e);
        }
        return NextResponse.json({
          success: true,
          duplicate: true,
          giveaway_repeat_tagged: sourceTag === "giveaway",
        });
      }
      console.error("Supabase insert error:", JSON.stringify({
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      }));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Meta CAPI Lead šalje se sa thank-you stranice (delay) za bolju atribuciju.

    // Affiliate lead: Affiliate Google Sheet (Leads tab)
    if (affiliateCode && isAffiliateSheetConfigured()) {
      try {
        await appendAffiliateLeadToSheet({
          created_at: formatBelgradeDateTime(),
          email: emailNorm,
          phone: phone ?? null,
          affiliate_code: affiliateCode,
          visitor_id: cookieStore.get("af_vid")?.value ?? null,
          page_url: eventSourceUrl ?? null,
          utm_source: utm_source ?? null,
          utm_campaign: utm_campaign ?? null,
          status: "new",
        });
      } catch (e) {
        console.error("Affiliate lead Sheet error:", e);
      }
    }

    // Leads by Source Sheet: webhook za Meta / affiliate tracking
    const shouldWriteLeadsSource = !Boolean(skip_leads_source_sheet) && !isGiveawayLead;
    const leadsSourceWebhook = process.env.LEADS_SOURCE_WEBHOOK_URL;
    if (shouldWriteLeadsSource && leadsSourceWebhook) {
      const payload = {
        date: formatBelgradeDateTime(),
        email: emailNorm,
        phone: phone ?? "",
        name: "",
        source_tag: sourceTag,
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
      date: formatBelgradeDateTime(),
      email: emailNorm,
      phone: phone ?? "",
      name: "",
      source_tag: sourceTag,
      utm_source: utm_source ?? "",
      utm_medium: utm_medium ?? "",
      utm_campaign: utm_campaign ?? "",
      affiliate_code: affiliateCode ?? "",
    };
    // Na Vercel-u moramo await — inače funkcija se ugasi pre nego Sheet upis stigne.
    let sheetAppendOk: boolean | undefined;
    if (shouldWriteLeadsSource) {
      try {
        sheetAppendOk = await appendLeadsToSheet(row);
      } catch (e) {
        console.error("Leads Sheet append error:", e);
        sheetAppendOk = false;
      }
    }

    // HighLevel: pošalji lead u jedan workflow (welcome + affiliate logika)
    const shouldSendGhlWebhook = !Boolean(skip_ghl_webhook) && !isGiveawayLead;
    const ghlWebhook = process.env.GHL_WEBHOOK_URL;
    if (shouldSendGhlWebhook && ghlWebhook) {
      // Ne blokiramo lead na sporom GHL webhook-u.
      (async () => {
        try {
          const ctrl = new AbortController();
          const timeoutId = setTimeout(() => ctrl.abort(), 5_000);
          await fetch(ghlWebhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: emailNorm,
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

    // Cookie za pristup special offer stranici (ne blokiraj lead ako setovanje pukne — npr. ne-browser POST).
    try {
      cookieStore.set("special_access", "1", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      });
    } catch (e) {
      console.error("special_access cookie error:", e);
    }

    return NextResponse.json({
      success: true,
      ...(typeof sheetAppendOk === "boolean" ? { sheet_append_ok: sheetAppendOk } : {}),
    });
  } catch (err) {
    console.error("Lead API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
