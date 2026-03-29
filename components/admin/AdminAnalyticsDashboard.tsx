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
  Pause,
  Save,
} from "lucide-react";
import { getBelgradeTimeAndCountdown } from "@/lib/belgrade-clock";

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

type AnalyticsData = {
  total: number;
  bySource: Record<string, number>;
  sumBySource?: number;
  tiktokLeads: number;
  direct: number;
  affiliate: number;
  secondsUntilMidnight?: number;
  belgradeTime?: string;
  debug?: {
    sheetRowsTotal: number;
    sheetBySource: Record<string, number>;
    sheetSample: { date: string; source_tag: string; utm_source: string; utm_medium: string }[];
  };
};

const FROZEN_EMPTY: AnalyticsData = {
  total: 0,
  bySource: {},
  sumBySource: 0,
  tiktokLeads: 0,
  direct: 0,
  affiliate: 0,
};

const FROZEN_SNAPSHOT_KEY = "admin_frozen_snapshot_v1";

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

  useEffect(() => {
    if (sec <= 0) return;
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
  }, [sec <= 0 ? 0 : 1]);

  if (sec <= 0) return null;
  return (
    <div style={{ fontSize: "clamp(14px, 4vw, 18px)", fontWeight: 700, color: "#00d4ff", fontVariantNumeric: "tabular-nums", contain: "layout" }}>
      {Math.floor(sec / 3600)}h {Math.floor((sec % 3600) / 60)}m {sec % 60}s
    </div>
  );
}

function redirectToLiveLogin() {
  window.location.href = "/admin/live/login";
}

/** Zamrznut režim: sat i odbrojavanje do ponoći bez API-ja; jedan izvor, bez resetovanja CountdownDisplay-a. */
function FrozenBelgradeClock() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const { belgradeTime, secondsUntilMidnight } = getBelgradeTimeAndCountdown();
  const h = Math.floor(secondsUntilMidnight / 3600);
  const m = Math.floor((secondsUntilMidnight % 3600) / 60);
  const s = secondsUntilMidnight % 60;
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
        {h}h {m}m {s}s
      </div>
    </>
  );
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

type AdminFrozenSnapshotV1 = {
  v: 1;
  savedAt: string;
  from: string;
  to: string;
  data: AnalyticsData;
  todayData: AnalyticsData | null;
  metaAds: {
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
  } | null;
  tiktokAds: {
    configured?: boolean;
    spend: number;
    leadsFromAds: number;
    cpl: number | null;
    campaigns: TikTokCampaignCpl[];
    error?: string;
    startDate?: string;
    endDate?: string;
  } | null;
  tiktokSpend: string;
};

