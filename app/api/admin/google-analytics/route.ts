import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { isAdminApiAuthorized } from "@/lib/admin-api-auth";

type TrafficRow = {
  date: string;
  traffic: number;
  conversions: number;
  conversionRate: number;
};

const BELGRADE_YMD = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Belgrade",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toBelgradeYmd(isoLike: string): string {
  return BELGRADE_YMD.format(new Date(isoLike));
}

function parseDateRange(req: NextRequest): { from: string; to: string } {
  const url = req.nextUrl ?? new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const today = BELGRADE_YMD.format(new Date());

  return {
    from: from ?? "2020-01-01",
    to: to ?? today,
  };
}

async function getGoogleTrafficByDay(from: string, to: string): Promise<Map<string, number>> {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const serviceAccountRaw = process.env.GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON?.trim();
  if (!propertyId || !serviceAccountRaw) return new Map();

  let serviceAccount: { client_email?: string; private_key?: string };
  try {
    serviceAccount = JSON.parse(serviceAccountRaw) as { client_email?: string; private_key?: string };
  } catch {
    return new Map();
  }
  const clientEmail = serviceAccount.client_email;
  const privateKey = serviceAccount.private_key;
  if (!clientEmail || !privateKey) return new Map();

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
  });
  const analytics = google.analyticsdata("v1beta");
  const response = await analytics.properties.runReport({
    property: `properties/${propertyId}`,
    auth,
    requestBody: {
      dateRanges: [{ startDate: from, endDate: to }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "sessions" }],
      keepEmptyRows: true,
      orderBys: [{ dimension: { dimensionName: "date" } }],
    },
  });

  const result = new Map<string, number>();
  for (const row of response.data?.rows ?? []) {
    const rawDate = row.dimensionValues?.[0]?.value ?? "";
    if (!rawDate || rawDate.length !== 8) continue;
    const ymd = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    const sessions = Number(row.metricValues?.[0]?.value ?? "0") || 0;
    result.set(ymd, sessions);
  }
  return result;
}

function isGoogleAnalyticsConfigured(): boolean {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const serviceAccountRaw = process.env.GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON?.trim();
  if (!propertyId || !serviceAccountRaw || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return false;
  }
  try {
    const parsed = JSON.parse(serviceAccountRaw) as { client_email?: string; private_key?: string };
    return Boolean(parsed.client_email && parsed.private_key);
  } catch {
    return false;
  }
}

async function getLeadConversionsByDay(from: string, to: string): Promise<Map<string, number>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return new Map();

  const supabase = createClient(supabaseUrl, supabaseKey);
  const pageSize = 1000;
  const uniqueLeadByDayAndEmail = new Set<string>();

  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T00:00:00.000Z`);
  const fromFetch = new Date(fromDate);
  const toFetch = new Date(toDate);
  fromFetch.setUTCDate(fromFetch.getUTCDate() - 1);
  toFetch.setUTCDate(toFetch.getUTCDate() + 1);
  const fromIso = `${fromFetch.toISOString().slice(0, 10)}T00:00:00.000Z`;
  const toIso = `${toFetch.toISOString().slice(0, 10)}T23:59:59.999Z`;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("leads")
      .select("created_at, email")
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .order("created_at", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw new Error(`Supabase leads fetch failed: ${error.message}`);
    }

    const rows = data ?? [];
    for (const row of rows) {
      const email = (row.email ?? "").trim().toLowerCase();
      if (!email) continue;
      const ymd = toBelgradeYmd(row.created_at);
      if (ymd < from || ymd > to) continue;
      uniqueLeadByDayAndEmail.add(`${ymd}|${email}`);
    }

    if (rows.length < pageSize) break;
  }

  const byDay = new Map<string, number>();
  for (const key of uniqueLeadByDayAndEmail) {
    const day = key.split("|", 1)[0];
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  return byDay;
}

function buildDateRange(from: string, to: string): string[] {
  const days: string[] = [];
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return days;

  for (let current = new Date(start); current <= end; current.setUTCDate(current.getUTCDate() + 1)) {
    days.push(current.toISOString().slice(0, 10));
  }
  return days;
}

export async function GET(req: NextRequest) {
  if (!(await isAdminApiAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { from, to } = parseDateRange(req);
    const [trafficByDay, leadsByDay] = await Promise.all([
      getGoogleTrafficByDay(from, to),
      getLeadConversionsByDay(from, to),
    ]);

    const points: TrafficRow[] = buildDateRange(from, to).map((date) => {
      const traffic = trafficByDay.get(date) ?? 0;
      const conversions = leadsByDay.get(date) ?? 0;
      const conversionRate = traffic > 0 ? (conversions / traffic) * 100 : 0;
      return {
        date,
        traffic,
        conversions,
        conversionRate: Number(conversionRate.toFixed(2)),
      };
    });

    const totalTraffic = points.reduce((sum, p) => sum + p.traffic, 0);
    const totalConversions = points.reduce((sum, p) => sum + p.conversions, 0);
    const overallRate = totalTraffic > 0 ? (totalConversions / totalTraffic) * 100 : 0;

    const configured = isGoogleAnalyticsConfigured();

    return NextResponse.json({
      configured,
      from,
      to,
      points,
      totals: {
        traffic: totalTraffic,
        conversions: totalConversions,
        conversionRate: Number(overallRate.toFixed(2)),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google analytics fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
