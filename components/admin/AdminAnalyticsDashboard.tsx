"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Loader2,
  RefreshCw,
  Instagram,
  Facebook,
  Share2,
  Radio,
} from "lucide-react";

function TikTokIcon({ size = 20, color = "#00f2ea" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 8 }} aria-hidden>
      <path
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
        fill={color}
      />
    </svg>
  );
}
import { createClient } from "@supabase/supabase-js";
import { getBelgradeTimeAndCountdown } from "@/lib/belgrade-clock";

type AnalyticsData = {
  total: number;
  bySource: Record<string, number>;
  sumBySource?: number;
  tiktokLeads: number;
  direct: number;
  affiliate: number;
  /** Broj redova u Supabase u periodu (created_at, Beograd); Table Editor COUNT za isti opseg. */
  supabaseRowsInPeriod?: number;
  countingModel?: string;
  supabaseCreatedAtGte?: string | null;
  supabaseCreatedAtLte?: string | null;
  /** Samo kod legacy=1 — leadovi se broje samo do ovog trenutka. */
  legacyCutoffAt?: string;
  secondsUntilMidnight?: number;
  belgradeTime?: string;
  debug?: {
    sheetRowsTotal: number;
    sheetBySource: Record<string, number>;
    sheetSample: { date: string; source_tag: string; utm_source: string; utm_medium: string }[];
    supabaseLeadsFetched?: number;
    supabaseCreatedAtGte?: string | null;
    supabaseCreatedAtLte?: string | null;
    mergedUniqueEmails?: number;
  };
};

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  direct: "Direktno",
  affiliate: "Affiliate",
  ostalo: "Ostalo",
};

