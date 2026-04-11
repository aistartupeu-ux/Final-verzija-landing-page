import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getLeadsFromSheet, SHEET_CAMPAIGN_REF_GW, SHEET_CAMPAIGN_REF_LM } from "@/lib/leads-sheet";
import { isAdminApiAuthorized } from "@/lib/admin-api-auth";
import { SOURCE_TAG_LEAD_MAGNET, SOURCE_TAG_LEAD_MAGNET_AFFILIATE } from "@/lib/lead-source-tags";
import {
  belgradeYmdUtcInclusiveBounds,
  extractYmdFromSheetDate,
  lastInclusiveBelgradeYmdForLegacyCutoff,
  queryParamToYmd,
  sheetRowYmdInPeriod,
} from "@/lib/analytics-legacy";

type AdminAnalyticsLeadRow = {
  id: string;
  created_at: string;
  source_tag: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  affiliate_code?: string | null;
  email?: string;
};

const ADMIN_ANALYTICS_PAGE = 1000;
const ADMIN_ANALYTICS_MAX_SUPABASE_PAGES = 200;
const ADMIN_ANALYTICS_SUPABASE_PARALLEL_PAGES = 5;

const REF_LM_LC = SHEET_CAMPAIGN_REF_LM.toLowerCase();
const REF_GW_LC = SHEET_CAMPAIGN_REF_GW.toLowerCase();

const ADMIN_ANALYTICS_LEADS_SELECT_FALLBACKS = [
  "id, created_at, source_tag, utm_source, utm_medium, utm_campaign, affiliate_code, email",
  "id, created_at, source_tag, utm_source, utm_medium, utm_campaign, email",
  "id, created_at, source_tag, utm_source, utm_campaign, email",
  "id, created_at, source_tag, email",
] as const;

async function fetchAdminLeadsPage(
  supabase: SupabaseClient,
  selectList: string,
  supabaseGteIso: string | null,
  supabaseLteIso: string | null,
  pageIndex: number
): Promise<{ rows: AdminAnalyticsLeadRow[]; error: { code?: string; message: string } | null }> {
  const offset = pageIndex * ADMIN_ANALYTICS_PAGE;
  let q = supabase.from("leads").select(selectList);
  if (supabaseGteIso) {
    q = q.gte("created_at", supabaseGteIso);
  }
  if (supabaseLteIso) {
    q = q.lte("created_at", supabaseLteIso);
  }
  const { data: batch, error } = await q
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .range(offset, offset + ADMIN_ANALYTICS_PAGE - 1);
  if (error) {
    return { rows: [], error: { code: error.code, message: error.message } };
  }
  return { rows: (batch ?? []) as unknown as AdminAnalyticsLeadRow[], error: null };
}

