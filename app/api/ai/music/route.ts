import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";

const POYO_KEY = process.env.POYO_API_KEY!;

function getClientIp(req: NextRequest): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip");
}
const POYO_URL = "https://api.poyo.ai";

export async function POST(req: NextRequest) {
  try {
    if (isRateLimited(getClientIp(req), {
      keyPrefix: "ai-music",
      windowMs: 60_000,
      maxRequests: 10,
    })) {
      return NextResponse.json(
        { code: 429, error: { message: "Previše zahteva. Pokušaj ponovo za minut." } },
        { status: 429 }
      );
    }
    const body = await req.json();

    const payload = {
      model: "generate-music",
      input: body.input,
    };

    console.log("[Poyo Music] Sending:", JSON.stringify(payload));

    const res = await fetch(`${POYO_URL}/api/generate/submit`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${POYO_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("[Poyo Music] Response:", res.status, text);

    let data;
    try { data = JSON.parse(text); } catch { data = { code: 500, error: { message: text } }; }

    if (data.code && data.code !== 200) {
      return NextResponse.json(data, { status: data.code >= 400 ? data.code : 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[Poyo Music] Error:", err);
    return NextResponse.json({ code: 500, error: { message: "Server error" } }, { status: 500 });
  }
}
