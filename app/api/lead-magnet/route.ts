import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const baseUrl = new URL(req.url);
  const target = new URL("/api/leads", baseUrl);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const payload = {
    ...(body as Record<string, unknown>),
    source_tag: "lead_magnet",
  };

  const res = await fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    next: { revalidate: 0 },
  });

  const out = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json(out, { status: res.status });

  const webhook = process.env.LEAD_MAGNET_WEBHOOK_URL?.trim();
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ts: new Date().toISOString(),
          email: String((payload as Record<string, unknown>).email ?? "").trim(),
          utm_source: (payload as Record<string, unknown>).utm_source ?? "",
          utm_medium: (payload as Record<string, unknown>).utm_medium ?? "",
          utm_campaign: (payload as Record<string, unknown>).utm_campaign ?? "",
          source_tag: "lead_magnet",
        }),
      });
    } catch {
      // non-blocking: lead is saved even if webhook fails
    }
  }

  return NextResponse.json({ success: true });
}

