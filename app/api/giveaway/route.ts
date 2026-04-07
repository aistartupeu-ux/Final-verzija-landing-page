import { NextRequest, NextResponse } from "next/server";
import { arePromoLandingPagesEnabled } from "@/lib/promo-landing-pages";
import { appendGiveawayToSheet } from "@/lib/leads-sheet";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function POST(req: NextRequest) {
  if (!arePromoLandingPagesEnabled()) {
    return NextResponse.json({ error: "Giveaway trenutno nije aktivan." }, { status: 403 });
  }

  const baseUrl = new URL(req.url);
  const target = new URL("/api/leads", baseUrl);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const incoming = body as Record<string, unknown>;
  const hasText = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
  const email = hasText(incoming.email) ? incoming.email.trim().toLowerCase() : "";
  const phone = hasText(incoming.phone) ? incoming.phone : "";
  const name = hasText(incoming.name) ? incoming.name : "";

  const payload = {
    ...incoming,
    // Giveaway uvek obeležavamo kao poseban izvor.
    // Ne prosleđujemo affiliate_code da se source_tag ne prepiše u "affiliate".
    affiliate_code: null,
    source_tag: "giveaway",
    utm_source: hasText(incoming.utm_source) ? incoming.utm_source : "giveaway",
    utm_medium: hasText(incoming.utm_medium) ? incoming.utm_medium : "organic",
    utm_campaign: hasText(incoming.utm_campaign) ? incoming.utm_campaign : null,
    skip_leads_source_sheet: true,
    skip_ghl_webhook: true,
  };

  const res = await fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    next: { revalidate: 0 },
  });

  const out = (await res.json().catch(() => ({}))) as { duplicate?: boolean };

  if (res.ok) {
    if (supabase && email) {
      try {
        const { data: existingGw } = await supabase
          .from("giveaway_leads")
          .select("id, repeat_count")
          .ilike("email", email)
          .limit(1)
          .maybeSingle();

        if (existingGw?.id) {
          await supabase
            .from("giveaway_leads")
            .update({
              phone: phone || null,
              name: name || null,
              source_tag: "giveaway",
              utm_source: String(payload.utm_source ?? ""),
              utm_medium: String(payload.utm_medium ?? ""),
              utm_campaign: String(payload.utm_campaign ?? ""),
              repeat_count: Number(existingGw.repeat_count ?? 0) + 1,
              last_submitted_at: new Date().toISOString(),
            })
            .eq("id", existingGw.id);
        } else {
          await supabase.from("giveaway_leads").insert({
            email,
            phone: phone || null,
            name: name || null,
            source_tag: "giveaway",
            utm_source: String(payload.utm_source ?? ""),
            utm_medium: String(payload.utm_medium ?? ""),
            utm_campaign: String(payload.utm_campaign ?? ""),
            repeat_count: 0,
            first_submitted_at: new Date().toISOString(),
            last_submitted_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error("Giveaway Supabase write error:", e);
      }
    }

    try {
      await appendGiveawayToSheet({
        date: new Date().toISOString(),
        email,
        phone,
        name,
        source_tag: "giveaway",
        utm_source: String(payload.utm_source ?? ""),
        utm_medium: String(payload.utm_medium ?? ""),
        utm_campaign: String(payload.utm_campaign ?? ""),
        affiliate_code: "",
        status: out.duplicate ? "repeat" : "new",
      });
    } catch (e) {
      console.error("Giveaway sheet write error:", e);
    }

    const giveawayGhlWebhook = process.env.GIVEAWAY_GHL_WEBHOOK_URL;
    if (giveawayGhlWebhook) {
      try {
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 5_000);
        await fetch(giveawayGhlWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            phone: phone || "",
            firstName: name?.split(" ")[0] ?? name ?? "",
            lastName: name?.split(" ").slice(1).join(" ") ?? "",
            name: name || "",
            source: "giveaway",
            campaign_type: "giveaway",
            entry_point: "giveaway_page",
            tags: ["GW_LEAD"],
          }),
          signal: ctrl.signal,
        });
        clearTimeout(timeoutId);
      } catch (e) {
        console.error("Giveaway GHL webhook error:", e);
      }
    }
  }

  return NextResponse.json(out, { status: res.status });
}

