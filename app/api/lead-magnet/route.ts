import { NextRequest, NextResponse } from "next/server";
import { arePromoLandingPagesEnabled } from "@/lib/promo-landing-pages";
import { formatBelgradeDateTime } from "@/lib/time-belgrade";
import { SOURCE_TAG_LEAD_MAGNET, SOURCE_TAG_LEAD_MAGNET_AFFILIATE } from "@/lib/lead-source-tags";

/** Samo ova polja prosleđujemo u /api/leads — sprečava skip_* / name / lažne interne ključeve iz browsera. */
function buildLeadsPayload(body: Record<string, unknown>): Record<string, unknown> {
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const out: Record<string, unknown> = {
    email,
    source_tag: SOURCE_TAG_LEAD_MAGNET,
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
  if (!payload.email || !String(payload.email).includes("@")) {
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
  if (out.duplicate) {
    return NextResponse.json({ success: true, duplicate: true });
  }

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
          email: String(payload.email ?? "").trim(),
          utm_source: payload.utm_source ?? "",
          utm_medium: payload.utm_medium ?? "",
          utm_campaign: payload.utm_campaign ?? "",
          affiliate_code: payload.affiliate_code ?? "",
          source_tag: tagForWebhook,
          landing: "lead_magnet",
        }),
      });
    } catch {
      // non-blocking: lead is saved even if webhook fails
    }
  }

  return NextResponse.json({
    success: true,
    ...(typeof out.sheet_append_ok === "boolean" ? { sheet_append_ok: out.sheet_append_ok } : {}),
  });
}
