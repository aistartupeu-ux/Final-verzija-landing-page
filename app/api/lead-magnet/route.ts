import { NextRequest, NextResponse } from "next/server";
import { arePromoLandingPagesEnabled } from "@/lib/promo-landing-pages";
import { formatBelgradeDateTime } from "@/lib/time-belgrade";
import { SOURCE_TAG_LEAD_MAGNET, SOURCE_TAG_LEAD_MAGNET_AFFILIATE } from "@/lib/lead-source-tags";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const LEAD_MAGNET_TABLE = "lead_magnet_contacts";

type LeadMagnetLeadsPayload = {
  email: string;
  source_tag: typeof SOURCE_TAG_LEAD_MAGNET;
  skip_main_leads_insert: true;
  skip_ghl_webhook: true;
  phone?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  affiliate_code?: string;
};

/** Samo ova polja prosleđujemo u /api/leads — sprečava skip_* / name / lažne interne ključeve iz browsera. */
function buildLeadsPayload(body: Record<string, unknown>): LeadMagnetLeadsPayload {
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const out: LeadMagnetLeadsPayload = {
    email,
    source_tag: SOURCE_TAG_LEAD_MAGNET,
    skip_main_leads_insert: true,
    skip_ghl_webhook: true,
  };
  if (typeof body.phone === "string" && body.phone.trim()) {
    out.phone = body.phone.trim();
  }
  if (typeof body.utm_source === "string" && body.utm_source.trim()) {
    out.utm_source = body.utm_source.trim();
  }
  if (typeof body.utm_medium === "string" && body.utm_medium.trim()) {
    out.utm_medium = body.utm_medium.trim();
  }
  if (typeof body.utm_campaign === "string" && body.utm_campaign.trim()) {
    out.utm_campaign = body.utm_campaign.trim();
  }
  if (typeof body.affiliate_code === "string" && body.affiliate_code.trim()) {
    out.affiliate_code = body.affiliate_code.trim().toLowerCase();
  }
  return out;
}

type LeadMagnetSubmissionPayload = {
  email: string;
  phone: string | null;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  affiliate_code: string;
  source_tag: string;
};

async function writeLeadMagnetSubmission(
  payload: LeadMagnetSubmissionPayload
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { data: existing } = await supabase
      .from(LEAD_MAGNET_TABLE)
      .select("id, repeat_count")
      .ilike("email", payload.email)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from(LEAD_MAGNET_TABLE)
        .update({
          phone: payload.phone,
          source_tag: payload.source_tag,
          utm_source: payload.utm_source,
          utm_medium: payload.utm_medium,
          utm_campaign: payload.utm_campaign,
          affiliate_code: payload.affiliate_code || null,
          repeat_count: Number(existing.repeat_count ?? 0) + 1,
          last_submitted_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      return true;
    }

    await supabase.from(LEAD_MAGNET_TABLE).insert({
      email: payload.email,
      phone: payload.phone,
      source_tag: payload.source_tag,
      utm_source: payload.utm_source,
      utm_medium: payload.utm_medium,
      utm_campaign: payload.utm_campaign,
      affiliate_code: payload.affiliate_code || null,
      repeat_count: 0,
      first_submitted_at: new Date().toISOString(),
      last_submitted_at: new Date().toISOString(),
    });
    return false;
  } catch (e) {
    console.error("Lead Magnet Supabase write error:", e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!arePromoLandingPagesEnabled()) {
    return NextResponse.json({ error: "Lead magnet trenutno nije aktivan." }, { status: 403 });
  }

  const baseUrl = new URL(req.url);
  const target = new URL("/api/leads", baseUrl);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const payload = buildLeadsPayload(body as Record<string, unknown>);
  if (!payload.email?.includes("@")) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const magnetHeader = process.env.LEAD_MAGNET_INTERNAL_SECRET?.trim() || "1";
  const res = await fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-aih-lead-magnet": magnetHeader,
    },
    body: JSON.stringify(payload),
    next: { revalidate: 0 },
  });

  const out = (await res.json().catch(() => ({}))) as {
    duplicate?: boolean;
    sheet_append_ok?: boolean;
  };
  if (!res.ok) return NextResponse.json(out, { status: res.status });

  const lmDuplicate = await writeLeadMagnetSubmission({
    email: payload.email.trim().toLowerCase(),
    phone: typeof payload.phone === "string" && payload.phone.trim() ? payload.phone.trim() : null,
    utm_source: payload.utm_source ?? "",
    utm_medium: payload.utm_medium ?? "",
    utm_campaign: payload.utm_campaign ?? "",
    affiliate_code: payload.affiliate_code ?? "",
    source_tag: payload.source_tag,
  });

  const isDuplicate = Boolean(out.duplicate || lmDuplicate);

  const webhook = process.env.LEAD_MAGNET_WEBHOOK_URL?.trim();
  if (webhook) {
    const tagForWebhook = payload.affiliate_code
      ? SOURCE_TAG_LEAD_MAGNET_AFFILIATE
      : SOURCE_TAG_LEAD_MAGNET;
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ts: formatBelgradeDateTime(),
          email: payload.email.trim(),
          utm_source: payload.utm_source ?? "",
          utm_medium: payload.utm_medium ?? "",
          utm_campaign: payload.utm_campaign ?? "",
          affiliate_code: payload.affiliate_code ?? "",
          source_tag: tagForWebhook,
          landing: "lead_magnet",
          is_duplicate: isDuplicate,
          send_welcome: false,
        }),
      });
    } catch {
      // non-blocking: lead is saved even if webhook fails
    }
  }

  return NextResponse.json({
    success: true,
    duplicate: isDuplicate,
    ...(typeof out.sheet_append_ok === "boolean" ? { sheet_append_ok: out.sheet_append_ok } : {}),
  });
}
