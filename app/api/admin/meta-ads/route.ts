import { NextRequest, NextResponse } from "next/server";
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

type MetaPlatformData = {
  spend: number;
  leads: number;
  cpl: number | null;
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

    for (const row of data) {
      const platform = (row.publisher_platform ?? "unknown").toLowerCase();
      const spend = parseFloat(row.spend ?? 0) || 0;
      const leads = countLeads(row.actions);
      const metaCpl = getCplFromCostPerAction(row.cost_per_action_type);

      if (platform === "instagram" || platform === "ig") {
        byPlatform.instagram.spend += spend;
        byPlatform.instagram.leads += leads;
        if (metaCpl != null && byPlatform.instagram.cpl == null) byPlatform.instagram.cpl = metaCpl;
      } else if (platform === "facebook" || platform === "fb") {
        byPlatform.facebook.spend += spend;
        byPlatform.facebook.leads += leads;
        if (metaCpl != null && byPlatform.facebook.cpl == null) byPlatform.facebook.cpl = metaCpl;
      }
    }

    for (const p of ["instagram", "facebook"] as const) {
      const d = byPlatform[p];
      if (d.cpl == null) d.cpl = d.leads > 0 ? d.spend / d.leads : null;
    }

    const payload: Record<string, unknown> = {
      configured: true,
      instagram: byPlatform.instagram,
      facebook: byPlatform.facebook,
    };
    if (url.searchParams.get("debug") === "1") {
      payload._debug = {
        dataRows: data.length,
        activeCampaigns: activeCampaignIds.size,
        campaignFilter: campaignName ?? null,
        campaignId: campaignId ?? null,
      };
    }
    return NextResponse.json(payload);
  } catch (e) {
    console.error("Meta Ads fetch error:", e);
    return NextResponse.json({
      error: e instanceof Error ? e.message : "Greška",
      instagram: { spend: 0, leads: 0, cpl: null },
      facebook: { spend: 0, leads: 0, cpl: null },
    });
  }
}
