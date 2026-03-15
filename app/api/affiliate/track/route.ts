import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { appendAffiliateClickToSheet, appendAffiliateLeadToSheet, isAffiliateSheetConfigured } from "@/lib/affiliate-sheet";

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

    const acode = (affiliate_code ?? "").toString().trim().toUpperCase();
    if (!acode) {
      return NextResponse.json({ ok: false, error: "affiliate_code required" }, { status: 400 });
    }

    const now = new Date().toISOString();

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

      let makeOk = true;
      if (MAKE_WEBHOOK) {
        const r = await fetch(MAKE_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        makeOk = r.ok;
      }

      if (useSheet) {
        await appendAffiliateClickToSheet({
          clicked_at: clickedAt,
          affiliate_code: acode,
          visitor_id,
          page_url: page_url ?? null,
          utm_source: utm_source ?? null,
          utm_campaign: utm_campaign ?? null,
        });
      }

      if (supabase) {
        const { data: affiliate } = await supabase
          .from("affiliates")
          .select("id")
          .eq("affiliate_code", acode)
          .eq("status", "active")
          .single();
        if (affiliate?.id) {
          const forwarded = req.headers.get("x-forwarded-for");
          const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") ?? null;
          await supabase.from("affiliate_clicks").insert({
            affiliate_id: affiliate.id,
            ip_address: ip,
            user_agent: req.headers.get("user-agent") ?? null,
            referrer: req.headers.get("referer") ?? null,
          });
        }
      }

      return NextResponse.json({ ok: makeOk });
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

      let makeOk = true;
      if (MAKE_WEBHOOK) {
        const r = await fetch(MAKE_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        makeOk = r.ok;
      }

      if (useSheet) {
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
      }

      return NextResponse.json({ ok: makeOk });
    }

    return NextResponse.json({ ok: false }, { status: 400 });
  } catch (err) {
    console.error("Affiliate track error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