/** Samostalan countdown — re-renderuje samo sebe svake sekunde, ne celu stranicu. */
function CountdownDisplay({
  initialSeconds,
  onReset,
}: { initialSeconds: number; onReset: () => void }) {
  const [sec, setSec] = useState(initialSeconds);
  const onResetRef = useRef(onReset);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    onResetRef.current = onReset;
  }, [onReset]);

  useEffect(() => {
    if (initialSeconds <= 0) return;
    const id = requestAnimationFrame(() => {
      setSec(initialSeconds);
    });
    return () => cancelAnimationFrame(id);
  }, [initialSeconds]);

  const isActive = sec > 0;
  useEffect(() => {
    if (!isActive) return;
    intervalRef.current = setInterval(() => {
      setSec((p) => {
        if (p <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onResetRef.current();
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  if (sec <= 0) return null;
  return (
    <div style={{ fontSize: "clamp(14px, 4vw, 18px)", fontWeight: 700, color: "#00d4ff", fontVariantNumeric: "tabular-nums", contain: "layout" }}>
      {Math.floor(sec / 3600)}h {Math.floor((sec % 3600) / 60)}m {sec % 60}s
    </div>
  );
}

/** Stari admin: sat i odbrojavanje uživo na klijentu; lead brojevi ostaju iz API-ja (presek). */
function LegacyDanasClock({ onMidnight }: { onMidnight: () => void }) {
  const [, setTick] = useState(0);
  const prevSecRef = useRef<number | null>(null);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const { belgradeTime, secondsUntilMidnight } = getBelgradeTimeAndCountdown();
  useEffect(() => {
    const prev = prevSecRef.current;
    if (prev !== null && prev < 180 && secondsUntilMidnight > 86000) {
      onMidnight();
    }
    prevSecRef.current = secondsUntilMidnight;
  }, [secondsUntilMidnight, onMidnight]);
  const hh = Math.floor(secondsUntilMidnight / 3600);
  const mm = Math.floor((secondsUntilMidnight % 3600) / 60);
  const ss = secondsUntilMidnight % 60;
  return (
    <>
      <div className="admin-danas-time">{belgradeTime}</div>
      <div
        style={{
          fontSize: "clamp(14px, 4vw, 18px)",
          fontWeight: 700,
          color: "#00d4ff",
          fontVariantNumeric: "tabular-nums",
          contain: "layout",
        }}
      >
        {hh}h {mm}m {ss}s
      </div>
    </>
  );
}

function redirectToLogin() {
  window.location.href = "/admin/login";
}

type TikTokCampaignCpl = {
  campaignId: string;
  campaignName: string;
  spend: number;
  leadsFromAds: number;
  cpl: number | null;
};

type MetaCampaignCpl = {
  campaignId: string;
  campaignName: string;
  instagram: { spend: number; leads: number; cpl: number | null };
  facebook: { spend: number; leads: number; cpl: number | null };
  totalSpend: number;
  totalLeads: number;
  blendedCpl: number | null;
};

type TrafficPoint = {
  date: string;
  traffic: number;
  conversions: number;
  conversionRate: number;
};

type GoogleTrafficPayload = {
  configured: boolean;
  from: string;
  to: string;
  points: TrafficPoint[];
  totals: {
    traffic: number;
    conversions: number;
    conversionRate: number;
  };
};

const ADMIN_LEADS_INITIAL_DELAY_MS = 400;
const BELGRADE_YMD = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Belgrade",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getBelgradeTodayYmd(): string {
  return BELGRADE_YMD.format(new Date());
}

function subtractDaysYmd(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function TrafficVsLeadsChart({ points }: { points: TrafficPoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const width = 900;
  const height = 280;
  const padTop = 22;
  const padBottom = 44;
  const padLeft = 14;
  const padRight = 14;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const maxValue = Math.max(
    1,
    ...points.map((p) => Math.max(p.traffic, p.conversions))
  );
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;
  const y = (value: number) => padTop + innerH - (value / maxValue) * innerH;
  const x = (idx: number) => padLeft + idx * stepX;
  const makePolyline = (values: number[]) =>
    values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const makeArea = (values: number[]) =>
    `${padLeft},${padTop + innerH} ${values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} ${padLeft + innerW},${padTop + innerH}`;
  const xTicks =
    points.length <= 10
      ? points.map((_, i) => i)
      : points
          .map((_, i) => i)
          .filter((i) => i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 8) === 0);
  const hovered = hoveredIdx != null ? points[hoveredIdx] : null;
  const hoveredX = hoveredIdx != null ? x(hoveredIdx) : null;
  const hoveredTrafficY = hovered ? y(hovered.traffic) : null;
  const hoveredConversionsY = hovered ? y(hovered.conversions) : null;
  const bandWidth = points.length > 1 ? innerW / points.length : innerW;

  return (
    <div className="admin-traffic-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="admin-traffic-chart" role="img" aria-label="Traffic i konverzije po danu">
        <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + innerH} stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
        <line x1={padLeft} y1={padTop + innerH} x2={padLeft + innerW} y2={padTop + innerH} stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
        <defs>
          <linearGradient id="trafficArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="convArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <polygon
          points={makeArea(points.map((p) => p.traffic))}
          fill="url(#trafficArea)"
        />
        <polygon
          points={makeArea(points.map((p) => p.conversions))}
          fill="url(#convArea)"
        />

        <polyline
          fill="none"
          stroke="#00d4ff"
          strokeWidth="2.5"
          points={makePolyline(points.map((p) => p.traffic))}
        />
        <polyline
          fill="none"
          stroke="#22c55e"
          strokeWidth="2.5"
          points={makePolyline(points.map((p) => p.conversions))}
        />

        {points.map((point, idx) => (
          <rect
            key={`hit-band-${point.date}`}
            x={Math.max(padLeft, x(idx) - bandWidth / 2)}
            y={padTop}
            width={Math.max(1, bandWidth)}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        ))}

        {hovered && hoveredX != null && hoveredTrafficY != null && hoveredConversionsY != null && (
          <>
            <line
              x1={hoveredX}
              y1={padTop}
              x2={hoveredX}
              y2={padTop + innerH}
              stroke="rgba(255,255,255,0.18)"
              strokeDasharray="4 4"
            />
            <circle cx={hoveredX} cy={hoveredTrafficY} r="4" fill="#00d4ff" />
            <circle cx={hoveredX} cy={hoveredConversionsY} r="4" fill="#22c55e" />
          </>
        )}

        {xTicks.map((idx) => (
          <text
            key={idx}
            x={x(idx)}
            y={height - 14}
            textAnchor={idx === 0 ? "start" : idx === points.length - 1 ? "end" : "middle"}
            fill="#777"
            fontSize="11"
          >
            {points[idx].date.slice(5)}
          </text>
        ))}
      </svg>
      {hovered ? (
        <div className="admin-traffic-tooltip">
          <span className="admin-traffic-tooltip-date">{hovered.date}</span>
          <span><i style={{ background: "#00d4ff" }} />Traffic: {hovered.traffic}</span>
          <span><i style={{ background: "#22c55e" }} />Konverzije: {hovered.conversions}</span>
          <span>CVR: {hovered.conversionRate.toFixed(2)}%</span>
        </div>
      ) : (
        <div className="admin-traffic-tooltip-placeholder">Pređi mišem preko linije za detalje po datumu.</div>
      )}
    </div>
  );
}

export function AdminAnalyticsDashboard({ legacy = false }: { legacy?: boolean }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [waitingInitialDelay, setWaitingInitialDelay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [graphFrom, setGraphFrom] = useState("");
  const [graphTo, setGraphTo] = useState("");
  const [metaAds, setMetaAds] = useState<{
    configured?: boolean;
    instagram: { spend: number; leads: number; cpl: number | null };
    facebook: { spend: number; leads: number; cpl: number | null };
    campaigns?: MetaCampaignCpl[];
    error?: string;
    _debug?: {
      dataRows: number;
      activeCampaigns?: number;
      campaignFilter?: string | null;
      campaignId?: string | null;
      campaignsInResponse?: number;
    };
  } | null>(null);
  const [tiktokAds, setTiktokAds] = useState<{
    configured?: boolean;
    spend: number;
    leadsFromAds: number;
    cpl: number | null;
    campaigns: TikTokCampaignCpl[];
    error?: string;
    startDate?: string;
    endDate?: string;
  } | null>(null);
  const [tiktokSpend, setTiktokSpend] = useState("");
  const [todayData, setTodayData] = useState<AnalyticsData | null>(null);
  const [googleTraffic, setGoogleTraffic] = useState<GoogleTrafficPayload | null>(null);
  const [googleTrafficError, setGoogleTrafficError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<"2d" | "3d" | "7d" | "30d" | "custom">("custom");
  const [liveMode, setLiveMode] = useState<"off" | "30s" | "90s" | "live_today">("30s");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const todayYmd = getBelgradeTodayYmd();
    if (legacy) {
      // Stari prikaz: ceo opseg do preseka — ne samo tekući mesec (inače „prethodni” meseci nestanu).
      setFrom((f) => f || "2020-01-01");
      setTo((t) => t || todayYmd);
      setGraphFrom((f) => f || subtractDaysYmd(todayYmd, 29));
      setGraphTo((t) => t || todayYmd);
      return;
    }
    const from30 = subtractDaysYmd(todayYmd, 29);
    setFrom((f) => f || from30);
    setTo((t) => t || todayYmd);
    setGraphFrom((f) => f || from30);
    setGraphTo((t) => t || todayYmd);
    setSelectedRange((s) => (s === "custom" ? "30d" : s));
  }, [legacy]);

  const applyRangePreset = useCallback((range: "2d" | "3d" | "7d" | "30d") => {
    const today = getBelgradeTodayYmd();
    const days = range === "2d" ? 2 : range === "3d" ? 3 : range === "7d" ? 7 : 30;
    setGraphTo(today);
    setGraphFrom(subtractDaysYmd(today, days - 1));
    setSelectedRange(range);
    setLiveMode("30s");
  }, []);

  const handleReturnToLive = useCallback(() => {
    const today = getBelgradeTodayYmd();
    setGraphTo(today);
    setGraphFrom(today);
    setLiveMode("live_today");
    setSelectedRange("custom");
  }, []);

  const fetchTodayData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("today", "1");
      if (legacy) params.set("legacy", "1");
      const res = await fetch(`/api/admin/analytics?${params}`, { credentials: "include" });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setTodayData(json);
      }
    } catch {
      // opciono
    }
  }, [legacy]);

  const fetchData = useCallback(async (silent = false, withDebug = false) => {
    if (!silent) setLoading(true);
    setError(null);
    let primaryOk = false;
    const ctrl = new AbortController();
    const tid = window.setTimeout(() => ctrl.abort(), 58_000);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (withDebug) params.set("debug", "1");
      if (legacy) params.set("legacy", "1");
      const res = await fetch(`/api/admin/analytics?${params}`, {
        credentials: "include",
        signal: ctrl.signal,
      });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json);
      void fetchTodayData();
      primaryOk = true;
    } catch (e) {
      const aborted = e instanceof DOMException && e.name === "AbortError";
      setError(
        aborted
          ? "Timeout: analitika predugo ne odgovara (često Google Sheet ili mreža). Pokušaj Osveži ili proveri Vercel logove."
          : e instanceof Error
            ? e.message
            : "Greška pri učitavanju."
      );
    } finally {
      window.clearTimeout(tid);
      if (!silent) setLoading(false);
    }

    // Meta / TikTok ne smeju da blokiraju glavni loader — inače UI „visi“ ako spoljni API ne odgovori.
    if (!primaryOk) return;
    const mp = new URLSearchParams();
    if (from) mp.set("from", from);
    if (to) mp.set("to", to);
    try {
      const metaRes = await fetch(`/api/admin/meta-ads?${mp}&debug=1`, { credentials: "include" });
      const metaJson = await metaRes.json();
      setMetaAds({
        configured: metaJson.configured !== false,
        instagram: metaJson.instagram ?? { spend: 0, leads: 0, cpl: null },
        facebook: metaJson.facebook ?? { spend: 0, leads: 0, cpl: null },
        campaigns: Array.isArray(metaJson.campaigns) ? metaJson.campaigns : [],
        error: metaJson.error,
        _debug: metaJson._debug,
      });
    } catch {
      // Meta API opciono
    }
    try {
      const ttRes = await fetch(`/api/admin/tiktok-ads?${mp}&debug=1`, { credentials: "include" });
      if (ttRes.status === 401) {
        redirectToLogin();
        return;
      }
      const ttJson = await ttRes.json();
      setTiktokAds({
        configured: ttJson.configured === true,
        spend: Number(ttJson.spend) || 0,
        leadsFromAds: Number(ttJson.leadsFromAds) || 0,
        cpl: typeof ttJson.cpl === "number" ? ttJson.cpl : null,
        campaigns: Array.isArray(ttJson.campaigns) ? ttJson.campaigns : [],
        error: typeof ttJson.error === "string" ? ttJson.error : undefined,
        startDate: typeof ttJson.startDate === "string" ? ttJson.startDate : undefined,
        endDate: typeof ttJson.endDate === "string" ? ttJson.endDate : undefined,
      });
    } catch {
      setTiktokAds(null);
    }
  }, [legacy, from, to, fetchTodayData]);

  const fetchGoogleTraffic = useCallback(async (customFrom?: string, customTo?: string) => {
    const fromValue = customFrom ?? graphFrom;
    const toValue = customTo ?? graphTo;
    if (!fromValue || !toValue) return;
    setGoogleTrafficError(null);
    try {
      const params = new URLSearchParams();
      params.set("from", fromValue);
      params.set("to", toValue);
      const res = await fetch(`/api/admin/google-analytics?${params}`, { credentials: "include" });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        throw new Error(typeof json?.error === "string" ? json.error : "Greška pri učitavanju Google analitike.");
      }
      setGoogleTraffic(json);
    } catch (e) {
      setGoogleTrafficError(e instanceof Error ? e.message : "Greška pri učitavanju Google analitike.");
    }
  }, [graphFrom, graphTo]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore
    }
    redirectToLogin();
  };

  const isFirstLoadPassRef = useRef(true);
  const lastFetchedRangeRef = useRef<string | null>(null);
  const firstLoadTimerForKeyRef = useRef<string | null>(null);

  // Prvo učitavanje: kratka pauza (layout). Promena datuma posle toga: odmah.
  // lastFetchedRange sprečava ponovni fetch samo zbog promene reference na fetchData.
  useEffect(() => {
    if (!from || !to) return;
    const key = `${from}|${to}`;

    if (isFirstLoadPassRef.current) {
      if (firstLoadTimerForKeyRef.current === key) return;
      firstLoadTimerForKeyRef.current = key;
      setWaitingInitialDelay(true);
      const t = setTimeout(() => {
        isFirstLoadPassRef.current = false;
        setWaitingInitialDelay(false);
        lastFetchedRangeRef.current = key;
        void fetchData();
      }, ADMIN_LEADS_INITIAL_DELAY_MS);
      return () => {
        clearTimeout(t);
        setWaitingInitialDelay(false);
        firstLoadTimerForKeyRef.current = null;
      };
    }

    if (lastFetchedRangeRef.current === key) return;
    lastFetchedRangeRef.current = key;
    void fetchData();
  }, [from, to, fetchData]);

  const lastFetchedGraphRangeRef = useRef<string | null>(null);
  useEffect(() => {
    if (!graphFrom || !graphTo) return;
    const key = `${graphFrom}|${graphTo}`;
    if (lastFetchedGraphRangeRef.current === key) return;
    lastFetchedGraphRangeRef.current = key;
    void fetchGoogleTraffic();
  }, [graphFrom, graphTo, fetchGoogleTraffic]);

  const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (legacy) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    const client = createClient(url, key);
    const ch = client.channel("admin-leads").on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "leads" },
      () => {
        if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
        fetchDebounceRef.current = setTimeout(() => {
          fetchData(true);
          fetchGoogleTraffic();
          fetchDebounceRef.current = null;
        }, 800);
      }
    ).subscribe();
    return () => {
      if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
      client.removeChannel(ch);
    };
  }, [legacy, fetchData, fetchGoogleTraffic]);

  useEffect(() => {
    if (legacy || liveMode === "off") return;
    const refreshMs = liveMode === "90s" ? 90_000 : 30_000;
    const id = setInterval(() => {
      if (liveMode === "live_today") {
        const today = getBelgradeTodayYmd();
        setGraphFrom(today);
        setGraphTo(today);
        fetchGoogleTraffic(today, today);
      } else {
        fetchGoogleTraffic();
      }
      fetchData(true);
    }, refreshMs);
    return () => clearInterval(id);
  }, [legacy, fetchData, fetchGoogleTraffic, liveMode]);

  const handleRefresh = () => {
    fetchData();
    fetchGoogleTraffic();
  };
  const handleCountdownReset = useCallback(() => {
    void fetchTodayData();
  }, [fetchTodayData]);

  const tiktokSpendNum = parseFloat(tiktokSpend.replace(",", ".")) || 0;
  const totalLeads = data?.total ?? 0;
  const tiktokApiOk = Boolean(
    tiktokAds && tiktokAds.configured === true && !tiktokAds.error
  );
  const tiktokSpendEffective = tiktokApiOk ? tiktokAds!.spend : tiktokSpendNum;
  const tiktokCplFromSite =
    data?.tiktokLeads && tiktokSpendEffective > 0
      ? tiktokSpendEffective / data.tiktokLeads
      : null;
  const tiktokCplFromReport = tiktokApiOk ? tiktokAds!.cpl : null;
  const igLeads = data?.bySource?.instagram ?? 0;
  const fbLeads = data?.bySource?.facebook ?? 0;
  const igCpl = metaAds
    ? (metaAds.instagram.cpl ?? (metaAds.instagram.spend > 0 && igLeads > 0 ? metaAds.instagram.spend / igLeads : null))
    : null;
  const fbCpl = metaAds
    ? (metaAds.facebook.cpl ?? (metaAds.facebook.spend > 0 && fbLeads > 0 ? metaAds.facebook.spend / fbLeads : null))
    : null;
  const pct = useCallback((n: number) => totalLeads > 0 ? Math.round((n / totalLeads) * 100) : 0, [totalLeads]);
  const sortedSources = useMemo(() => {
    if (!data?.bySource) return [];
    return Object.entries(data.bySource)
      .filter(([s]) => s !== "affiliate" && s !== "null" && s !== "")
      .sort((a, b) => b[1] - a[1]);
  }, [data?.bySource]);

  return (
    <div className="admin-analytics-page">
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 16px", paddingTop: "max(20px, env(safe-area-inset-top))", paddingBottom: "max(24px, env(safe-area-inset-bottom))", paddingLeft: "max(16px, env(safe-area-inset-left))", paddingRight: "max(16px, env(safe-area-inset-right))" }}>
        <div className="admin-toolbar">
          <div className="admin-toolbar-left">
            <Link href="/" className="admin-link-back">
              <ArrowLeft size={14} /> Nazad
            </Link>
            <span className="admin-live-badge">
              <Radio size={12} /> Live
            </span>
          </div>
          <div className="admin-toolbar-right">
            <div className="admin-period-row">
              <span className="admin-period-label">Period:</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="admin-date-input"
              />
              <span style={{ color: "#555" }}>—</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="admin-date-input"
              />
              <span className="admin-period-hint" title="Brojevi uključuju samo leadove čiji datum pada u ovaj interval.">
                samo ovaj opseg
              </span>
            </div>
            <div className="admin-buttons-row">
              <button type="button" onClick={handleRefresh} disabled={loading || waitingInitialDelay} className="admin-btn admin-btn-refresh">
                <RefreshCw size={14} style={{ opacity: loading || waitingInitialDelay ? 0.5 : 1 }} /> Osveži
              </button>
              <button type="button" onClick={() => fetchData(false, true)} disabled={loading || waitingInitialDelay} className="admin-btn admin-btn-debug">
                Debug
              </button>
              <button type="button" onClick={handleLogout} className="admin-btn admin-btn-logout">
                Izlaz
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: 16, borderRadius: 14, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", marginBottom: 24 }}>
            {error}
          </div>
        )}

        {loading || waitingInitialDelay ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: 60,
              color: "#888",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            <Loader2 size={32} color="#00d4ff" style={{ animation: "spin 1s linear infinite", willChange: "transform" }} />
            {waitingInitialDelay && !loading ? (
              <span style={{ maxWidth: 320, lineHeight: 1.5 }}>
                Kratak delay pre učitavanja leadova (manje opterećenje servera)…
              </span>
            ) : null}
          </div>
        ) : data ? (
          <>
            {todayData && (
              <div className="admin-danas-card">
                <div className="admin-danas-row">
                  <div>
                    <h2 className="admin-danas-title">Danas (Beograd · CET)</h2>
                    <div className="admin-danas-num">{todayData.total}</div>
                    <div className="admin-danas-sub">Leadova danas · reset u ponoć</div>
                    <div className="admin-danas-sub" style={{ marginTop: 8, fontSize: 11, color: "#666", maxWidth: 280 }}>
                      Jedinstveni email (Sheet + Supabase), dan po Beogradu. Redovi u Supabase:{" "}
                      {todayData.supabaseRowsInPeriod ?? "—"}
                    </div>
                  </div>
                  <div className="admin-danas-countdown" style={{ contain: "layout" }}>
                    {legacy ? (
                      <LegacyDanasClock
                        onMidnight={() => {
                          void fetchTodayData();
                        }}
                      />
                    ) : (
                      <>
                        {todayData.belgradeTime && (
                          <div className="admin-danas-time">{todayData.belgradeTime}</div>
                        )}
                        {todayData.secondsUntilMidnight != null && todayData.secondsUntilMidnight > 0 && (
                          <CountdownDisplay
                            initialSeconds={todayData.secondsUntilMidnight}
                            onReset={handleCountdownReset}
                          />
                        )}
                      </>
                    )}
                    <div className="admin-danas-reset-label">do resetovanja</div>
                  </div>
                </div>
                <div className="admin-danas-sources">
                  <span>IG: {todayData.bySource?.instagram ?? 0}</span>
                  <span>FB: {todayData.bySource?.facebook ?? 0}</span>
                  <span>TikTok: {todayData.tiktokLeads ?? 0}</span>
                  <span>Direktno: {todayData.direct ?? 0}</span>
                </div>
              </div>
            )}

            <div className="admin-stats-grid">
              <div className="admin-stat-card" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,212,255,0.15)" }}>
                <Users size={20} color="#00d4ff" style={{ marginBottom: 8 }} />
                <div className="admin-stat-num" style={{ color: "#fff" }}>{data.total}</div>
                <div className="admin-stat-label">Ukupno leadova</div>
                <div className="admin-stat-label" style={{ marginTop: 10, fontSize: 10, color: "#666", lineHeight: 1.4, maxWidth: 220 }}>
                  Jedinstveni email · Sheet + Supabase. Supabase redova u periodu: {data.supabaseRowsInPeriod ?? "—"} (nije isto kao COUNT ako ima duplog emaila u Sheet-u).
                </div>
              </div>
              <div className="admin-stat-card" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(228,64,95,0.25)" }}>
                <Instagram size={20} color="#E4405F" style={{ marginBottom: 8 }} />
                <div className="admin-stat-num" style={{ color: "#fff" }}>{data.bySource.instagram ?? 0}</div>
                <div className="admin-stat-label">Instagram · {pct(data.bySource.instagram ?? 0)}%</div>
              </div>
              <div className="admin-stat-card" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(24,119,242,0.25)" }}>
                <Facebook size={20} color="#1877F2" style={{ marginBottom: 8 }} />
                <div className="admin-stat-num" style={{ color: "#fff" }}>{data.bySource.facebook ?? 0}</div>
                <div className="admin-stat-label">Facebook · {pct(data.bySource.facebook ?? 0)}%</div>
              </div>
              <div className="admin-stat-card" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,242,234,0.25)" }}>
                <TikTokIcon size={20} color="#00f2ea" />
                <div className="admin-stat-num" style={{ color: "#fff" }}>{data.tiktokLeads}</div>
                <div className="admin-stat-label">TikTok · {pct(data.tiktokLeads)}%</div>
              </div>
              <div className="admin-stat-card" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Share2 size={20} color="#888" style={{ marginBottom: 8 }} />
                <div className="admin-stat-num" style={{ color: "#fff" }}>{data.direct}</div>
                <div className="admin-stat-label">Direktno · {pct(data.direct)}%</div>
              </div>
            </div>

            {data.debug && (
              <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)" }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa", marginBottom: 12 }}>Debug – Sheet + Supabase</h3>
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>
                  Sheet redova: <strong style={{ color: "#fff" }}>{data.debug.sheetRowsTotal}</strong>
                  {" · "}
                  Supabase učitano: <strong style={{ color: "#fff" }}>{data.debug.supabaseLeadsFetched ?? "—"}</strong>
                  {" · "}
                  merged email: <strong style={{ color: "#fff" }}>{data.debug.mergedUniqueEmails ?? data.total}</strong>
                  {" · "}
                  created_at gte/lte:{" "}
                  <span style={{ color: "#ccc" }}>{data.debug.supabaseCreatedAtGte ?? "—"}</span>
                  {" → "}
                  <span style={{ color: "#ccc" }}>{data.debug.supabaseCreatedAtLte ?? "—"}</span>
                </div>
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>
                  Po izvoru na Sheet-u (pre filtra): {JSON.stringify(data.debug.sheetBySource)}
                </div>
                {data.debug.sheetSample?.length > 0 && (
                  <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>
                    Primer prvih 5: {data.debug.sheetSample.map((s, i) => (
                      <div key={i} style={{ marginTop: 4 }}>{s.date} | tag: {s.source_tag} | utm_source: {s.utm_source} | utm_medium: {s.utm_medium}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(() => {
              const ig = data.bySource.instagram ?? 0;
              const fb = data.bySource.facebook ?? 0;
              const tt = data.tiktokLeads;
              const dir = data.direct;
              const aff = data.affiliate ?? 0;
              const other = Object.entries(data.bySource)
                .filter(([k]) => !["instagram", "facebook", "tiktok", "direct", "affiliate"].includes(k))
                .reduce((s, [, v]) => s + v, 0);
              const sum = ig + fb + tt + dir + aff + other;
              const ok = sum === data.total;
              return (
                <div style={{ marginBottom: 24, padding: 14, borderRadius: 12, background: ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: "1px solid " + (ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)") }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Provera: Instagram + Facebook + TikTok + Direktno + Affiliate + ostalo = Ukupno</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: ok ? "#22c55e" : "#ef4444" }}>
                    {ig} + {fb} + {tt} + {dir} + {aff}
                    {other > 0 ? " + " + other : ""} = {sum} {ok ? "✓" : "≠ " + data.total + " ✗"}
                  </div>
                </div>
              );
            })()}

            <div style={{ marginBottom: 28, contain: "layout" }}>
              <h2 style={{ fontSize: "clamp(15px, 4vw, 16px)", fontWeight: 700, color: "#fff", marginBottom: 14 }}>Raspodela po izvoru</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sortedSources.map(([source, count]) => (
                    <div key={source} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "clamp(12px, 3vw, 13px)" }}>
                        <span style={{ color: "#ccc" }}>{SOURCE_LABELS[source] ?? source}</span>
                        <span style={{ color: "#fff", fontWeight: 600 }}>{count} ({pct(count)}%)</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: pct(count) + "%",
                            borderRadius: 4,
                            background: "linear-gradient(90deg, #00d4ff 0%, #00b0e0 100%)",
                            minWidth: count > 0 ? 4 : 0,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div className="admin-graph-toolbar">
                <div className="admin-period-row">
                  <span className="admin-period-label">Graph period:</span>
                  <input
                    type="date"
                    value={graphFrom}
                    onChange={(e) => {
                      setGraphFrom(e.target.value);
                      setSelectedRange("custom");
                      if (liveMode === "live_today") setLiveMode("30s");
                    }}
                    className="admin-date-input"
                  />
                  <span style={{ color: "#555" }}>—</span>
                  <input
                    type="date"
                    value={graphTo}
                    onChange={(e) => {
                      setGraphTo(e.target.value);
                      setSelectedRange("custom");
                      if (liveMode === "live_today") setLiveMode("30s");
                    }}
                    className="admin-date-input"
                  />
                </div>
                <div className="admin-range-row">
                  <button type="button" className={`admin-range-btn ${selectedRange === "2d" ? "active" : ""}`} onClick={() => applyRangePreset("2d")}>2d</button>
                  <button type="button" className={`admin-range-btn ${selectedRange === "3d" ? "active" : ""}`} onClick={() => applyRangePreset("3d")}>3d</button>
                  <button type="button" className={`admin-range-btn ${selectedRange === "7d" ? "active" : ""}`} onClick={() => applyRangePreset("7d")}>7d</button>
                  <button type="button" className={`admin-range-btn ${selectedRange === "30d" ? "active" : ""}`} onClick={() => applyRangePreset("30d")}>30d</button>
                  <button type="button" className="admin-range-btn admin-range-btn-live" onClick={handleReturnToLive}>
                    Vrati na uzivo
                  </button>
                  <label className="admin-live-select-wrap">
                    Auto osvezavanje:
                    <select
                      className="admin-live-select"
                      value={liveMode}
                      onChange={(e) => setLiveMode(e.target.value as "off" | "30s" | "90s" | "live_today")}
                    >
                      <option value="off">Pauza</option>
                      <option value="30s">Na 30 sek</option>
                      <option value="90s">Na 90 sek</option>
                      <option value="live_today">Uzivo danas</option>
                    </select>
                  </label>
                </div>
              </div>
              <div className="admin-graph-help">
                Izaberi period za graf ili klikni <strong>Vrati na uzivo</strong> da prati poslednje dane i osvezava automatski.
              </div>
              <h2 style={{ fontSize: "clamp(16px, 4vw, 18px)", fontWeight: 700, color: "#fff", marginBottom: 14 }}>
                Traffic vs konverzije (po danu)
              </h2>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
                Plava linija je ukupni dnevni traffic iz Google Analytics (sessions), zelena linija su dnevne konverzije
                (broj jedinstvenih email leadova). Osvežavanje ide periodično (na ~90s) da ne optereti sajt.
              </p>

              {googleTrafficError && (
                <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: 12 }}>
                  Google Analytics: {googleTrafficError}
                </div>
              )}

              {googleTraffic && googleTraffic.configured === false && (
                <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.25)", color: "#facc15", fontSize: 12 }}>
                  GA nije potpuno podešen. Potrebni su `GA4_PROPERTY_ID` i `GOOGLE_ANALYTICS_SERVICE_ACCOUNT_JSON` (plus Supabase env-ovi).
                </div>
              )}

              {!googleTraffic && !googleTrafficError ? (
                <div style={{ marginBottom: 20, fontSize: 12, color: "#666" }}>
                  Učitavanje grafikona...
                </div>
              ) : googleTraffic && googleTraffic.points.length > 0 ? (
                <>
                  <TrafficVsLeadsChart points={googleTraffic.points} />
                  <div className="admin-traffic-legend">
                    <span><i style={{ background: "#00d4ff" }} />Traffic: {googleTraffic.totals.traffic}</span>
                    <span><i style={{ background: "#22c55e" }} />Konverzije: {googleTraffic.totals.conversions}</span>
                    <span>CVR: {googleTraffic.totals.conversionRate.toFixed(2)}%</span>
                    <span>
                      Auto-refresh: {liveMode === "off" ? "off" : liveMode === "live_today" ? "uzivo danas (30s)" : liveMode}
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ marginBottom: 20, fontSize: 12, color: "#666" }}>
                  Nema podataka za odabrani period.
                </div>
              )}
            </div>

            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: "clamp(16px, 4vw, 18px)", fontWeight: 700, color: "#fff", marginBottom: 14 }}>Cost per Lead (CPL)</h2>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
                Meta (kartice ispod): potrošnja iz Ads API, CPL = potrošnja ÷ leadovi <strong style={{ color: "#aaa" }}>sa sajta</strong> (ukupno po
                mreži). <strong style={{ color: "#aaa" }}>Po kampanjama</strong>: CPL koristi lead brojeve koje Meta prijavi u insights-u (po kampanji
                i platformi). TikTok: automatski preko Marketing API ako su podešeni token i advertiser ID; inače ručni unos.
              </p>
              {metaAds?.error && (
                <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: 12 }}>
                  Meta API: {metaAds.error}
                </div>
              )}
              {metaAds?._debug && (metaAds.instagram.spend === 0 && metaAds.facebook.spend === 0 || metaAds._debug.campaignFilter || (metaAds._debug.activeCampaigns ?? 0) > 0) && (
                <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)", color: "#a78bfa", fontSize: 12 }}>
                  {metaAds._debug.campaignFilter ? (
                    <span>Kampanja: {metaAds._debug.campaignFilter}{metaAds._debug.campaignId ? ` ✓` : " — nije pronađena"}</span>
                  ) : (
                    <span>Samo aktivne kampanje ({metaAds._debug.activeCampaigns ?? 0})</span>
                  )}
                  {metaAds._debug.dataRows === 0 && (
                    <span> — Nema potrošnje u ovom periodu.</span>
                  )}
                </div>
              )}
              <div className="admin-cpl-grid">
                <div style={{ padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(228,64,95,0.2)" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#E4405F", marginBottom: 12 }}>Instagram</div>
                  {metaAds && metaAds.configured !== false ? (
                    <>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                        {igCpl != null ? "€" + igCpl.toFixed(2) : "—"}
                      </div>
                      <div style={{ fontSize: 12, color: "#555" }}>
                        €{metaAds.instagram.spend.toFixed(2)} potrošeno · {data.bySource.instagram ?? 0} leadova sa sajta
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: "#666" }}>Podesi META_ADS_ACCESS_TOKEN i META_AD_ACCOUNT_ID</div>
                  )}
                </div>
                <div style={{ padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(24,119,242,0.2)" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1877F2", marginBottom: 12 }}>Facebook</div>
                  {metaAds && metaAds.configured !== false ? (
                    <>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                        {fbCpl != null ? "€" + fbCpl.toFixed(2) : "—"}
                      </div>
                      <div style={{ fontSize: 12, color: "#555" }}>
                        €{metaAds.facebook.spend.toFixed(2)} potrošeno · {data.bySource.facebook ?? 0} leadova sa sajta
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: "#666" }}>Podesi META_ADS_ACCESS_TOKEN i META_AD_ACCOUNT_ID</div>
                  )}
                </div>
                <div style={{ padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,242,234,0.2)" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#00f2ea", marginBottom: 12 }}>TikTok</div>
                  {tiktokAds?.error && (
                    <div style={{ marginBottom: 12, fontSize: 12, color: "#f87171" }}>API: {tiktokAds.error}</div>
                  )}
                  {tiktokApiOk ? (
                    <>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                        {tiktokCplFromReport != null ? `€${tiktokCplFromReport.toFixed(2)}` : "—"}
                      </div>
                      <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>
                        CPL iz izveštaja · €{tiktokAds!.spend.toFixed(2)} potrošeno · {tiktokAds!.leadsFromAds} leadova (TikTok)
                      </div>
                      {tiktokCplFromSite != null && (
                        <div style={{ fontSize: 12, color: "#777" }}>
                          Blend sa sajtom: {data.tiktokLeads} leadova → €{tiktokCplFromSite.toFixed(2)}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: "#555", marginTop: 8 }}>
                        Valuta je ona iz TikTok Ads naloga (često EUR).
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
                        Bez API-ja: unesi potrošnju. Sa API-jem: postavi TIKTOK_ADS_ACCESS_TOKEN i TIKTOK_ADVERTISER_ID u Vercel.
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={tiktokSpend}
                          onChange={(e) => setTiktokSpend(e.target.value.replace(/[^0-9,.]/g, ""))}
                          placeholder="€ potrošeno"
                          style={{ flex: 1, minWidth: 100, minHeight: 44, padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 16 }}
                        />
                        {tiktokCplFromSite !== null && tiktokCplFromSite > 0 && (
                          <span style={{ fontSize: 15, fontWeight: 700, color: "#00f2ea" }}>
                            CPL: €{tiktokCplFromSite.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#555", marginTop: 8 }}>{data.tiktokLeads} leadova sa sajta</div>
                    </>
                  )}
                </div>
              </div>

              {metaAds && metaAds.configured !== false && (metaAds.campaigns?.length ?? 0) > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 10 }}>Meta — CPL po kampanji</h3>
                  <p style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
                    Samo aktivne kampanje u nalogu; period kao gore. Lead kolone = Meta conversion broj iz oglasa.
                  </p>
                  <div className="admin-campaign-table-wrap">
                    <table className="admin-campaign-table">
                      <thead>
                        <tr>
                          <th>Kampanja</th>
                          <th>IG €</th>
                          <th>IG lead</th>
                          <th>IG CPL</th>
                          <th>FB €</th>
                          <th>FB lead</th>
                          <th>FB CPL</th>
                          <th>Ukup €</th>
                          <th>Ukup lead</th>
                          <th>CPL blend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metaAds.campaigns!.map((c) => (
                          <tr key={c.campaignId}>
                            <td title={c.campaignId} style={{ maxWidth: 200 }}>
                              {c.campaignName}
                            </td>
                            <td>€{c.instagram.spend.toFixed(2)}</td>
                            <td>{c.instagram.leads}</td>
                            <td>{c.instagram.cpl != null ? `€${c.instagram.cpl.toFixed(2)}` : "—"}</td>
                            <td>€{c.facebook.spend.toFixed(2)}</td>
                            <td>{c.facebook.leads}</td>
                            <td>{c.facebook.cpl != null ? `€${c.facebook.cpl.toFixed(2)}` : "—"}</td>
                            <td style={{ fontWeight: 600 }}>€{c.totalSpend.toFixed(2)}</td>
                            <td style={{ fontWeight: 600 }}>{c.totalLeads}</td>
                            <td style={{ fontWeight: 600, color: "#00d4ff" }}>
                              {c.blendedCpl != null ? `€${c.blendedCpl.toFixed(2)}` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tiktokApiOk && (tiktokAds!.campaigns?.length ?? 0) > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 10 }}>TikTok — CPL po kampanji</h3>
                  <p style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
                    Aktivne kampanje u periodu; lead kolone iz TikTok integrisanog izveštaja (sales_lead / conversion).
                  </p>
                  <div className="admin-campaign-table-wrap">
                    <table className="admin-campaign-table">
                      <thead>
                        <tr>
                          <th>Kampanja</th>
                          <th>Potrošnja</th>
                          <th>Lead (TT)</th>
                          <th>CPL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tiktokAds!.campaigns.map((c) => (
                          <tr key={c.campaignId}>
                            <td title={c.campaignId} style={{ maxWidth: 220 }}>
                              {c.campaignName}
                            </td>
                            <td>€{c.spend.toFixed(2)}</td>
                            <td>{c.leadsFromAds}</td>
                            <td style={{ fontWeight: 600, color: "#00f2ea" }}>
                              {c.cpl != null ? `€${c.cpl.toFixed(2)}` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </>
        ) : null}
      </div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .admin-analytics-page { min-height: 100vh; background: #050508; padding: 0; -webkit-tap-highlight-color: transparent; }
        .admin-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
        .admin-toolbar-left { display: flex; align-items: center; gap: 12px; }
        .admin-toolbar-right { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
        .admin-link-back { display: inline-flex; align-items: center; gap: 6px; color: #666; text-decoration: none; font-size: 13px; min-height: 44px; padding: 0 4px; }
        .admin-live-badge { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #22c55e; }
        .admin-period-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .admin-range-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .admin-graph-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; padding: 10px; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; background: rgba(255,255,255,0.02); }
        .admin-range-btn { min-height: 36px; padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.03); color: #bbb; font-size: 12px; cursor: pointer; }
        .admin-range-btn.active { border-color: rgba(0,212,255,0.45); color: #00d4ff; background: rgba(0,212,255,0.1); }
        .admin-range-btn-live { border-color: rgba(34,197,94,0.4); color: #86efac; background: rgba(34,197,94,0.1); }
        .admin-live-select-wrap { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #888; }
        .admin-live-select { min-height: 32px; border-radius: 8px; padding: 4px 8px; background: #f4f4f5; border: 1px solid rgba(255,255,255,0.12); color: #111; font-weight: 600; }
        .admin-live-select option { color: #111; background: #fff; }
        .admin-graph-help { font-size: 12px; color: #8a8a8a; margin-bottom: 10px; }
        .admin-period-label { font-size: 12px; color: #555; }
        .admin-period-hint { font-size: 11px; color: #666; max-width: 140px; line-height: 1.3; }
        .admin-date-input { padding: 10px 12px; min-height: 44px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 14px; touch-action: manipulation; }
        .admin-buttons-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .admin-btn { min-height: 44px; min-width: 44px; padding: 10px 14px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; font-family: inherit; border: none; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
        .admin-btn-refresh { background: rgba(0,212,255,0.15); border: 1px solid rgba(0,212,255,0.3); color: #00d4ff; }
        .admin-btn-debug { background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); color: #a78bfa; font-size: 12px; }
        .admin-btn-logout { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; }
        .admin-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
        .admin-stat-card { padding: 16px; border-radius: 14px; min-height: 90px; display: flex; flex-direction: column; justify-content: center; }
        .admin-stat-num { font-size: 22px; font-weight: 800; }
        .admin-stat-label { font-size: 11px; color: #888; }
        .admin-cpl-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .admin-danas-card { margin-bottom: 20px; padding: 16px; border-radius: 14px; background: linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(0,180,224,0.05) 100%); border: 1px solid rgba(0,212,255,0.25); }
        .admin-danas-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; }
        .admin-danas-title { font-size: 13px; font-weight: 700; color: #00d4ff; margin-bottom: 6px; }
        .admin-danas-num { font-size: 28px; font-weight: 800; color: #fff; }
        .admin-danas-sub { font-size: 12px; color: #888; }
        .admin-danas-countdown { text-align: right; }
        .admin-danas-time { font-size: 11px; color: #666; margin-bottom: 4px; }
        .admin-danas-reset-label { font-size: 11px; color: #555; }
        .admin-danas-sources { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; font-size: 12px; color: #aaa; }
        .admin-login-wrap { padding: 16px; max-width: 400px; width: 100%; }
        .admin-login-input { padding: 14px 18px; min-height: 48px; font-size: 16px; }
        .admin-login-btn { min-height: 48px; padding: 14px 20px; }
        .admin-campaign-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); }
        .admin-campaign-table { width: 100%; border-collapse: collapse; font-size: 11px; color: #ccc; min-width: 720px; }
        .admin-campaign-table th, .admin-campaign-table td { padding: 10px 8px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .admin-campaign-table th:first-child, .admin-campaign-table td:first-child { text-align: left; }
        .admin-campaign-table th { color: #888; font-weight: 600; background: rgba(255,255,255,0.03); }
        .admin-campaign-table tbody tr:hover { background: rgba(255,255,255,0.02); }
        .admin-traffic-chart-wrap { margin-bottom: 12px; border-radius: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); padding: 12px; overflow-x: auto; }
        .admin-traffic-chart { width: 100%; min-width: 520px; height: auto; display: block; }
        .admin-traffic-legend { display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; color: #aaa; margin-bottom: 18px; }
        .admin-traffic-legend span { display: inline-flex; align-items: center; gap: 6px; }
        .admin-traffic-legend i { width: 10px; height: 10px; border-radius: 99px; display: inline-block; }
        .admin-traffic-tooltip { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; font-size: 12px; color: #cfcfcf; padding: 10px 4px 2px; }
        .admin-traffic-tooltip-date { color: #fff; font-weight: 700; margin-right: 6px; }
        .admin-traffic-tooltip span { display: inline-flex; align-items: center; gap: 6px; }
        .admin-traffic-tooltip i { width: 10px; height: 10px; border-radius: 99px; display: inline-block; }
        .admin-traffic-tooltip-placeholder { font-size: 12px; color: #666; padding: 10px 4px 2px; }
        @media (max-width: 639px) {
          .admin-graph-toolbar { align-items: stretch; padding: 12px; gap: 12px; }
          .admin-graph-toolbar .admin-period-row { width: 100%; }
          .admin-graph-toolbar .admin-date-input { flex: 1; min-width: 130px; }
          .admin-graph-toolbar .admin-range-row { width: 100%; gap: 6px; }
          .admin-range-btn { min-height: 40px; padding: 8px 10px; font-size: 12px; }
          .admin-range-btn-live { width: 100%; order: 20; }
          .admin-live-select-wrap { width: 100%; justify-content: space-between; margin-top: 2px; }
          .admin-live-select { width: 170px; min-height: 40px; }
          .admin-traffic-chart-wrap { padding: 10px; }
          .admin-traffic-chart { min-width: 420px; }
          .admin-traffic-tooltip { gap: 8px; font-size: 11px; }
          .admin-traffic-tooltip-date { width: 100%; margin-right: 0; }
          .admin-traffic-legend { gap: 8px; font-size: 11px; margin-bottom: 12px; }
        }
        @media (min-width: 640px) {
          .admin-danas-card { margin-bottom: 24px; padding: 20px; border-radius: 18px; }
          .admin-danas-num { font-size: 36px; }
          .admin-danas-sub { font-size: 13px; }
          .admin-stats-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; margin-bottom: 32px; }
          .admin-stat-card { padding: 24px; border-radius: 18px; min-height: auto; }
          .admin-stat-num { font-size: 28px; }
          .admin-stat-label { font-size: 13px; }
          .admin-cpl-grid { gap: 20px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
          .admin-campaign-table { font-size: 12px; }
          .admin-campaign-table th, .admin-campaign-table td { padding: 12px 10px; }
        }
      `}</style>
    </div>
  );
}
