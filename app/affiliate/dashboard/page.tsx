"use client";

import { useEffect, useState, useCallback } from "react";
import { Copy, Check, MousePointer, ShoppingCart, TrendingUp, Percent, RefreshCw, ExternalLink, Wallet } from "lucide-react";

interface AffiliateData {
  id: string;
  name: string;
  email: string;
  affiliateCode: string;
  commissionRate: number;
  token: string;
}

interface StatsData {
  totalClicks: number;
  totalConversions: number;
  totalEarned: number;
  pendingEarned: number;
  paidEarned: number;
  conversionRate: string;
  chartData: { date: string; clicks: number }[];
  recentConversions: {
    id: string;
    order_amount: number;
    commission_amount: number;
    status: string;
    created_at: string;
  }[];
  payouts: {
    id: string;
    amount: number;
    status: string;
    created_at: string;
    paid_at: string | null;
  }[];
}

const statusColors: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#00d4ff",
  paid: "#22c55e",
  rejected: "#ef4444",
};

const statusLabels: Record<string, string> = {
  pending: "Na čekanju",
  approved: "Odobreno",
  paid: "Isplaćeno",
  rejected: "Odbijeno",
};

export default function AffiliateDashboardPage() {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState("");

  const fetchStats = useCallback(async (aff: AffiliateData) => {
    try {
      const res = await fetch("/api/affiliate/stats", {
        headers: { "x-affiliate-token": aff.token },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("ayhype_affiliate");
    if (stored) {
      try {
        const aff = JSON.parse(stored) as AffiliateData;
        setAffiliate(aff);
        fetchStats(aff);
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [fetchStats]);

  const refLink = affiliate
    ? `${typeof window !== "undefined" ? window.location.origin : "https://ayhypeacademy.com"}/ref/${affiliate.affiliateCode}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const requestPayout = async () => {
    if (!affiliate || !stats) return;
    if (stats.pendingEarned < 1000) {
      setPayoutMsg("Minimum za isplatu je 1.000 RSD");
      return;
    }
    setPayoutLoading(true);
    setPayoutMsg("");
    // In production, call a payout request API
    await new Promise(r => setTimeout(r, 800));
    setPayoutMsg("Zahtev za isplatu je primljen! Obradićemo ga u roku od 3 radna dana.");
    setPayoutLoading(false);
  };

  const statCards = stats
    ? [
        { icon: MousePointer, color: "#00d4ff", label: "Ukupno Klikova", value: stats.totalClicks.toLocaleString() },
        { icon: ShoppingCart, color: "#22c55e", label: "Konverzije", value: stats.totalConversions.toLocaleString() },
        { icon: TrendingUp, color: "#8b5cf6", label: "Ukupno Zarade", value: `${stats.totalEarned.toLocaleString()} RSD` },
        { icon: Percent, color: "#f59e0b", label: "Stopa Konverzije", value: `${stats.conversionRate}%` },
      ]
    : [];

  const maxClicks = stats ? Math.max(...stats.chartData.map(d => d.clicks), 1) : 1;

  return (
    <div>
      <style>{`
        .aff-stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:32px}
        @media(min-width:700px){.aff-stats-grid{grid-template-columns:repeat(4,1fr)}}
        .aff-two-col{display:grid;grid-template-columns:1fr;gap:20px;margin-bottom:24px}
        @media(min-width:800px){.aff-two-col{grid-template-columns:1.2fr 1fr}}
        .aff-table-wrap{overflow-x:auto}
        table{width:100%;border-collapse:collapse}
        th{font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.08em;padding:10px 14px;text-align:left}
        td{font-size:13px;color:#aaa;padding:12px 14px;border-top:1px solid rgba(255,255,255,0.04)}
        tr:hover td{background:rgba(255,255,255,0.01)}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
          Dobrodošao, <span style={{ color: "#00d4ff" }}>{affiliate?.name ?? "..."}</span>
        </h1>
        <p style={{ fontSize: 14, color: "#666" }}>Praćenje klikova, konverzija i zarade u realnom vremenu.</p>
      </div>

      {/* Stats cards */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ height: 110, borderRadius: 18, background: "rgba(255,255,255,0.02)", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : (
        <div className="aff-stats-grid">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} style={{
                padding: "22px 20px", borderRadius: 18,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${card.color}12`, border: `1px solid ${card.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} color={card.color} strokeWidth={1.8} />
                  </div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{card.value}</div>
                <div style={{ fontSize: 12, color: "#555" }}>{card.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Referral link + earnings summary */}
      <div className="aff-two-col">
        {/* Referral link card */}
        <div style={{ padding: "28px", borderRadius: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <ExternalLink size={16} color="#00d4ff" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#ddd" }}>Tvoj Referalni Link</span>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <input
              readOnly
              value={refLink}
              style={{
                flex: 1, padding: "11px 14px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)",
                borderRadius: 10, color: "#ccc", fontSize: 12, fontFamily: "monospace", outline: "none",
              }}
            />
            <button
              onClick={copyLink}
              style={{
                padding: "11px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13,
                background: copied ? "rgba(34,197,94,0.15)" : "rgba(0,212,255,0.1)",
                border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(0,212,255,0.25)"}`,
                color: copied ? "#22c55e" : "#00d4ff",
                display: "flex", alignItems: "center", gap: 6, transition: "all .2s", whiteSpace: "nowrap",
              }}
            >
              {copied ? <><Check size={14} /> Kopirano</> : <><Copy size={14} /> Kopiraj</>}
            </button>
          </div>
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>
            Svaki klik na ovaj link se prati. Kolačić važi <strong style={{ color: "#888" }}>30 dana</strong>. Provizija: <strong style={{ color: "#22c55e" }}>{affiliate?.commissionRate ?? 30}%</strong>
          </div>
          <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.08)", fontSize: 12, color: "#666" }}>
            Kod: <code style={{ color: "#00d4ff", fontFamily: "monospace" }}>{affiliate?.affiliateCode}</code>
          </div>
        </div>

        {/* Earnings summary */}
        <div style={{ padding: "28px", borderRadius: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Wallet size={16} color="#22c55e" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#ddd" }}>Zarade</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
            {[
              { label: "Na čekanju", val: stats?.pendingEarned ?? 0, color: "#f59e0b" },
              { label: "Isplaćeno", val: stats?.paidEarned ?? 0, color: "#22c55e" },
              { label: "Ukupno", val: stats?.totalEarned ?? 0, color: "#00d4ff" },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <span style={{ fontSize: 13, color: "#777" }}>{row.label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: row.color }}>{row.val.toLocaleString()} RSD</span>
              </div>
            ))}
          </div>
          <button
            onClick={requestPayout}
            disabled={payoutLoading || (stats?.pendingEarned ?? 0) < 1000}
            style={{
              width: "100%", padding: "12px", borderRadius: 12, border: "none", cursor: "pointer",
              background: (stats?.pendingEarned ?? 0) >= 1000
                ? "linear-gradient(135deg,#22c55e,#16a34a)"
                : "rgba(255,255,255,0.04)",
              color: (stats?.pendingEarned ?? 0) >= 1000 ? "#fff" : "#444",
              fontSize: 13, fontWeight: 700, transition: "all .2s",
              opacity: payoutLoading ? 0.7 : 1,
            }}
          >
            {payoutLoading ? "Šaljem zahtev..." : "Zatraži Isplatu"}
          </button>
          {payoutMsg && (
            <div style={{ marginTop: 10, fontSize: 12, color: payoutMsg.includes("1.000") ? "#f59e0b" : "#22c55e", lineHeight: 1.5 }}>
              {payoutMsg}
            </div>
          )}
          {(stats?.pendingEarned ?? 0) < 1000 && (
            <div style={{ marginTop: 8, fontSize: 11, color: "#555" }}>
              Minimum za isplatu: 1.000 RSD (nedostaje {(1000 - (stats?.pendingEarned ?? 0)).toFixed(0)} RSD)
            </div>
          )}
        </div>
      </div>

      {/* Clicks Chart */}
      {stats && (
        <div style={{ padding: "28px", borderRadius: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MousePointer size={15} color="#00d4ff" />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#ddd" }}>Klikovi, poslednjih 30 dana</span>
            </div>
            <button
              onClick={() => affiliate && fetchStats(affiliate)}
              style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}
              onMouseEnter={e => (e.currentTarget.style.color = "#00d4ff")}
              onMouseLeave={e => (e.currentTarget.style.color = "#555")}
            >
              <RefreshCw size={13} /> Osvježi
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120, overflowX: "auto", paddingBottom: 4 }}>
            {stats.chartData.map((d, i) => {
              const heightPct = maxClicks > 0 ? (d.clicks / maxClicks) * 100 : 0;
              const isToday = i === stats.chartData.length - 1;
              return (
                <div key={i} title={`${d.date}: ${d.clicks} klikova`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: "0 0 auto", width: 18, cursor: "default" }}>
                  <div style={{
                    width: "100%", borderRadius: "4px 4px 0 0",
                    background: isToday ? "#00d4ff" : d.clicks > 0 ? "rgba(0,212,255,0.5)" : "rgba(255,255,255,0.05)",
                    height: `${Math.max(heightPct, d.clicks > 0 ? 8 : 4)}%`,
                    transition: "height .3s ease",
                    minHeight: 4,
                  }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: "#444" }}>
            <span>{stats.chartData[0]?.date}</span>
            <span>{stats.chartData[stats.chartData.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Recent Conversions */}
      <div style={{ padding: "28px", borderRadius: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <ShoppingCart size={15} color="#22c55e" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#ddd" }}>Poslednje Konverzije</span>
        </div>
        {!stats || stats.recentConversions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#444", fontSize: 13 }}>
            Još uvek nema konverzija. Počni da deliš svoj link!
          </div>
        ) : (
          <div className="aff-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Iznos prodaje</th>
                  <th>Tvoja provizija</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentConversions.map(c => (
                  <tr key={c.id}>
                    <td>{new Date(c.created_at).toLocaleDateString("sr-RS")}</td>
                    <td style={{ color: "#ddd", fontWeight: 600 }}>{Number(c.order_amount).toLocaleString()} RSD</td>
                    <td style={{ color: "#22c55e", fontWeight: 700 }}>+{Number(c.commission_amount).toLocaleString()} RSD</td>
                    <td>
                      <span style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: `${statusColors[c.status] ?? "#888"}18`,
                        color: statusColors[c.status] ?? "#888",
                        border: `1px solid ${statusColors[c.status] ?? "#888"}30`,
                      }}>
                        {statusLabels[c.status] ?? c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
