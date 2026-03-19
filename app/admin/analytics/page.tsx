"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Loader2,
  Lock,
  RefreshCw,
  Instagram,
  Facebook,
  Share2,
  Radio,
} from "lucide-react";
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
  onResetRef.current = onReset;

  useEffect(() => {
    if (initialSeconds > 0) setSec(initialSeconds);
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
    <div style={{ fontSize: 18, fontWeight: 700, color: "#00d4ff", fontVariantNumeric: "tabular-nums", contain: "layout" }}>
      {Math.floor(sec / 3600)}h {Math.floor((sec % 3600) / 60)}m {sec % 60}s
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [secret, setSecret] = useState("");
  const [auth, setAuth] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [metaAds, setMetaAds] = useState<{
    instagram: { spend: number; leads: number; cpl: number | null };
    facebook: { spend: number; leads: number; cpl: number | null };
  } | null>(null);
  const [tiktokSpend, setTiktokSpend] = useState("");
  const [todayData, setTodayData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("admin_analytics_secret");
    if (saved) setAuth(saved);
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    if (!from) setFrom(firstDay.toISOString().slice(0, 10));
    if (!to) setTo(now.toISOString().slice(0, 10));
  }, []);

  const fetchTodayData = useCallback(async (token: string) => {
    try {
      const params = new URLSearchParams();
      params.set("secret", token);
      params.set("today", "1");
      const res = await fetch(`/api/admin/analytics?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setTodayData(json);
      }
    } catch {
      // opciono
    }
  }, []);

  const fetchData = async (token: string, silent = false, withDebug = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("secret", token);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (withDebug) params.set("debug", "1");
      const res = await fetch(`/api/admin/analytics?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("admin_analytics_secret");
          setAuth(null);
          setData(null);
          setError("Pogrešan pristupni kod. Unesi ponovo.");
          return;
        }
        throw new Error(await res.text());
      }
      const json = await res.json();
      setData(json);
      fetchTodayData(token);

      const mp = new URLSearchParams();
      mp.set("secret", token);
      if (from) mp.set("from", from);
      if (to) mp.set("to", to);
      try {
        const metaRes = await fetch(`/api/admin/meta-ads?${mp}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (metaRes.ok) {
          const metaJson = await metaRes.json();
          if (metaJson.instagram || metaJson.facebook) {
            setMetaAds({
              instagram: metaJson.instagram ?? { spend: 0, leads: 0, cpl: null },
              facebook: metaJson.facebook ?? { spend: 0, leads: 0, cpl: null },
            });
          }
        }
      } catch {
        // Meta API opciono
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Greška pri učitavanju.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim() || attempts >= maxAttempts) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("secret", secret.trim());
      const res = await fetch(`/api/admin/analytics?${params}`, {
        headers: { Authorization: `Bearer ${secret.trim()}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          setAttempts((a) => a + 1);
          const left = maxAttempts - attempts - 1;
          if (left <= 0) {
            setError(`Pogrešan kod. Dostignut maksimum (${maxAttempts}) pokušaja. Osveži stranicu da pokušaš ponovo.`);
          } else {
            setError(`Pogrešan kod. Preostalo pokušaja: ${left}.`);
          }
          setSecret("");
          return;
        }
        throw new Error(await res.text());
      }
      const json = await res.json();
      localStorage.setItem("admin_analytics_secret", secret.trim());
      setAuth(secret.trim());
      setData(json);
      fetchTodayData(secret.trim());
      setAttempts(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Greška pri prijavi.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_analytics_secret");
    setAuth(null);
    setData(null);
    setTodayData(null);
    setMetaAds(null);
    setSecret("");
    setAttempts(0);
  };

  useEffect(() => {
    if (auth && !data && !loading) fetchData(auth);
  }, [auth]);

  const authRef = useRef(auth);
  authRef.current = auth;

  const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!auth || !data) return;
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
            const t = authRef.current;
            if (t) fetchData(t, true);
            fetchDebounceRef.current = null;
          }, 800);
        }
      ).subscribe();
      return () => {
        if (fetchDebounceRef.current) clearTimeout(fetchDebounceRef.current);
        client.removeChannel(ch);
      };
    }
  }, [auth, data]);

  useEffect(() => {
    if (!auth || !data) return;
    const id = setInterval(() => { const t = authRef.current; if (t) fetchData(t, true); }, 30000);
    return () => clearInterval(id);
  }, [auth, data]);

  const handleRefresh = () => auth && fetchData(auth);
  const handleCountdownReset = useCallback(() => {
    const t = authRef.current;
    if (t) fetchTodayData(t);
  }, [fetchTodayData]);

  const tiktokSpendNum = parseFloat(tiktokSpend.replace(",", ".")) || 0;
  const totalLeads = data?.total ?? 0;
  const tiktokCpl = data?.tiktokLeads ? tiktokSpendNum / data.tiktokLeads : null;
  const pct = useCallback((n: number) => totalLeads > 0 ? Math.round((n / totalLeads) * 100) : 0, [totalLeads]);
  const sortedSources = useMemo(() => {
    if (!data?.bySource) return [];
    return Object.entries(data.bySource)
      .filter(([s]) => s !== "affiliate" && s !== "null" && s !== "")
      .sort((a, b) => b[1] - a[1]);
  }, [data?.bySource]);

  if (!auth) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 400, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <Lock size={40} color="#00d4ff" style={{ margin: "0 auto 16px", display: "block" }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Admin Analytics</h1>
            <p style={{ fontSize: 14, color: "#888" }}>Unesi pristupni kod</p>
          </div>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && (
              <p style={{ fontSize: 13, color: "#ef4444", textAlign: "center", margin: 0 }}>{error}</p>
            )}
            <input
              type="password"
              value={secret}
              onChange={(e) => { setSecret(e.target.value); setError(null); }}
              placeholder="Pristupni kod"
              autoFocus
              disabled={attempts >= maxAttempts}
              style={{
                padding: "14px 18px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: 15,
                outline: "none",
                opacity: attempts >= maxAttempts ? 0.5 : 1,
              }}
            />
            <button
              type="submit"
              disabled={loading || attempts >= maxAttempts}
              style={{
                padding: "14px 20px",
                borderRadius: 14,
                background: attempts >= maxAttempts ? "#444" : "linear-gradient(135deg, #00d4ff 0%, #00b0e0 100%)",
                border: "none",
                color: attempts >= maxAttempts ? "#888" : "#050508",
                fontWeight: 700,
                cursor: attempts >= maxAttempts ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Provera..." : "Uđi"}
            </button>
          </form>
          <p style={{ fontSize: 12, color: "#555", textAlign: "center", marginTop: 24 }}>
            Pristup samo za administartore.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050508", padding: "24px 16px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link
              href="/"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#666", textDecoration: "none", fontSize: 13 }}
            >
              <ArrowLeft size={14} /> Nazad
            </Link>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#22c55e" }}>
              <Radio size={12} /> Live
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#555" }}>Period:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13 }}
            />
            <span style={{ color: "#555" }}>—</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13 }}
            />
            <button
              onClick={handleRefresh}
              disabled={loading}
              style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)", color: "#00d4ff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={14} style={{ opacity: loading ? 0.5 : 1 }} /> Osveži
            </button>
            <button
              onClick={() => auth && fetchData(auth, false, true)}
              disabled={loading}
              style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa", cursor: "pointer", fontSize: 12 }}
            >
              Debug
            </button>
            <button
              onClick={handleLogout}
              style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer", fontSize: 13 }}
            >
              Izlaz
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: 16, borderRadius: 14, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", marginBottom: 24 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
            <Loader2 size={32} color="#00d4ff" style={{ animation: "spin 1s linear infinite", willChange: "transform" }} />
          </div>
        ) : data ? (
          <>
            {todayData && (
              <div style={{ marginBottom: 24, padding: 20, borderRadius: 18, background: "linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(0,180,224,0.05) 100%)", border: "1px solid rgba(0,212,255,0.25)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: "#00d4ff", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      Danas (Beograd · CET)
                    </h2>
                    <div style={{ fontSize: 36, fontWeight: 800, color: "#fff" }}>{todayData.total}</div>
                    <div style={{ fontSize: 13, color: "#888" }}>Leadova danas · reset u ponoć</div>
                  </div>
                  <div style={{ textAlign: "right", contain: "layout" }}>
                    {todayData.belgradeTime && (
                      <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{todayData.belgradeTime}</div>
                    )}
                    {todayData.secondsUntilMidnight != null && todayData.secondsUntilMidnight > 0 && (
                      <CountdownDisplay
                        initialSeconds={todayData.secondsUntilMidnight}
                        onReset={handleCountdownReset}
                      />
                    )}
                    <div style={{ fontSize: 11, color: "#555" }}>do resetovanja</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16, fontSize: 12, color: "#aaa" }}>
                  <span>IG: {todayData.bySource?.instagram ?? 0}</span>
                  <span>FB: {todayData.bySource?.facebook ?? 0}</span>
                  <span>TikTok: {todayData.tiktokLeads ?? 0}</span>
                  <span>Direktno: {todayData.direct ?? 0}</span>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 32, contain: "layout" }}>
              <div style={{ padding: 24, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,212,255,0.15)" }}>
                <Users size={24} color="#00d4ff" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{data.total}</div>
                <div style={{ fontSize: 13, color: "#888" }}>Ukupno leadova</div>
              </div>
              <div style={{ padding: 24, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(228,64,95,0.25)" }}>
                <Instagram size={24} color="#E4405F" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{data.bySource.instagram ?? 0}</div>
                <div style={{ fontSize: 12, color: "#888" }}>Instagram · {pct(data.bySource.instagram ?? 0)}%</div>
              </div>
              <div style={{ padding: 24, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(24,119,242,0.25)" }}>
                <Facebook size={24} color="#1877F2" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{data.bySource.facebook ?? 0}</div>
                <div style={{ fontSize: 12, color: "#888" }}>Facebook · {pct(data.bySource.facebook ?? 0)}%</div>
              </div>
              <div style={{ padding: 24, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,242,234,0.25)" }}>
                <TrendingUp size={24} color="#00f2ea" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{data.tiktokLeads}</div>
                <div style={{ fontSize: 12, color: "#888" }}>TikTok · {pct(data.tiktokLeads)}%</div>
              </div>
              <div style={{ padding: 24, borderRadius: 18, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Share2 size={24} color="#888" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{data.direct}</div>
                <div style={{ fontSize: 12, color: "#888" }}>Direktno · {pct(data.direct)}%</div>
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

            <div style={{ marginBottom: 32, contain: "layout" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Raspodela po izvoru</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sortedSources.map(([source, count]) => (
                    <div key={source} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
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

            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Cost per Lead (CPL)</h2>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
                Meta (Instagram, Facebook) se automatski vuče iz Meta Ads. TikTok unesi ručno.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
                <div style={{ padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(228,64,95,0.2)" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#E4405F", marginBottom: 12 }}>Instagram</div>
                  {metaAds ? (
                    <>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                        {metaAds.instagram.cpl != null ? "€" + metaAds.instagram.cpl.toFixed(2) : "—"}
                      </div>
                      <div style={{ fontSize: 12, color: "#555" }}>
                        €{metaAds.instagram.spend.toFixed(2)} potrošeno · {metaAds.instagram.leads} leadova (Meta Ads)
                      </div>
                      <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                        Sajt: {data.bySource.instagram ?? 0} leadova
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: "#666" }}>Podesi META_ADS_ACCESS_TOKEN i META_AD_ACCOUNT_ID</div>
                  )}
                </div>
                <div style={{ padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(24,119,242,0.2)" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1877F2", marginBottom: 12 }}>Facebook</div>
                  {metaAds ? (
                    <>
                      <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                        {metaAds.facebook.cpl != null ? "€" + metaAds.facebook.cpl.toFixed(2) : "—"}
                      </div>
                      <div style={{ fontSize: 12, color: "#555" }}>
                        €{metaAds.facebook.spend.toFixed(2)} potrošeno · {metaAds.facebook.leads} leadova (Meta Ads)
                      </div>
                      <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                        Sajt: {data.bySource.facebook ?? 0} leadova
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: "#666" }}>Podesi META_ADS_ACCESS_TOKEN i META_AD_ACCOUNT_ID</div>
                  )}
                </div>
                <div style={{ padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,242,234,0.2)" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#00f2ea", marginBottom: 12 }}>TikTok</div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      value={tiktokSpend}
                      onChange={(e) => setTiktokSpend(e.target.value.replace(/[^0-9,.]/g, ""))}
                      placeholder="€ potrošeno"
                      style={{ flex: 1, minWidth: 100, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14 }}
                    />
                    {tiktokCpl !== null && tiktokCpl > 0 && (
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#00f2ea" }}>
                        CPL: €{tiktokCpl.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 8 }}>{data.tiktokLeads} leadova sa sajta</div>
                </div>
              </div>
            </div>

          </>
        ) : null}
      </div>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}