async function fetchPaginatedSupabaseLeadsForAdmin(
  supabase: SupabaseClient,
  supabaseGteIso: string | null,
  supabaseLteIso: string | null
): Promise<{ rows: AdminAnalyticsLeadRow[]; truncated: boolean }> {
  for (const selectList of ADMIN_ANALYTICS_LEADS_SELECT_FALLBACKS) {
    const listSupabase: AdminAnalyticsLeadRow[] = [];
    let failed = false;
    let truncated = false;
    let nextPage = 0;

    while (nextPage < ADMIN_ANALYTICS_MAX_SUPABASE_PAGES) {
      const batchSize = Math.min(
        ADMIN_ANALYTICS_SUPABASE_PARALLEL_PAGES,
        ADMIN_ANALYTICS_MAX_SUPABASE_PAGES - nextPage
      );
      const pageIndexes = Array.from({ length: batchSize }, (_, i) => nextPage + i);
      const results = await Promise.all(
        pageIndexes.map((p) =>
          fetchAdminLeadsPage(supabase, selectList, supabaseGteIso, supabaseLteIso, p)
        )
      );

      let stop = false;
      for (let j = 0; j < results.length; j++) {
        const { rows, error } = results[j];
        if (error) {
          console.error("admin analytics leads:", selectList, error.code ?? "", error.message);
          failed = true;
          stop = true;
          break;
        }
        listSupabase.push(...rows);
        const pIdx = pageIndexes[j];
        if (rows.length < ADMIN_ANALYTICS_PAGE) {
          stop = true;
          break;
        }
        if (pIdx === ADMIN_ANALYTICS_MAX_SUPABASE_PAGES - 1) {
          truncated = true;
          console.warn(
            `admin analytics: Supabase pagination cap (${ADMIN_ANALYTICS_MAX_SUPABASE_PAGES * ADMIN_ANALYTICS_PAGE} redova); suzi Od–Da u adminu.`
          );
          stop = true;
          break;
        }
      }
      if (failed || stop) break;
      nextPage += batchSize;
    }

    if (!failed) return { rows: listSupabase, truncated };
  }
  return { rows: [], truncated: false };
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
  const rawSource = (utmSource ?? "").trim().toLowerCase();
  const rawMedium = (utmMedium ?? "").trim().toLowerCase();
  const rawCampaign = (utmCampaign ?? "").trim().toLowerCase();
  const probe = `${rawTag} ${rawSource} ${rawMedium} ${rawCampaign}`;

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

  const affTrim = (affiliateCode ?? "").toString().trim();
  if (affTrim) {
    const al = affTrim.toLowerCase();
    if (al !== REF_LM_LC && al !== REF_GW_LC) {
      return "affiliate";
    }
  }
  if (rawTag === "affiliate") return "affiliate";
  if (!rawTag || rawTag === "meta" || rawTag === "direct") return "direct";
  return rawTag;
}

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
    if (Number.isNaN(legacyCutoffDate.getTime())) {
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

  let fromYmd = queryParamToYmd(from);
  let toYmd = queryParamToYmd(to);

  if (!todayOnly && fromYmd === null && toYmd === null) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Belgrade",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const todayBelgrade = `${get("year")}-${get("month")}-${get("day")}`;
    const d = new Date(`${todayBelgrade}T12:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() - 29);
    fromYmd = d.toISOString().slice(0, 10);
    toYmd = todayBelgrade;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const leadByEmail = new Map<string, { tag: string; ts: number; order: number }>();
  let leadOrderCounter = 0;

  function upsertLeadByEmail(emailKey: string, tag: string, ts: number) {
    const current = leadByEmail.get(emailKey);
    const nextOrder = leadOrderCounter++;
    if (!current) {
      leadByEmail.set(emailKey, { tag, ts, order: nextOrder });
      return;
    }
    if (ts > current.ts || (ts === current.ts && nextOrder > current.order)) {
      leadByEmail.set(emailKey, { tag, ts, order: nextOrder });
    }
  }

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

  const legacyLastInclusiveSheetYmd = legacyCutoffDate
    ? lastInclusiveBelgradeYmdForLegacyCutoff(legacyCutoffDate)
    : null;

  let sheetFetchMs = 0;
  let supabaseFetchMs = 0;
  const [sheetRows, supabaseBundle] = await Promise.all([
    (async () => {
      const t = Date.now();
      const r = await getLeadsFromSheet();
      sheetFetchMs = Date.now() - t;
      return r;
    })(),
    (async () => {
      const t = Date.now();
      const r = await fetchPaginatedSupabaseLeadsForAdmin(supabase, supabaseGteIso, supabaseLteIso);
      supabaseFetchMs = Date.now() - t;
      return r;
    })(),
  ]);

  const listSupabase = supabaseBundle.rows;
  const supabaseFetchTruncated = supabaseBundle.truncated;

  const sheetRowsByTab = { main: 0, lm: 0, gw: 0 };

  let sheetRowsUsed = 0;
  for (const row of sheetRows) {
    const rowYmd = extractYmdFromSheetDate(row.date);
    if (!rowYmd) continue;
    if (!sheetRowYmdInPeriod(rowYmd, fromYmd, toYmd)) continue;
    if (legacyLastInclusiveSheetYmd !== null && rowYmd > legacyLastInclusiveSheetYmd) continue;
    sheetRowsUsed += 1;
    const tab = row.sheetTab ?? "main";
    if (tab === "lm") sheetRowsByTab.lm += 1;
    else if (tab === "gw") sheetRowsByTab.gw += 1;
    else sheetRowsByTab.main += 1;
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
    supabaseRowsInPeriod: listSupabase.length,
    sheetRowsInPeriod: sheetRowsUsed,
    sheetRowsByTab,
    countingModel: "unique_email_sheet_plus_supabase_belgrade_day_bounds",
    supabaseCreatedAtGte: supabaseGteIso,
    supabaseCreatedAtLte: supabaseLteIso,
    supabaseFetchTruncated,
  };
  if (legacyMode && legacyCutoffDate && legacyLastInclusiveSheetYmd !== null) {
    payload.legacyCutoffAt = legacyCutoffDate.toISOString();
    payload.legacyLastInclusiveSheetYmd = legacyLastInclusiveSheetYmd;
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
    const h = Number.parseInt(get("hour"), 10);
    const m = Number.parseInt(get("minute"), 10);
    const s = Number.parseInt(get("second"), 10);
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
      sheetFetchMs,
      supabaseFetchMs,
      sheetRowsTotal: sheetRows.length,
      sheetRowsAfterFilter: sheetRowsUsed,
      supabaseLeadsFetched: listSupabase.length,
      supabaseFetchTruncated,
      supabaseCreatedAtGte: supabaseGteIso,
      supabaseCreatedAtLte: supabaseLteIso,
      mergedUniqueEmails: leadByEmail.size,
      legacyMode,
      legacyLastInclusiveSheetYmd: legacyLastInclusiveSheetYmd,
      sheetBySource,
      sheetSample: sheetRows.slice(0, 5).map((r) => ({
        date: r.date,
        sheetTab: r.sheetTab ?? "main",
        source_tag: r.source_tag,
        utm_source: r.utm_source,
        utm_medium: r.utm_medium,
      })),
    };
  }

  return NextResponse.json(payload);
}
