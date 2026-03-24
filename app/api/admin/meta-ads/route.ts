import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken } from "@/lib/admin-session";
import { getAdminAnalyticsSecret } from "@/lib/admin-secret";
import { getCookieFromHeader } from "@/lib/cookie-header";

async function isAdminAuthorized(req: NextRequest): Promise<boolean> {
  const expected = getAdminAnalyticsSecret();
  if (!expected) return false;

  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (bearerSecret === expected) return true;

  const url = req.nextUrl ?? new URL(req.url);
  const paramSecret = url.searchParams.get("secret");
  if (paramSecret === expected) return true;

  const sessionToken = getCookieFromHeader(req.headers.get("cookie"), "admin_session");
  if (sessionToken && (await verifyAdminSessionToken(sessionToken, expected))) return true;

  return false;
}

type MetaPlatformData = {
  spend: number;
  leads: number;
  cpl: number | null;
};

type CampaignCplRow = {
  campaignId: string;
  campaignName: string;
  instagram: MetaPlatformData;
  facebook: MetaPlatformData;
  totalSpend: number;
  totalLeads: number;
  blendedCpl: number | null;
};

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.META_ADS_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const campaignName = process.env.META_LEAD_CAMPAIGN_NAME?.trim(); // npr. "MAD - AIH - Website Leads - 19.09.26"
  if (!token || !adAccountId) {
    return NextResponse.json({
      configured: false,
      error: "META_ADS_ACCESS_TOKEN ili META_AD_ACCOUNT_ID nisu postavljeni",
      instagram: { spend: 0, leads: 0, cpl: null },
      facebook: { spend: 0, leads: 0, cpl: null },
      campaigns: [] as CampaignCplRow[],
    });
  }

  const url = req.nextUrl ?? new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  let datePreset = "last_30d";
  if (from && to) {
    datePreset = ""; // koristićemo time_range
  }

  const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const timeRange = from && to
    ? `{"since":"${from}","until":"${to}"}`
    : undefined;

  let insightsUrl = `${accountId}/insights`;
  let campaignId: string | null = null;
  let activeCampaignIds: Set<string> = new Set();
  const campaignIdToName = new Map<string, string>();

  // Uvek učitaj aktivne kampanje — CPL samo iz aktivnih
  try {
    const campParams = new URLSearchParams({
      access_token: token,
      fields: "id,name,effective_status",
      limit: "500",
    });
    const campRes = await fetch(
      `https://graph.facebook.com/v21.0/${accountId}/campaigns?${campParams}`,
      { next: { revalidate: 0 } }
    );
    const campJson = await campRes.json();
    const campaigns = (campJson.data ?? []) as { id: string; name: string; effective_status?: string }[];
    for (const c of campaigns) {
      campaignIdToName.set(c.id, c.name?.trim() || c.id);
    }
    const active = campaigns.filter((c) => c.effective_status === "ACTIVE");
    active.forEach((c) => activeCampaignIds.add(c.id));

    if (campaignName) {
      const match = active.find(
        (c) => c.name?.trim() === campaignName || c.name?.includes(campaignName)
      );
      if (match) {
        campaignId = match.id;
        insightsUrl = `${match.id}/insights`;
        activeCampaignIds = new Set([match.id]);
      }
    }
  } catch (e) {
    console.warn("Meta campaigns fetch failed:", e);
  }

  const params = new URLSearchParams({
    access_token: token,
    fields: "spend,actions,cost_per_action_type,campaign_id",
    breakdowns: "publisher_platform",
    limit: "500",
  });
  if (timeRange) {
    params.set("time_range", timeRange);
  } else {
    params.set("date_preset", datePreset);
  }
  if (!campaignId) {
    params.set("level", "campaign");
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${insightsUrl}?${params}`,
      { next: { revalidate: 0 } }
    );
    const json = await res.json();

    if (!res.ok) {
      console.error("Meta Ads API error:", json);
      return NextResponse.json({
        error: json?.error?.message ?? "Meta API greška",
        configured: true,
        instagram: { spend: 0, leads: 0, cpl: null },
        facebook: { spend: 0, leads: 0, cpl: null },
        campaigns: [] as CampaignCplRow[],
      });
    }

    function countLeads(actions: { action_type?: string; value?: string }[] | undefined): number {
      if (!Array.isArray(actions)) return 0;
      let n = 0;
      for (const a of actions) {
        const t = (a.action_type ?? "").toLowerCase();
        if (t.includes("lead") || t === "onsite_conversion.lead" || t.includes("lead_gen")) {
          n += parseInt(String(a.value ?? "0"), 10) || 0;
        }
      }
      return n;
    }

    function getCplFromCostPerAction(costPerActions: { action_type?: string; value?: string }[] | undefined): number | null {
      if (!Array.isArray(costPerActions)) return null;
      for (const c of costPerActions) {
        const t = (c.action_type ?? "").toLowerCase();
        if (t.includes("lead") || t.includes("lead_gen")) {
          const v = parseFloat(String(c.value ?? "0"));
          return v > 0 ? v : null;
        }
      }
      return null;
    }

    let data = json.data ?? [];
    if (!campaignId && activeCampaignIds.size > 0) {
      data = data.filter((row: { campaign_id?: string }) => {
        const cid = row.campaign_id;
        return cid && activeCampaignIds.has(cid);
      });
    }

    const byPlatform: Record<string, MetaPlatformData> = {
      instagram: { spend: 0, leads: 0, cpl: null },
      facebook: { spend: 0, leads: 0, cpl: null },
    };

    type CampBucket = {
      campaignId: string;
      campaignName: string;
      instagram: MetaPlatformData;
      facebook: MetaPlatformData;
    };

    const byCampaign = new Map<string, CampBucket>();

    function ensureCampaignBucket(cid: string, fallbackName: string): CampBucket {
      let b = byCampaign.get(cid);
      if (!b) {
        b = {
          campaignId: cid,
          campaignName: fallbackName,
          instagram: { spend: 0, leads: 0, cpl: null },
          facebook: { spend: 0, leads: 0, cpl: null },
        };
        byCampaign.set(cid, b);
      }
      return b;
    }

    for (const row of data) {
      const rowCid = String((row as { campaign_id?: string }).campaign_id ?? campaignId ?? "").trim();
      if (!rowCid) continue;

      const fallbackName = campaignIdToName.get(rowCid) || rowCid;
      const bucket = ensureCampaignBucket(rowCid, fallbackName);
      bucket.campaignName = campaignIdToName.get(rowCid) || bucket.campaignName;

      const platform = (row.publisher_platform ?? "unknown").toLowerCase();
      const spend = parseFloat(String((row as { spend?: string }).spend ?? 0)) || 0;
      const leads = countLeads((row as { actions?: { action_type?: string; value?: string }[] }).actions);
      const metaCpl = getCplFromCostPerAction(
        (row as { cost_per_action_type?: { action_type?: string; value?: string }[] }).cost_per_action_type
      );

      const addTo = (slot: MetaPlatformData) => {
        slot.spend += spend;
        slot.leads += leads;
        if (metaCpl != null && slot.cpl == null) slot.cpl = metaCpl;
      };

      if (platform === "instagram" || platform === "ig") {
        addTo(bucket.instagram);
        addTo(byPlatform.instagram);
      } else if (platform === "facebook" || platform === "fb") {
        addTo(bucket.facebook);
        addTo(byPlatform.facebook);
      }
    }

    for (const p of ["instagram", "facebook"] as const) {
      const d = byPlatform[p];
      if (d.cpl == null) d.cpl = d.leads > 0 ? d.spend / d.leads : null;
    }

    const campaigns: CampaignCplRow[] = Array.from(byCampaign.values())
      .map((b) => {
        const ig = b.instagram;
        const fb = b.facebook;
        if (ig.cpl == null) ig.cpl = ig.leads > 0 ? ig.spend / ig.leads : null;
        if (fb.cpl == null) fb.cpl = fb.leads > 0 ? fb.spend / fb.leads : null;
        const totalSpend = ig.spend + fb.spend;
        const totalLeads = ig.leads + fb.leads;
        return {
          campaignId: b.campaignId,
          campaignName: b.campaignName,
          instagram: { ...ig },
          facebook: { ...fb },
          totalSpend,
          totalLeads,
          blendedCpl: totalLeads > 0 ? totalSpend / totalLeads : null,
        };
      })
      .filter((c) => c.totalSpend > 0 || c.totalLeads > 0)
      .sort((a, b) => b.totalSpend - a.totalSpend);

    const payload: Record<string, unknown> = {
      configured: true,
      instagram: byPlatform.instagram,
      facebook: byPlatform.facebook,
      campaigns,
    };
    if (url.searchParams.get("debug") === "1") {
      payload._debug = {
        dataRows: data.length,
        activeCampaigns: activeCampaignIds.size,
        campaignFilter: campaignName ?? null,
        campaignId: campaignId ?? null,
        campaignsInResponse: (payload.campaigns as CampaignCplRow[]).length,
      };
    }
    return NextResponse.json(payload);
  } catch (e) {
    console.error("Meta Ads fetch error:", e);
    return NextResponse.json({
      error: e instanceof Error ? e.message : "Greška",
      instagram: { spend: 0, leads: 0, cpl: null },
      facebook: { spend: 0, leads: 0, cpl: null },
      campaigns: [] as CampaignCplRow[],
    });
  }
}
