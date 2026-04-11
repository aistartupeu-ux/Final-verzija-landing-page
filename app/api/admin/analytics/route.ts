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
  sheetRowYmdAllowedForLegacy,
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

/** PostgREST vraća grešku ako kolona nije u šemi (npr. migracija nije primenjena u prod). */
const ADMIN_ANALYTICS_LEADS_SELECT_FALLBACKS = [
  "id, created_at, source_tag, utm_source, utm_medium, utm_campaign, affiliate_code, email",
  "id, created_at, source_tag, utm_source, utm_medium, utm_campaign, email",
  "id, created_at, source_tag, utm_source, utm_campaign, email",
  "id, created_at, source_tag, email",
] as const;

async function fetchPaginatedSupabaseLeadsForAdmin(
  supabase: SupabaseClient,
  supabaseGteIso: string | null,
  supabaseLteIso: string | null
): Promise<{ rows: AdminAnalyticsLeadRow[]; truncated: boolean }> {
  for (const selectList of ADMIN_ANALYTICS_LEADS_SELECT_FALLBACKS) {
    const listSupabase: AdminAnalyticsLeadRow[] = [];
    let failed = false;
    let truncated = false;
    for (let page = 0; page < ADMIN_ANALYTICS_MAX_SUPABASE_PAGES; page++) {
      const offset = page * ADMIN_ANALYTICS_PAGE;
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
        console.error("admin analytics leads:", selectList, error.code ?? "", error.message);
        failed = true;
        break;
      }
      const rows = (batch ?? []) as unknown as AdminAnalyticsLeadRow[];
      listSupabase.push(...rows);
      if (rows.length < ADMIN_ANALYTICS_PAGE) break;
      if (page === ADMIN_ANALYTICS_MAX_SUPABASE_PAGES - 1) {
        truncated = true;
        console.warn(
          `admin analytics: Supabase pagination cap (${ADMIN_ANALYTICS_MAX_SUPABASE_PAGES * ADMIN_ANALYTICS_PAGE} redova); suzi Od–Da u adminu.`
        );
      }
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
  const affTrim = (affiliateCode ?? "").toString().trim();
  if (affTrim) {
    const al = affTrim.toLowerCase();
    if (al !== SHEET_CAMPAIGN_REF_LM.toLowerCase() && al !== SHEET_CAMPAIGN_REF_GW.toLowerCase()) {
      return "affiliate";
    }
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
  if (rawTag === "affiliate") return "affiliate";
  if (!rawTag || rawTag === "meta" || rawTag === "direct") return "direct";
  return rawTag;
}

/** Vercel Hobby često max ~10–60s; Pro može više. Paginacija je ograničena da ne prekorači funkciju. */
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

  /**
   * Bez from/to (i bez today=1) ranije je Supabase išao bez created_at filtera — ceo `leads`,
   * što na velikim tabelama ide u minutima / 504 i klijent ostane na spinneru.
   * Podrazumevamo poslednjih 30 kalendarskih dana (Beograd), u skladu sa admin UI.
   */
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
  /** Izvor istine za ukupno / po izvoru: samo Sheet (jedinstveni email u periodu). */
  const sheetLeadByEmail = new Map<string, { tag: string; ts: number; order: number }>();
  let sheetOrderCounter = 0;

  function upsertSheetLead(emailKey: string, tag: string, ts: number) {
    const current = sheetLeadByEmail.get(emailKey);
    const nextOrder = sheetOrderCounter++;
    if (!current) {
      sheetLeadByEmail.set(emailKey, { tag, ts, order: nextOrder });
      return;
    }
    if (ts > current.ts || (ts === current.ts && nextOrder > current.order)) {
      sheetLeadByEmail.set(emailKey, { tag, ts, order: nextOrder });
    }
  }

  // 1) Sheet + Supabase u paraleli (ranije sekvencijalno — duplo čekanje na wall-clock).
  // Datum: YYYY-MM-DD u Beogradu + period Od–Do + legacy presek (ne mešati sa Date() u lokalnom TZ servera).
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
  const sheetLeadsByDay: Record<string, number> = {};

  let sheetRowsUsed = 0;
  for (const row of sheetRows) {
    const rowYmd = extractYmdFromSheetDate(row.date);
    if (!rowYmd) continue;
    if (!sheetRowYmdInPeriod(rowYmd, fromYmd, toYmd)) continue;
    if (legacyCutoffDate && !sheetRowYmdAllowedForLegacy(rowYmd, legacyCutoffDate)) continue;
    sheetRowsUsed += 1;
    const tab = row.sheetTab ?? "main";
    if (tab === "lm") sheetRowsByTab.lm += 1;
    else if (tab === "gw") sheetRowsByTab.gw += 1;
    else sheetRowsByTab.main += 1;
    sheetLeadsByDay[rowYmd] = (sheetLeadsByDay[rowYmd] ?? 0) + 1;
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
    upsertSheetLead(emailKey, tag, Number.isNaN(ts) ? 0 : ts);
  }

  // 2) Supabase — samo provera (jedinstveni email u periodu), bez uticaja na total/bySource.
  const supabaseEmailsInPeriod = new Set<string>();
  for (const lead of listSupabase) {
    const emailKey = (lead.email ?? "").trim().toLowerCase();
    if (emailKey) supabaseEmailsInPeriod.add(emailKey);
  }
  const sheetEmails = new Set(sheetLeadByEmail.keys());
  let verifyEmailsOnlyInSheet = 0;
  for (const e of sheetEmails) {
    if (!supabaseEmailsInPeriod.has(e)) verifyEmailsOnlyInSheet += 1;
  }
  let verifyEmailsOnlyInSupabase = 0;
  for (const e of supabaseEmailsInPeriod) {
    if (!sheetEmails.has(e)) verifyEmailsOnlyInSupabase += 1;
  }

  const bySource: Record<string, number> = {};
  for (const entry of sheetLeadByEmail.values()) {
    bySource[entry.tag] = (bySource[entry.tag] ?? 0) + 1;
  }
  const sumBySource = Object.values(bySource).reduce((a, b) => a + b, 0);
  const total = sheetLeadByEmail.size;
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
    /** Broj redova iz Supabase u istom created_at opsegu. Provera / poređenje sa Sheet-om. */
    supabaseRowsInPeriod: listSupabase.length,
    /** Jedinstveni email u Supabase u periodu (provera). */
    supabaseUniqueEmailsInPeriod: supabaseEmailsInPeriod.size,
    /** U Sheet jedinstvenom skupu, a nema u Supabase u periodu. */
    verifyEmailsOnlyInSheet,
    /** U Supabase u periodu, a nema u Sheet jedinstvenom skupu. */
    verifyEmailsOnlyInSupabase,
    /** Sheet redovi u periodu (List1 + LM + GW), posle datumskega filtera; jedan red = jedna prijava u tabu. */
    sheetRowsInPeriod: sheetRowsUsed,
    sheetRowsByTab,
    /** Broj Sheet redova po kalendarskom danu (Beograd, kolona A datum). */
    sheetLeadsByDay: Object.fromEntries(Object.entries(sheetLeadsByDay).sort(([a], [b]) => a.localeCompare(b))),
    /** Glavni brojevi = Sheet; Supabase je uporedna provera. */
    countingModel: "unique_email_sheet_primary_supabase_verify_belgrade_day_bounds",
    supabaseCreatedAtGte: supabaseGteIso,
    supabaseCreatedAtLte: supabaseLteIso,
    /** true ako je dostignut limit stranica (200×1000) — suzi Od–Da. */
    supabaseFetchTruncated,
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
      sheetUniqueEmails: sheetLeadByEmail.size,
      supabaseUniqueEmails: supabaseEmailsInPeriod.size,
      verifyEmailsOnlyInSheet,
      verifyEmailsOnlyInSupabase,
      legacyMode,
      legacyLastInclusiveSheetYmd: legacyCutoffDate
        ? lastInclusiveBelgradeYmdForLegacyCutoff(legacyCutoffDate)
        : null,
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
