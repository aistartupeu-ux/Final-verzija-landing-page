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
    source_tag: "giveaway",
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

