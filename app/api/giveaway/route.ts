import { NextRequest, NextResponse } from "next/server";
import { arePromoLandingPagesEnabled } from "@/lib/promo-landing-pages";

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

  const payload = {
    ...incoming,
    // Giveaway uvek obeležavamo kao poseban izvor.
    // Ne prosleđujemo affiliate_code da se source_tag ne prepiše u "affiliate".
    affiliate_code: null,
    source_tag: "giveaway",
    utm_source: hasText(incoming.utm_source) ? incoming.utm_source : "giveaway",
    utm_medium: hasText(incoming.utm_medium) ? incoming.utm_medium : "organic",
    utm_campaign: hasText(incoming.utm_campaign) ? incoming.utm_campaign : "giveaway_ref",
  };

  const res = await fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    next: { revalidate: 0 },
  });

  const out = await res.json().catch(() => ({}));
  return NextResponse.json(out, { status: res.status });
}

