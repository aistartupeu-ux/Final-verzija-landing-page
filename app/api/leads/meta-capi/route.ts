import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendMetaCapiLeadEvent } from "@/lib/meta-capi";

/**
 * Šalje Meta CAPI Lead event. Poziva se sa thank-you stranice
 * da bi Meta uhvatila konverziju na confirmation page (bolja atribucija).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, event_id: eventId, event_source_url: eventSourceUrl } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") ?? "";
    const userAgent = req.headers.get("user-agent");

    const cookieStore = await cookies();
    const fbp = cookieStore.get("_fbp")?.value ?? null;
    const fbc = cookieStore.get("_fbc")?.value ?? null;

    await sendMetaCapiLeadEvent({
      email,
      phone: phone ?? null,
      ip: ip || null,
      userAgent: userAgent ?? null,
      eventSourceUrl: eventSourceUrl ?? null,
      fbp,
      fbc,
      event_id: typeof eventId === "string" && eventId.trim() ? eventId.trim() : null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Meta CAPI route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
