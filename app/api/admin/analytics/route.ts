import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getLeadsFromSheet, type LeadsSourceRow } from "@/lib/leads-sheet";
import { isAdminApiAuthorized } from "@/lib/admin-api-auth";
import { withTimeout } from "@/lib/with-timeout";
import { SOURCE_TAG_LEAD_MAGNET, SOURCE_TAG_LEAD_MAGNET_AFFILIATE } from "@/lib/lead-source-tags";
import {
  belgradeYmdUtcInclusiveBounds,
  extractYmdFromSheetDate,
  lastInclusiveBelgradeYmdForLegacyCutoff,
  queryParamToYmd,
  sheetRowYmdAllowedForLegacy,
  sheetRowYmdInPeriod,
} from "@/lib/analytics-legacy";

/** Produženo trajanje na Vercel-u — Sheet + Supabase mogu dugo da traju na velikim tabelama. */
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!(await isAdminApiAuthorized(req))) {
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
  const legacyMode = url.searchParams.get("legacy") === "1";
  let legacyCutoffDate: Date | null = null;
  if (legacyMode) {
    const raw = process.env.ADMIN_ANALYTICS_LEGACY_CUTOFF_ISO?.trim();
    if (!raw) {
      return NextResponse.json(
        { error: "Legacy mode requires ADMIN_ANALYTICS_LEGACY_CUTOFF_ISO" },
        { status: 503 }
      );
    }
    legacyCutoffDate = new Date(raw);
    if (isNaN(legacyCutoffDate.getTime())) {
      return NextResponse.json({ error: "Invalid ADMIN_ANALYTICS_LEGACY_CUTOFF_ISO" }, { status: 400 });
    }
  }
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

  const fromYmd = queryParamToYmd(from);
  const toYmd = queryParamToYmd(to);

  const supabase = createClient(supabaseUrl, supabaseKey);
  const leadByEmail = new Map<string, { tag: string; ts: number; order: number }>();
  let orderCounter = 0;

  function upsertLeadByEmail(emailKey: string, tag: string, ts: number) {
    const current = leadByEmail.get(emailKey);
    const nextOrder = orderCounter++;
    if (!current) {
      leadByEmail.set(emailKey, { tag, ts, order: nextOrder });
      return;
    }
    // Ako isti email dođe više puta, čuvamo noviji ulaz (prepis kampanje po novijem dolasku).
    if (ts > current.ts || (ts === current.ts && nextOrder > current.order)) {
      leadByEmail.set(emailKey, { tag, ts, order: nextOrder });
    }
  }

  function normalizeSourceTag(
    tag: string | null | undefined,
    utmSource: string | null | undefined,
    utmMedium: string | null | undefined,
    utmCampaign: string | null | undefined,
    affiliateCode?: string | null | undefined
  ): string {
    const rawTag = (tag ?? "").trim().toLowerCase();
    if (rawTag === SOURCE_TAG_LEAD_MAGNET || rawTag === SOURCE_TAG_LEAD_MAGNET_AFFILIATE) {
      return rawTag;
    }
    if ((affiliateCode ?? "").toString().trim()) return "affiliate";
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
  // Datum: YYYY-MM-DD u Beogradu + period Od–Do + legacy presek (ne mešati sa Date() u lokalnom TZ servera).
  const sheetRows = await withTimeout(
    getLeadsFromSheet(),
    22_000,
    [] as LeadsSourceRow[],
    "admin/analytics getLeadsFromSheet"
  );
  let sheetRowsUsed = 0;
  for (const row of sheetRows) {
    const rowYmd = extractYmdFromSheetDate(row.date);
    if (!rowYmd) continue;
    if (!sheetRowYmdInPeriod(rowYmd, fromYmd, toYmd)) continue;
    if (legacyCutoffDate && !sheetRowYmdAllowedForLegacy(rowYmd, legacyCutoffDate)) continue;
    sheetRowsUsed += 1;
    const emailKey = (row.email ?? "").trim().toLowerCase();
    if (!emailKey) continue;
    const tag = normalizeSourceTag(
      row.source_tag,
      row.utm_source,
      row.utm_medium,
      row.utm_campaign,
      row.affiliate_code
    );
    const ts = Date.parse(`${rowYmd}T12:00:00.000Z`);
    upsertLeadByEmail(emailKey, tag, Number.isNaN(ts) ? 0 : ts);
  }

  // 2) Supabase — dopuna (leadovi koji nisu u Sheet-u)
  // Filter created_at po istom kalendarskom danu kao Sheet (Europe/Belgrade), ne po `Date("YYYY-MM-DD")` (UTC ponoć).
  // PostgREST podrazumevano max 1000 redova po zahtevu — mora paginacija.
  let supabaseGteIso: string | null = null;
  let supabaseLteIso: string | null = null;
  if (fromYmd) {
    const b = belgradeYmdUtcInclusiveBounds(fromYmd);
    if (b) supabaseGteIso = b.startIso;
  }
  if (toYmd) {
    const b = belgradeYmdUtcInclusiveBounds(toYmd);
    if (b) supabaseLteIso = b.endIso;
  }
  if (legacyCutoffDate) {
    const leg = legacyCutoffDate.toISOString();
    if (!supabaseLteIso || supabaseLteIso > leg) {
      supabaseLteIso = leg;
    }
  }

  type LeadRow = {
    id: string;
    created_at: string;
    source_tag: string | null;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    affiliate_code?: string | null;
    email?: string;
  };

  const PAGE = 1000;
  /** Zaštita od beskonačnog paginiranja (npr. loš upit); 80 strana = 80k redova. */
  const MAX_SUPABASE_PAGES = 80;
  const listSupabase: LeadRow[] = [];
  for (let offset = 0, page = 0; page < MAX_SUPABASE_PAGES; offset += PAGE, page += 1) {
    let q = supabase
      .from("leads")
      .select("id, created_at, source_tag, utm_source, utm_medium, utm_campaign, affiliate_code, email");
    if (supabaseGteIso) {
      q = q.gte("created_at", supabaseGteIso);
    }
    if (supabaseLteIso) {
      q = q.lte("created_at", supabaseLteIso);
    }
    const { data: batch, error } = await q.order("created_at", { ascending: true }).range(offset, offset + PAGE - 1);
    if (error) {
      console.error("admin analytics leads:", error.message);
      break;
    }
    const rows = (batch ?? []) as LeadRow[];
    listSupabase.push(...rows);
    if (rows.length < PAGE) break;
  }
  for (const lead of listSupabase) {
    const emailKey = (lead.email ?? "").trim().toLowerCase();
    if (!emailKey) continue;
    const tag = normalizeSourceTag(
      lead.source_tag,
      lead.utm_source ?? null,
      lead.utm_medium ?? null,
      lead.utm_campaign ?? null,
      lead.affiliate_code ?? null
    );
    const ts = Date.parse(lead.created_at ?? "");
    upsertLeadByEmail(emailKey, tag, Number.isNaN(ts) ? 0 : ts);
  }

  const bySource: Record<string, number> = {};
  for (const entry of leadByEmail.values()) {
    bySource[entry.tag] = (bySource[entry.tag] ?? 0) + 1;
  }
  const sumBySource = Object.values(bySource).reduce((a, b) => a + b, 0);
  const total = leadByEmail.size;
  if (sumBySource !== total) {
    console.warn(`Analytics: sum(bySource)=${sumBySource} !== total=${total}`);
  }

  const ig = bySource["instagram"] ?? 0;
  const fb = bySource["facebook"] ?? 0;
  const payload: Record<string, unknown> = {
    total,
    bySource,
    sumBySource,
    metaLeads: ig + fb,
    tiktokLeads: bySource["tiktok"] ?? 0,
    direct: bySource["direct"] ?? 0,
    affiliate: bySource["affiliate"] ?? 0,
    /** Broj redova iz Supabase u istom created_at opsegu (pre spajanja sa Sheet-om). Za poređenje sa Table Editor COUNT. */
    supabaseRowsInPeriod: listSupabase.length,
    /** Jedinstveni email u merged skupu — glavni broj u adminu; Sheet+Supabase deduplikovano. */
    countingModel: "unique_email_sheet_plus_supabase_belgrade_day_bounds",
    supabaseCreatedAtGte: supabaseGteIso,
    supabaseCreatedAtLte: supabaseLteIso,
  };
  if (legacyMode && legacyCutoffDate) {
    payload.legacyCutoffAt = legacyCutoffDate.toISOString();
    payload.legacyLastInclusiveSheetYmd = lastInclusiveBelgradeYmdForLegacyCutoff(legacyCutoffDate);
  }

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
      const tag = normalizeSourceTag(
        row.source_tag,
        row.utm_source,
        row.utm_medium,
        row.utm_campaign,
        row.affiliate_code
      );
      sheetBySource[tag] = (sheetBySource[tag] ?? 0) + 1;
    }
    payload.debug = {
      sheetRowsTotal: sheetRows.length,
      sheetRowsAfterFilter: sheetRowsUsed,
      supabaseLeadsFetched: listSupabase.length,
      supabaseCreatedAtGte: supabaseGteIso,
      supabaseCreatedAtLte: supabaseLteIso,
      mergedUniqueEmails: leadByEmail.size,
      legacyMode,
      legacyLastInclusiveSheetYmd: legacyCutoffDate
        ? lastInclusiveBelgradeYmdForLegacyCutoff(legacyCutoffDate)
        : null,
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
