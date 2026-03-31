import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseAffiliateToken } from "@/lib/affiliate";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const token = req.headers.get("x-affiliate-token") ?? req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = parseAffiliateToken(token);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const affiliateId = parsed.id;

    // Total clicks
    const { count: totalClicks } = await supabase
      .from("affiliate_clicks")
      .select("*", { count: "exact", head: true })
      .eq("affiliate_id", affiliateId);

    // Total conversions
    const { data: conversions } = await supabase
      .from("affiliate_conversions")
      .select("id, order_amount, commission_amount, status, created_at")
      .eq("affiliate_id", affiliateId)
      .order("created_at", { ascending: false });

    const totalConversions = conversions?.length ?? 0;
    const totalEarned = conversions?.reduce((sum, c) => sum + Number(c.commission_amount), 0) ?? 0;
    const pendingEarned = conversions
      ?.filter(c => c.status === "pending" || c.status === "approved")
      .reduce((sum, c) => sum + Number(c.commission_amount), 0) ?? 0;
    const paidEarned = conversions
      ?.filter(c => c.status === "paid")
      .reduce((sum, c) => sum + Number(c.commission_amount), 0) ?? 0;

    const conversionRate = totalClicks && totalClicks > 0
      ? ((totalConversions / totalClicks) * 100).toFixed(1)
      : "0.0";

    // Clicks per day for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentClicks } = await supabase
      .from("affiliate_clicks")
      .select("created_at")
      .eq("affiliate_id", affiliateId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    // Group clicks by day
    const clicksByDay: Record<string, number> = {};
    (recentClicks ?? []).forEach(click => {
      const day = click.created_at.slice(0, 10);
      clicksByDay[day] = (clicksByDay[day] ?? 0) + 1;
    });

    // Build 30-day array
    const chartData: { date: string; clicks: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      chartData.push({ date: key, clicks: clicksByDay[key] ?? 0 });
    }

    // Payouts
    const { data: payouts } = await supabase
      .from("affiliate_payouts")
      .select("id, amount, status, created_at, paid_at")
      .eq("affiliate_id", affiliateId)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      totalClicks: totalClicks ?? 0,
      totalConversions,
      totalEarned,
      pendingEarned,
      paidEarned,
      conversionRate,
      chartData,
      recentConversions: conversions?.slice(0, 10) ?? [],
      payouts: payouts ?? [],
    });
  } catch (err) {
    console.error("Affiliate stats exception:", err);
    return NextResponse.json({ error: "Server greška" }, { status: 500 });
  }
}
