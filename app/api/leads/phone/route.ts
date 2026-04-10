import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { updateLeadsSheetPhoneByEmail } from "@/lib/leads-sheet";
import { THANK_YOU_AI_EXPERIENCE_OPTIONS } from "@/lib/thank-you-ai-experience";
import {
  normalizeSurveyGoal,
  THANK_YOU_SURVEY_Q1_OPTIONS,
  THANK_YOU_SURVEY_Q3_OPTIONS,
  THANK_YOU_SURVEY_Q4_OPTIONS,
  THANK_YOU_SURVEY_Q5_OPTIONS,
} from "@/lib/thank-you-forum-survey";

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

function normalizePersonName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim().replace(/\s+/g, " ");
  if (t.length < 2 || t.length > 80) return null;
  return t;
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
    const sourceTag = typeof body?.source_tag === "string" ? body.source_tag.trim().toLowerCase() : "";
    const firstName = normalizePersonName(body?.first_name);
    const lastName = normalizePersonName(body?.last_name);
    const aiRaw = typeof body?.ai_experience === "string" ? body.ai_experience.trim() : "";
    const aiExperience = THANK_YOU_AI_EXPERIENCE_OPTIONS.includes(
      aiRaw as (typeof THANK_YOU_AI_EXPERIENCE_OPTIONS)[number]
    )
      ? aiRaw
      : "";
    const q1Raw = typeof body?.survey_q1_interest === "string" ? body.survey_q1_interest.trim() : "";
    const q1 = THANK_YOU_SURVEY_Q1_OPTIONS.includes(q1Raw as (typeof THANK_YOU_SURVEY_Q1_OPTIONS)[number])
      ? q1Raw
      : "";
    const q2 = normalizeSurveyGoal(body?.survey_q2_goal);
    const q3Raw = typeof body?.survey_q3_blocker === "string" ? body.survey_q3_blocker.trim() : "";
    const q3 = THANK_YOU_SURVEY_Q3_OPTIONS.includes(q3Raw as (typeof THANK_YOU_SURVEY_Q3_OPTIONS)[number])
      ? q3Raw
      : "";
    const q4Raw = typeof body?.survey_q4_system_apply === "string" ? body.survey_q4_system_apply.trim() : "";
    const q4 = THANK_YOU_SURVEY_Q4_OPTIONS.includes(q4Raw as (typeof THANK_YOU_SURVEY_Q4_OPTIONS)[number])
      ? q4Raw
      : "";
    const q5Raw = typeof body?.survey_q5_occupation === "string" ? body.survey_q5_occupation.trim() : "";
    const q5 = THANK_YOU_SURVEY_Q5_OPTIONS.includes(q5Raw as (typeof THANK_YOU_SURVEY_Q5_OPTIONS)[number])
      ? q5Raw
      : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!isPlausibleE164(phone)) {
      return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    }
    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    if (!aiExperience) {
      return NextResponse.json({ error: "Invalid ai_experience" }, { status: 400 });
    }
    if (!q1 || !q2 || !q3 || !q4 || !q5) {
      return NextResponse.json({ error: "Invalid survey answers" }, { status: 400 });
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

    const fullName = `${firstName} ${lastName}`.trim();
    const baseUpdate = { phone, name: fullName };
    const surveyUpdate = {
      survey_q1_interest: q1,
      survey_q2_goal: q2,
      survey_q3_blocker: q3,
      survey_q4_system_apply: q4,
      survey_q5_occupation: q5,
    };
    const withAi = { ...baseUpdate, ai_experience: aiExperience };
    const fullUpdate = { ...withAi, ...surveyUpdate };
    const { error: updateErr } = await supabase.from("leads").update(fullUpdate).eq("id", leadRow.id);

    if (updateErr) {
      console.error("Supabase phone update error:", updateErr.message);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    try {
      await updateLeadsSheetPhoneByEmail(emailNorm, phone, fullName, {
        ai_experience: aiExperience,
        survey_q1: q1,
        survey_q2: q2,
        survey_q3: q3,
        survey_q4: q4,
        survey_q5: q5,
      });
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
              firstName,
              lastName,
              name: fullName,
              phone,
              ai_experience: aiExperience,
              survey_q1_interest: q1,
              survey_q2_goal: q2,
              survey_q3_blocker: q3,
              survey_q4_system_apply: q4,
              survey_q5_occupation: q5,
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

    if (sourceTag === "lead_magnet") {
      const leadMagnetWebhook =
        process.env.LEAD_MAGNET_THANK_YOU_WEBHOOK_URL?.trim() ||
        process.env.LEAD_MAGNET_WEBHOOK_URL?.trim();
      if (leadMagnetWebhook) {
        (async () => {
          try {
            const ctrl = new AbortController();
            const timeoutId = setTimeout(() => ctrl.abort(), 5_000);
            await fetch(leadMagnetWebhook, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ts: new Date().toISOString(),
                email: emailNorm,
                phone,
                first_name: firstName,
                last_name: lastName,
                ai_experience: aiExperience,
                survey_q1_interest: q1,
                survey_q2_goal: q2,
                survey_q3_blocker: q3,
                survey_q4_system_apply: q4,
                survey_q5_occupation: q5,
                source_tag: "lead_magnet",
                event_name: "thank_you_form_submitted",
              }),
              signal: ctrl.signal,
            });
            clearTimeout(timeoutId);
          } catch (e) {
            console.error("Lead magnet thank-you webhook error:", e);
          }
        })();
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
