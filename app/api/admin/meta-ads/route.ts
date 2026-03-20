import { NextRequest, NextResponse } from "next/server";

function getAuth(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  try {
    const url = req.nextUrl ?? new URL(req.url);
    return url.searchParams.get("secret");
  } catch {
    return null;
  }
}

type MetaPlatformData = {
  spend: number;
  leads: number;
  cpl: number | null;
};

export async function GET(req: NextRequest) {
  const secret = getAuth(req);
  const expected = process.env.ADMIN_ANALYTICS_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.META_ADS_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
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

  const params = new URLSearchParams({
    access_token: token,
    fields: "spend,actions,cost_per_action_type",
    breakdowns: "publisher_platform",
    limit: "500",
  });
  if (timeRange) {
    params.set("time_range", timeRange);
  } else {
    params.set("date_preset", datePreset);
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${accountId}/insights?${params}`,
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
    const byPlatform: Record<string, MetaPlatformData> = {
      instagram: { spend: 0, leads: 0, cpl: null },
      facebook: { spend: 0, leads: 0, cpl: null },
    };

    // Ako breakdown vrati prazno, probaj bez breakdowns (total na nivou naloga)
    if (data.length === 0) {
      const fallbackParams = new URLSearchParams({
        access_token: token,
        fields: "spend,actions,cost_per_action_type",
        limit: "1",
      });
      if (timeRange) fallbackParams.set("time_range", timeRange);
      else fallbackParams.set("date_preset", datePreset);
      try {
        const fallbackRes = await fetch(
          `https://graph.facebook.com/v21.0/${accountId}/insights?${fallbackParams}`,
          { next: { revalidate: 0 } }
        );
        const fallbackJson = await fallbackRes.json();
        const fallbackData = fallbackJson.data ?? [];
        if (fallbackRes.ok && fallbackData.length > 0) {
          const row = fallbackData[0];
          const totalSpend = parseFloat(row.spend ?? 0) || 0;
          const totalLeads = countLeads(row.actions);
          const metaCpl = getCplFromCostPerAction(row.cost_per_action_type);
          if (totalSpend > 0 || totalLeads > 0) {
            byPlatform.instagram.spend = totalSpend / 2;
            byPlatform.facebook.spend = totalSpend / 2;
            byPlatform.instagram.leads = totalLeads;
            byPlatform.facebook.leads = totalLeads;
            const cpl = metaCpl ?? (totalLeads > 0 ? totalSpend / totalLeads : null);
            byPlatform.instagram.cpl = cpl;
            byPlatform.facebook.cpl = cpl;
          }
        }
      } catch {
        // ignorišemo fallback grešku
      }
    }

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
        hasPaging: !!json.paging,
        firstRowKeys: data[0] ? Object.keys(data[0]) : [],
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
