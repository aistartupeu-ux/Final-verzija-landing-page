import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { updateLeadsSheetPhoneByEmail } from "@/lib/leads-sheet";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;
type RateEntry = { count: number; resetAt: number };
const rateMap = new Map<string, RateEntry>();

function isRateLimited(ip: string | null): boolean {
  if (!ip) return false;
  const now = Date.now();
  const current = rateMap.get(ip);
  if (!current || current.resetAt < now) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT_MAX;
}

/** Jednostavna E.164 provera (+ i 8–15 cifara). */
function isPlausibleE164(phone: string): boolean {
  const t = phone.trim();
  return /^\+[1-9]\d{7,14}$/.test(t);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * PATCH: doda telefon postojećem leadu (isti email kao pri prvoj prijavi).
 * Ne pravi novi red u Sheet-u — samo kolona C; Supabase update po emailu.
 */
export async function PATCH(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") ?? "";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!isPlausibleE164(phone)) {
      return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const emailNorm = email.trim().toLowerCase();

    const { data: leadRow, error: findErr } = await supabase
      .from("leads")
      .select("id, affiliate_code, city, country")
      .ilike("email", emailNorm)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findErr) {
      console.error("Supabase phone find error:", findErr.message);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
    if (!leadRow?.id) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const { error } = await supabase.from("leads").update({ phone }).eq("id", leadRow.id);

    if (error) {
      console.error("Supabase phone update error:", error.message);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    try {
      await updateLeadsSheetPhoneByEmail(emailNorm, phone);
    } catch (e) {
      console.error("Sheet phone update:", e);
    }

    const ghlWebhook = process.env.GHL_WEBHOOK_URL;
    if (ghlWebhook) {
      const affiliateCode = leadRow.affiliate_code ? String(leadRow.affiliate_code).trim().toLowerCase() : "";
      (async () => {
        try {
          const ctrl = new AbortController();
          const timeoutId = setTimeout(() => ctrl.abort(), 5_000);
          await fetch(ghlWebhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: emailNorm,
              firstName: "",
              lastName: "",
              name: "",
              phone,
              source: affiliateCode ? "affiliate" : "AI Hype Academy",
              affiliate_code: affiliateCode,
              city: leadRow.city ?? "",
              country: leadRow.country ?? "",
            }),
            signal: ctrl.signal,
          });
          clearTimeout(timeoutId);
        } catch (e) {
          console.error("HighLevel phone-update webhook error:", e);
        }
      })();
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
