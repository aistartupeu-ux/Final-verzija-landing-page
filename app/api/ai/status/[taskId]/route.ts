import { NextRequest, NextResponse } from "next/server";

const POYO_KEY = process.env.POYO_API_KEY!;
const POYO_URL = "https://api.poyo.ai";

export async function GET(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params;

    const res = await fetch(`${POYO_URL}/api/generate/status/${taskId}`, {
      headers: { "Authorization": `Bearer ${POYO_KEY}` },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
