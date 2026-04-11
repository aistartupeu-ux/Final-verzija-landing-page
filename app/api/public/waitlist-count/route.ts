import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { WAITLIST_DEFAULT_COUNT_SINCE_ISO } from "@/lib/waitlist-public-defaults";

export const dynamic = "force-dynamic";

/**
 * Javni broj za waitlist na sajtu: baza (env WAITLIST_DISPLAY_BASE, default 9000) + broj leadova u `leads`.
 * Podrazumevano samo redovi od WAITLIST_DEFAULT_COUNT_SINCE_ISO (novi mailovi od kampanje).
 * WAITLIST_COUNT_SINCE_ISO nadjačava; WAITLIST_COUNT_ALL_LEADS=1 broji celu tabelu.
 * Broji service role-om (ne izlazi ključ klijentu).
 */
export async function GET() {
  const baseRaw = process.env.WAITLIST_DISPLAY_BASE ?? process.env.NEXT_PUBLIC_WAITLIST_DISPLAY_BASE;
  const base = Math.max(0, parseInt(String(baseRaw ?? "9000"), 10) || 9000);
  const allLeads =
    process.env.WAITLIST_COUNT_ALL_LEADS?.trim() === "1" ||
    process.env.WAITLIST_COUNT_ALL_LEADS?.trim().toLowerCase() === "true";
  const explicitSince = process.env.WAITLIST_COUNT_SINCE_ISO?.trim();
  const sinceIso = allLeads ? null : explicitSince || WAITLIST_DEFAULT_COUNT_SINCE_ISO;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { total: base, realLeads: 0, base, configured: false },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  let q = supabase.from("leads").select("*", { count: "exact", head: true });
  if (sinceIso) {
    q = q.gte("created_at", sinceIso);
  }
  const { count, error } = await q;

  const realLeads = error ? 0 : count ?? 0;
  const total = base + realLeads;

  return NextResponse.json(
    {
      total,
      realLeads,
      base,
      configured: true,
      ...(sinceIso ? { countingSince: sinceIso } : {}),
      ...(allLeads ? { countingAllLeads: true } : {}),
      ...(error ? { error: error.message } : {}),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
