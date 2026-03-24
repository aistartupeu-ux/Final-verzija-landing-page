import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";

const POYO_KEY = process.env.POYO_API_KEY!;
const POYO_URL = "https://api.poyo.ai";

const ALLOWED_MODELS = [
  "seedream-4.5", "seedream-4.5-edit", "seedream-5.0-lite",
  "nano-banana", "nano-banana-2", "gemini-3.1-flash-image-preview",
  "kling-3.0/standard", "kling-3.0/pro",
  "kling-2.6", "kling-2.6-motion-control",
  "veo3.1-fast", "veo3.1-quality",
  "generate-music",
];

function getClientIp(req: NextRequest): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip");
}

export async function POST(req: NextRequest) {
  try {
    if (isRateLimited(getClientIp(req), {
      keyPrefix: "ai-generate",
      windowMs: 60_000,
      maxRequests: 10,
    })) {
      return NextResponse.json(
        { code: 429, error: { message: "Previše zahteva. Pokušaj ponovo za minut." } },
        { status: 429 }
      );
    }
    if (!process.env.POYO_API_KEY) {
      return NextResponse.json(
        { code: 503, error: { message: "AI Studio nije konfigurisan." } },
        { status: 503 }
      );
    }
    const body = await req.json();
    const { model, input } = body;

    if (!model || !ALLOWED_MODELS.includes(model)) {
      return NextResponse.json({ code: 400, error: { message: `Invalid model: ${model}` } }, { status: 400 });
    }

    const payload = { model, input };

    console.log("[Poyo API] Sending:", JSON.stringify(payload));

    const res = await fetch(`${POYO_URL}/api/generate/submit`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${POYO_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("[Poyo API] Response:", res.status, text);

    let data;
    try { data = JSON.parse(text); } catch { data = { code: 500, error: { message: text } }; }

    if (data.code && data.code !== 200) {
      return NextResponse.json(data, { status: data.code });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[Poyo API] Error:", err);
    return NextResponse.json({ code: 500, error: { message: "Server error" } }, { status: 500 });
  }
}
