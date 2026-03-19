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
    fields: "spend,actions",
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
        instagram: { spend: 0, leads: 0, cpl: null },
        facebook: { spend: 0, leads: 0, cpl: null },
      });
    }

    const data = json.data ?? [];
    const byPlatform: Record<string, MetaPlatformData> = {
      instagram: { spend: 0, leads: 0, cpl: null },
      facebook: { spend: 0, leads: 0, cpl: null },
    };

    for (const row of data) {
      const platform = (row.publisher_platform ?? "unknown").toLowerCase();
      const spend = parseFloat(row.spend ?? 0) || 0;
      let leads = 0;
      const actions = row.actions ?? [];
      for (const a of actions) {
        const t = (a.action_type ?? "").toLowerCase();
        if (t.includes("lead")) {
          leads += parseInt(a.value ?? "0", 10) || 0;
        }
      }

      if (platform === "instagram" || platform === "ig") {
        byPlatform.instagram.spend += spend;
        byPlatform.instagram.leads += leads;
      } else if (platform === "facebook" || platform === "fb") {
        byPlatform.facebook.spend += spend;
        byPlatform.facebook.leads += leads;
      }
    }

    for (const p of ["instagram", "facebook"] as const) {
      const d = byPlatform[p];
      d.cpl = d.leads > 0 ? d.spend / d.leads : null;
    }

    return NextResponse.json({
      configured: true,
      instagram: byPlatform.instagram,
      facebook: byPlatform.facebook,
    });
  } catch (e) {
    console.error("Meta Ads fetch error:", e);
    return NextResponse.json({
      error: e instanceof Error ? e.message : "Greška",
      instagram: { spend: 0, leads: 0, cpl: null },
      facebook: { spend: 0, leads: 0, cpl: null },
    });
  }
}