export function AdminAnalyticsDashboard({ frozen = false }: { frozen?: boolean }) {
  const [frozenHydrated, setFrozenHydrated] = useState(!frozen);
  const [snapshotSavedAtLabel, setSnapshotSavedAtLabel] = useState<string | null>(null);
  const [saveArchiveHint, setSaveArchiveHint] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
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

  useEffect(() => {
    if (!frozen) return;
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(FROZEN_SNAPSHOT_KEY);
      if (!raw) {
        setSnapshotSavedAtLabel(null);
        return;
      }
      const snap = JSON.parse(raw) as AdminFrozenSnapshotV1;
      if (snap.v !== 1 || !snap.data || typeof snap.data.total !== "number") {
        setSnapshotSavedAtLabel(null);
        return;
      }
      setData(snap.data);
      setTodayData(snap.todayData ?? null);
      setMetaAds(snap.metaAds ?? null);
      setTiktokAds(
        snap.tiktokAds ?? {
          configured: false,
          spend: 0,
          leadsFromAds: 0,
          cpl: null,
          campaigns: [],
        }
      );
      setFrom(snap.from || "");
      setTo(snap.to || "");
      setTiktokSpend(snap.tiktokSpend ?? "");
      try {
        const d = new Date(snap.savedAt);
        setSnapshotSavedAtLabel(
          Number.isFinite(d.getTime())
            ? new Intl.DateTimeFormat("sr-Latn-RS", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Europe/Belgrade",
              }).format(d)
            : snap.savedAt
        );
      } catch {
        setSnapshotSavedAtLabel(snap.savedAt);
      }
    } catch {
      setSnapshotSavedAtLabel(null);
    } finally {
      setFrozenHydrated(true);
    }
  }, [frozen]);

  useEffect(() => {
    if (typeof window === "undefined" || frozen) return;
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setFrom((f) => f || firstDay.toISOString().slice(0, 10));
    setTo((t) => t || now.toISOString().slice(0, 10));
  }, [frozen]);

  const fetchTodayData = useCallback(async () => {
    if (frozen) return;
    try {
      const params = new URLSearchParams();
      params.set("today", "1");
      const res = await fetch(`/api/admin/analytics?${params}`, { credentials: "include" });
      if (res.status === 401) {
        redirectToLiveLogin();
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setTodayData(json);
      }
    } catch {
      // opciono
    }
  }, [frozen]);

  const fetchData = useCallback(async (silent = false, withDebug = false) => {
    if (frozen) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (withDebug) params.set("debug", "1");
      const res = await fetch(`/api/admin/analytics?${params}`, { credentials: "include" });
      if (res.status === 401) {
        redirectToLiveLogin();
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setData(json);
      fetchTodayData();

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
          redirectToLiveLogin();
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Greška pri učitavanju.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [frozen, from, to, fetchTodayData]);

  const handleLogout = async () => {
    const which = frozen ? "archive" : "live";
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ which }),
        credentials: "include",
      });
    } catch {
      // ignore
    }
    window.location.href = frozen ? "/admin/login" : "/admin/live/login";
  };

  const saveArchiveSnapshot = useCallback(() => {
    if (frozen || !data) {
      setSaveArchiveHint("Nema učitanih podataka za snimak.");
      setTimeout(() => setSaveArchiveHint(null), 3500);
      return;
    }
    const snap: AdminFrozenSnapshotV1 = {
      v: 1,
      savedAt: new Date().toISOString(),
      from,
      to,
      data,
      todayData,
      metaAds,
      tiktokAds: tiktokAds ?? {
        configured: false,
        spend: 0,
        leadsFromAds: 0,
        cpl: null,
        campaigns: [],
      },
      tiktokSpend,
    };
    try {
      localStorage.setItem(FROZEN_SNAPSHOT_KEY, JSON.stringify(snap));
      setSaveArchiveHint("Snimak sačuvan. Arhiva (/admin/x7k9m2q4) sada prikazuje ove brojke.");
      setTimeout(() => setSaveArchiveHint(null), 5000);
    } catch {
      setSaveArchiveHint("Greška pri čuvanju (localStorage).");
      setTimeout(() => setSaveArchiveHint(null), 4000);
    }
  }, [frozen, data, from, to, todayData, metaAds, tiktokAds, tiktokSpend]);

  useEffect(() => {
    if (frozen) return;
    if (from && to && !data && !loading) fetchData();
  }, [from, to, frozen, data, loading, fetchData]);

  useEffect(() => {
    if (frozen) return;
    if (data && from && to) fetchData(true);
  }, [from, to, frozen, data, fetchData]);

  const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (frozen || !data) return;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const client = createClient(url, key);
      const ch = client.channel("admin-leads").on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        () => {
          if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
          fetchDebounceRef.current = setTimeout(() => {
            fetchData(true);
            fetchDebounceRef.current = null;
          }, 800);
        }
      ).subscribe();
      return () => {
        if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
        client.removeChannel(ch);
      };
    }
  }, [frozen, data, fetchData]);

  useEffect(() => {
    if (frozen || !data) return;
    const id = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(id);
  }, [frozen, data, fetchData]);

  const handleRefresh = () => fetchData();
  const handleCountdownReset = useCallback(() => {
    if (frozen) return;
    void fetchTodayData();
  }, [frozen, fetchTodayData]);

  const displayToday = todayData ?? FROZEN_EMPTY;

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
            <span className="admin-live-badge" style={frozen ? { color: "#94a3b8" } : undefined}>
              {frozen ? (
                <>
                  <Pause size={12} /> Zamrznuto
                </>
              ) : (
                <>
                  <Radio size={12} /> Live
                </>
              )}
            </span>
            {!frozen && (
              <Link href="/admin/x7k9m2q4" style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                Arhiva (zamrznuto)
              </Link>
            )}
          </div>
          <div className="admin-toolbar-right">
            <div className="admin-period-row">
              <span className="admin-period-label">Period:</span>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="admin-date-input"
                readOnly={frozen}
                aria-readonly={frozen}
              />
              <span style={{ color: "#555" }}>—</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="admin-date-input"
                readOnly={frozen}
                aria-readonly={frozen}
              />
            </div>
            <div className="admin-buttons-row">
              <button onClick={handleRefresh} disabled={loading || frozen} className="admin-btn admin-btn-refresh">
                <RefreshCw size={14} style={{ opacity: loading ? 0.5 : 1 }} /> Osveži
              </button>
              {!frozen && (
                <button
                  type="button"
                  onClick={saveArchiveSnapshot}
                  disabled={loading || !data}
                  className="admin-btn"
                  style={{
                    background: "rgba(148,163,184,0.15)",
                    border: "1px solid rgba(148,163,184,0.35)",
                    color: "#cbd5e1",
                  }}
                  title="Upisuje trenutni prikaz u pregledač; arhiva čita isti snimak"
                >
                  <Save size={14} /> Snimak → arhiva
                </button>
              )}
              <button onClick={() => fetchData(false, true)} disabled={loading || frozen} className="admin-btn admin-btn-debug">
                Debug
              </button>
              <button onClick={handleLogout} className="admin-btn admin-btn-logout">
                Izlaz
              </button>
            </div>
          </div>
        </div>

        {saveArchiveHint && !frozen && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 12,
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: "#86efac",
              fontSize: 13,
            }}
          >
            {saveArchiveHint}
          </div>
        )}

        {frozen && (
          <div
            style={{
              marginBottom: 16,
              padding: 14,
              borderRadius: 12,
              background: "rgba(148,163,184,0.1)",
              border: "1px solid rgba(148,163,184,0.25)",
              color: "#94a3b8",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            Prikaz iz snimka{snapshotSavedAtLabel ? ` · sačuvano ${snapshotSavedAtLabel}` : ""}. Brojevi se ne menjaju; sat i
            odbrojavanje do ponoći (Beograd) teku u realnom vremenu. Za nov snimak uđi u live konzolu (poseban URL i kod) i
            klikni „Snimak → arhiva”.
          </div>
        )}

        {error && (
          <div style={{ padding: 16, borderRadius: 14, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", marginBottom: 24 }}>
            {error}
          </div>
        )}

        {(loading && !frozen) || (frozen && !frozenHydrated) ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
            <Loader2 size={32} color="#00d4ff" style={{ animation: "spin 1s linear infinite", willChange: "transform" }} />
          </div>
        ) : frozen && !data ? (
          <div
            style={{
              padding: 28,
              borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#888",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <p style={{ color: "#fff", fontWeight: 600, marginBottom: 10 }}>Nema sačuvanog snimka za arhivu</p>
            <p style={{ marginBottom: 12 }}>
              Uđi u <strong style={{ color: "#cbd5e1" }}>live</strong> admin (poseban link i <strong>ADMIN_LIVE_CONSOLE_SECRET</strong>),
              učitaj podatke, zatim klikni <strong>„Snimak → arhiva”</strong>. Ovaj pregledač će zapamtiti brojeve; ovde će ostati
              zamrznuti dok ne snimiš nov snimak.
            </p>
          </div>
        ) : data ? (
          <>
            <div className="admin-danas-card">
              <div className="admin-danas-row">
                <div>
                  <h2 className="admin-danas-title">Danas (Beograd · CET)</h2>
                  <div className="admin-danas-num">{displayToday.total}</div>
                  <div className="admin-danas-sub">Leadova danas · reset u ponoć</div>
                </div>
                <div className="admin-danas-countdown" style={{ contain: "layout" }}>
                  {frozen ? (
                    <FrozenBelgradeClock />
                  ) : (
                    <>
                      {displayToday.belgradeTime && (
                        <div className="admin-danas-time">{displayToday.belgradeTime}</div>
                      )}
                      {displayToday.secondsUntilMidnight != null && displayToday.secondsUntilMidnight > 0 && (
                        <CountdownDisplay
                          initialSeconds={displayToday.secondsUntilMidnight}
                          onReset={handleCountdownReset}
                        />
                      )}
                    </>
                  )}
                  <div className="admin-danas-reset-label">do resetovanja</div>
                </div>
              </div>
              <div className="admin-danas-sources">
                <span>IG: {displayToday.bySource?.instagram ?? 0}</span>
                <span>FB: {displayToday.bySource?.facebook ?? 0}</span>
                <span>TikTok: {displayToday.tiktokLeads ?? 0}</span>
                <span>Direktno: {displayToday.direct ?? 0}</span>
              </div>
            </div>

            <div className="admin-stats-grid">
              <div className="admin-stat-card" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,212,255,0.15)" }}>
                <Users size={20} color="#00d4ff" style={{ marginBottom: 8 }} />
                <div className="admin-stat-num" style={{ color: "#fff" }}>{data.total}</div>
                <div className="admin-stat-label">Ukupno leadova</div>
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
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa", marginBottom: 12 }}>Debug – Sheet podaci</h3>
                <div style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>
                  Sheet redova: <strong style={{ color: "#fff" }}>{data.debug.sheetRowsTotal}</strong>
                  {" · "}
                  Po izvoru (pre filtra): {JSON.stringify(data.debug.sheetBySource)}
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
                          readOnly={frozen}
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
        .admin-period-label { font-size: 12px; color: #555; }
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
