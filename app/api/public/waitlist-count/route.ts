import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Javni broj za waitlist na sajtu: baza (env WAITLIST_DISPLAY_BASE, default 9000) + broj leadova u `leads`.
 * Opciono samo redovi sa created_at >= WAITLIST_COUNT_SINCE_ISO (ISO string).
 * Broji service role-om (ne izlazi ključ klijentu).
 */
export async function GET() {
  const baseRaw = process.env.WAITLIST_DISPLAY_BASE ?? process.env.NEXT_PUBLIC_WAITLIST_DISPLAY_BASE;
  const base = Math.max(0, parseInt(String(baseRaw ?? "9000"), 10) || 9000);
  const sinceIso = process.env.WAITLIST_COUNT_SINCE_ISO?.trim();

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
      ...(error ? { error: error.message } : {}),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
