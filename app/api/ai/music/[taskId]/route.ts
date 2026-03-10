import { NextRequest, NextResponse } from "next/server";

const POYO_KEY = process.env.POYO_API_KEY!;
const POYO_URL = "https://api.poyo.ai";

export async function GET(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params;

    const res = await fetch(`${POYO_URL}/api/generate/detail/music?task_id=${taskId}`, {
      headers: { "Authorization": `Bearer ${POYO_KEY}` },
    });

    const data = await res.json();

    if (data.data?.status === "finished" && data.data?.files?.length > 0) {
      const normalizedFiles = data.data.files.map((f: Record<string, unknown>) => ({
        file_url: f.audio_url || "",
        file_type: "audio",
        title: f.title || "",
        duration: f.duration || 0,
        image_url: f.image_url || "",
      }));
      data.data.files = normalizedFiles;
    }

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
