import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getLeadsFromSheet } from "@/lib/leads-sheet";
import { verifyAdminSessionToken } from "@/lib/admin-session";

async function isAdminAuthorized(req: NextRequest): Promise<boolean> {
  const expected = process.env.ADMIN_ANALYTICS_SECRET;
  if (!expected) return false;

  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (bearerSecret === expected) return true;

  const url = req.nextUrl ?? new URL(req.url);
  const paramSecret = url.searchParams.get("secret");
  if (paramSecret === expected) return true;

  const cookieHeader = req.headers.get("cookie");
  const sessionToken = cookieHeader
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("admin_session="))
    ?.split("=")[1];
  if (sessionToken && (await verifyAdminSessionToken(sessionToken, expected))) return true;

  return false;
}

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const url = req.nextUrl ?? new URL(req.url);
  const debug = url.searchParams.get("debug") === "1";
  const todayOnly = url.searchParams.get("today") === "1";
  let from = url.searchParams.get("from");
  let to = url.searchParams.get("to");

  if (todayOnly) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Belgrade",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const todayBelgrade = `${get("year")}-${get("month")}-${get("day")}`;
    from = todayBelgrade;
    to = todayBelgrade;
  }

  let fromDate: Date | null = null;
  let toDate: Date | null = null;
  if (from) fromDate = new Date(from);
  if (to) toDate = new Date(to);

  const supabase = createClient(supabaseUrl, supabaseKey);
  const leadByKey = new Map<string, string>(); // key -> normalized source_tag

  function normalizeSourceTag(
    tag: string | null | undefined,
    utmSource: string | null | undefined,
    utmMedium: string | null | undefined,
    utmCampaign: string | null | undefined
  ): string {
    const rawTag = (tag ?? "").trim().toLowerCase();
    const rawSource = (utmSource ?? "").trim().toLowerCase();
    const rawMedium = (utmMedium ?? "").trim().toLowerCase();
    const rawCampaign = (utmCampaign ?? "").trim().toLowerCase();
    const probe = `${rawTag} ${rawSource} ${rawMedium} ${rawCampaign}`;

    // Prvo platforma — affiliate+tiktok ide u TikTok, affiliate+ig u Instagram
    if (probe.includes("tiktok") || rawSource === "tt" || rawMedium === "tt") return "tiktok";
    if (probe.includes("instagram") || probe.includes("insta") || rawTag === "ig" || rawSource === "ig" || rawMedium === "ig")
      return "instagram";
    if (
      probe.includes("facebook") ||
      rawTag === "fb" ||
      rawSource === "fb" ||
      rawMedium === "fb" ||
      probe.includes("fb_") ||
      rawSource.includes("facebook")
    )
      return "facebook";
    if (rawTag === "affiliate") return "affiliate";
    if (!rawTag || rawTag === "meta" || rawTag === "direct") return "direct";
    return rawTag;
  }

  // 1) Leads by Source Sheet — primarni izvor (pouzdaniji)
  const sheetRows = await getLeadsFromSheet();
  for (const row of sheetRows) {
    const d = row.date ? new Date(row.date) : null;
    if (fromDate && d && !isNaN(d.getTime()) && d < fromDate) continue;
    if (toDate && d && !isNaN(d.getTime())) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (d > endOfDay) continue;
    }
    const day = row.date
      ? (row.date.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? new Date(row.date).toISOString().slice(0, 10))
      : "";
    const key = `${(row.email ?? "").toLowerCase()}_${day}`;
    const tag = normalizeSourceTag(row.source_tag, row.utm_source, row.utm_medium, row.utm_campaign);
    leadByKey.set(key, tag);
  }

  // 2) Supabase — dopuna (leadovi koji nisu u Sheet-u)
  let query = supabase.from("leads").select("id, created_at, source_tag, utm_source, utm_medium, utm_campaign, email");
  if (fromDate && !isNaN(fromDate.getTime())) {
    query = query.gte("created_at", fromDate.toISOString());
  }
  if (toDate && !isNaN(toDate.getTime())) {
    const endOfDay = new Date(toDate);
    endOfDay.setHours(23, 59, 59, 999);
    query = query.lte("created_at", endOfDay.toISOString());
  }
  const { data: leadsSupabase } = await query.order("created_at", { ascending: false });
  const listSupabase = (leadsSupabase ?? []) as {
    id: string;
    created_at: string;
    source_tag: string | null;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    email?: string;
  }[];
  for (const lead of listSupabase) {
    const day = lead.created_at?.slice(0, 10) ?? "";
    const key = `${(lead.email ?? lead.id).toString().toLowerCase()}_${day}`;
    if (leadByKey.has(key)) continue; // Sheet već ima — prioritet
    leadByKey.set(
      key,
      normalizeSourceTag(lead.source_tag, lead.utm_source ?? null, lead.utm_medium ?? null, lead.utm_campaign ?? null)
    );
  }

  const bySource: Record<string, number> = {};
  for (const tag of leadByKey.values()) {
    bySource[tag] = (bySource[tag] ?? 0) + 1;
  }
  const sumBySource = Object.values(bySource).reduce((a, b) => a + b, 0);
  const total = leadByKey.size;
  if (sumBySource !== total) {
    console.warn(`Analytics: sum(bySource)=${sumBySource} !== total=${total}`);
  }

  const payload: Record<string, unknown> = {
    total,
    bySource,
    sumBySource,
    metaLeads: 0,
    tiktokLeads: bySource["tiktok"] ?? 0,
    direct: bySource["direct"] ?? 0,
    affiliate: bySource["affiliate"] ?? 0,
  };

  if (todayOnly) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Belgrade",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
    const h = parseInt(get("hour"), 10);
    const m = parseInt(get("minute"), 10);
    const s = parseInt(get("second"), 10);
    payload.secondsUntilMidnight = 24 * 3600 - h * 3600 - m * 60 - s;
    payload.belgradeTime = `${get("hour")}:${get("minute")}:${get("second")} (Beograd)`;
  }

  if (debug) {
    const sheetBySource: Record<string, number> = {};
    for (const row of sheetRows) {
      const tag = normalizeSourceTag(row.source_tag, row.utm_source, row.utm_medium, row.utm_campaign);
      sheetBySource[tag] = (sheetBySource[tag] ?? 0) + 1;
    }
    payload.debug = {
      sheetRowsTotal: sheetRows.length,
      sheetBySource,
      sheetSample: sheetRows.slice(0, 5).map((r) => ({
        date: r.date,
        source_tag: r.source_tag,
        utm_source: r.utm_source,
        utm_medium: r.utm_medium,
      })),
    };
  }

  return NextResponse.json(payload);
}
