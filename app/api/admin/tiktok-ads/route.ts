import { NextRequest, NextResponse } from "next/server";
import { isAdminApiAuthorized } from "@/lib/admin-api-auth";

const TT_API = "https://business-api.tiktok.com/open_api/v1.3";

type TikTokCampaignRow = {
  campaignId: string;
  campaignName: string;
  spend: number;
  leadsFromAds: number;
  cpl: number | null;
};

function num(v: unknown): number {
  if (v == null) return 0;
  const n = parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Za CPL želimo lead-specifične metrike. TikTok `conversion` je često SVE optimizovane
 * konverzije (kupovina, registracija, lead…) — ne koristimo ga kao podrazumevani lead broj
 * da brojevi ne budu veći od stvarnih leadova.
 */
function leadsFromMetrics(m: Record<string, unknown>): number {
  const sl = num(m.sales_lead);
  if (sl > 0) return Math.round(sl);
  const form = num(m.form);
  if (form > 0) return Math.round(form);
  if (process.env.TIKTOK_REPORT_CONVERSION_AS_LEAD === "1") {
    const conv = num(m.conversion);
    if (conv > 0) return Math.round(conv);
  }
  return 0;
}

async function fetchEnabledCampaignIds(
  accessToken: string,
  advertiserId: string
): Promise<Set<string> | null> {
  const ids = new Set<string>();
  let page = 1;
  try {
    while (page <= 50) {
      const u = new URL(`${TT_API}/campaign/get/`);
      u.searchParams.set("advertiser_id", advertiserId);
      u.searchParams.set("page", String(page));
      u.searchParams.set("page_size", "1000");
      const res = await fetch(u.toString(), {
        headers: { "Access-Token": accessToken },
        next: { revalidate: 0 },
      });
      const json = (await res.json()) as {
        code?: number;
        message?: string;
        data?: { list?: { campaign_id?: string; operation_status?: string }[]; page_info?: { total_page?: number } };
      };
      if (json.code !== 0) return null;
      const list = json.data?.list ?? [];
      for (const c of list) {
        const st = String(c.operation_status ?? "").toUpperCase();
        if (st === "ENABLE") ids.add(String(c.campaign_id ?? ""));
      }
      const totalPage = json.data?.page_info?.total_page ?? 1;
      if (page >= totalPage) break;
      page += 1;
    }
    return ids;
  } catch {
    return null;
  }
}

async function fetchIntegratedReportPage(
  accessToken: string,
  advertiserId: string,
  startDate: string,
  endDate: string,
  page: number,
  metricsJson: string
): Promise<{
  list: unknown[];
  totalPage: number;
  error?: string;
  code?: number;
}> {
  const u = new URL(`${TT_API}/report/integrated/get/`);
  u.searchParams.set("advertiser_id", advertiserId);
  u.searchParams.set("service_type", "AUCTION");
  u.searchParams.set("report_type", "BASIC");
  u.searchParams.set("data_level", "AUCTION_CAMPAIGN");
  u.searchParams.set("dimensions", JSON.stringify(["campaign_id"]));
  u.searchParams.set("metrics", metricsJson);
  u.searchParams.set("start_date", startDate);
  u.searchParams.set("end_date", endDate);
  u.searchParams.set("page", String(page));
  u.searchParams.set("page_size", "1000");

  const res = await fetch(u.toString(), {
    headers: { "Access-Token": accessToken },
    next: { revalidate: 0 },
  });
  const json = (await res.json()) as {
    code?: number;
    message?: string;
    data?: {
      list?: unknown[];
      page_info?: { total_page?: number };
    };
  };
  if (json.code !== 0) {
    return {
      list: [],
      totalPage: 0,
      error: json.message ?? `TikTok code ${json.code}`,
      code: json.code,
    };
  }
  const list = json.data?.list ?? [];
  const totalPage = json.data?.page_info?.total_page ?? 1;
  return { list, totalPage };
}

function parseReportRows(list: unknown[]): TikTokCampaignRow[] {
  const out: TikTokCampaignRow[] = [];
  for (const item of list) {
    if (typeof item !== "object" || !item) continue;
    const row = item as Record<string, unknown>;
    const dims = row.dimensions as Record<string, unknown> | undefined;
    const metricsRaw = row.metrics as Record<string, unknown> | undefined;
    const campaignId = String(dims?.campaign_id ?? row.campaign_id ?? "").trim();
    if (!campaignId) continue;

    const m = metricsRaw ?? row;
    const spend = num(m.spend);
    const leadsFromAds = leadsFromMetrics(m);
    const cpa = num(m.cost_per_conversion);
    const cpl =
      leadsFromAds > 0 ? spend / leadsFromAds : cpa > 0 && spend > 0 ? cpa : null;
    const campaignName = String(m.campaign_name ?? `Kampanja ${campaignId}`).trim() || campaignId;

    out.push({
      campaignId,
      campaignName,
      spend,
      leadsFromAds,
      cpl,
    });
  }
  return out;
}

export async function GET(req: NextRequest) {
  if (!(await isAdminApiAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = process.env.TIKTOK_ADS_ACCESS_TOKEN?.trim();
  const advertiserId = process.env.TIKTOK_ADVERTISER_ID?.trim();
  if (!accessToken || !advertiserId) {
    return NextResponse.json({
      configured: false,
      error: "TIKTOK_ADS_ACCESS_TOKEN ili TIKTOK_ADVERTISER_ID nisu postavljeni",
      spend: 0,
      leadsFromAds: 0,
      cpl: null as number | null,
      campaigns: [] as TikTokCampaignRow[],
    });
  }

  const url = req.nextUrl ?? new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const now = new Date();
  const endDate = to || now.toISOString().slice(0, 10);
  const startDate =
    from ||
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const metricsSets = [
    JSON.stringify([
      "campaign_name",
      "spend",
      "sales_lead",
      "conversion",
      "cost_per_conversion",
    ]),
    JSON.stringify(["campaign_name", "spend", "sales_lead", "cost_per_conversion"]),
    JSON.stringify(["spend", "conversion"]),
  ];

  let allRows: TikTokCampaignRow[] = [];
  let lastErr: string | undefined;

  for (const metricsJson of metricsSets) {
    allRows = [];
    lastErr = undefined;
    let page = 1;
    let totalPage = 1;
    try {
      while (page <= totalPage && page <= 50) {
        const chunk = await fetchIntegratedReportPage(
          accessToken,
          advertiserId,
          startDate,
          endDate,
          page,
          metricsJson
        );
        if (chunk.error && chunk.code !== 0) {
          lastErr = chunk.error;
          allRows = [];
          break;
        }
        if (chunk.error) lastErr = chunk.error;
        totalPage = chunk.totalPage || 1;
        allRows.push(...parseReportRows(chunk.list));
        page += 1;
      }
      if (allRows.length > 0 || !lastErr) break;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : "TikTok greška";
    }
  }

  if (lastErr && allRows.length === 0) {
    return NextResponse.json({
      configured: true,
      error: lastErr,
      spend: 0,
      leadsFromAds: 0,
      cpl: null,
      campaigns: [],
    });
  }

  const enabledIds = await fetchEnabledCampaignIds(accessToken, advertiserId);
  let rows = allRows;
  if (enabledIds && enabledIds.size > 0) {
    rows = allRows.filter((r) => enabledIds.has(r.campaignId));
  }

  const byId = new Map<string, TikTokCampaignRow>();
  for (const r of rows) {
    const prev = byId.get(r.campaignId);
    if (!prev) {
      byId.set(r.campaignId, { ...r });
    } else {
      prev.spend += r.spend;
      prev.leadsFromAds += r.leadsFromAds;
      prev.campaignName = r.campaignName || prev.campaignName;
      prev.cpl = prev.leadsFromAds > 0 ? prev.spend / prev.leadsFromAds : null;
    }
  }

  const campaigns = Array.from(byId.values())
    .filter((c) => c.spend > 0 || c.leadsFromAds > 0)
    .sort((a, b) => b.spend - a.spend);

  let spend = 0;
  let leadsFromAds = 0;
  for (const c of campaigns) {
    spend += c.spend;
    leadsFromAds += c.leadsFromAds;
  }
  const cpl = leadsFromAds > 0 ? spend / leadsFromAds : null;

  const payload: Record<string, unknown> = {
    configured: true,
    spend,
    leadsFromAds,
    cpl,
    campaigns,
    startDate,
    endDate,
  };

  if (url.searchParams.get("debug") === "1") {
    payload._debug = {
      campaigns: campaigns.length,
      rowsParsed: allRows.length,
      filteredToEnabled: enabledIds != null && enabledIds.size > 0,
    };
  }

  return NextResponse.json(payload);
}
