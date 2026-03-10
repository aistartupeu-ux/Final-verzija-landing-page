"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, ShoppingCart } from "lucide-react";

interface AffiliateData { token: string; name: string; commissionRate: number; }

interface Conversion {
  id: string;
  order_amount: number;
  commission_amount: number;
  status: string;
  created_at: string;
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

export default function AffiliateEarningsPage() {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ total: 0, pending: 0, paid: 0 });

  const fetchData = useCallback(async (aff: AffiliateData) => {
    try {
      const res = await fetch("/api/affiliate/stats", { headers: { "x-affiliate-token": aff.token } });
      if (res.ok) {
        const data = await res.json();
        setConversions(data.recentConversions ?? []);
        setTotals({ total: data.totalEarned, pending: data.pendingEarned, paid: data.paidEarned });
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("ayhype_affiliate");
    if (stored) {
      try {
        const aff = JSON.parse(stored);
        setAffiliate(aff);
        fetchData(aff);
      } catch { setLoading(false); }
    } else { setLoading(false); }
  }, [fetchData]);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Zarade</h1>
        <p style={{ fontSize: 14, color: "#666" }}>Pregled svih konverzija i zarada.</p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Ukupno Zarade", val: totals.total, color: "#00d4ff" },
          { label: "Na čekanju", val: totals.pending, color: "#f59e0b" },
          { label: "Isplaćeno", val: totals.paid, color: "#22c55e" },
          { label: "Komisija", val: affiliate?.commissionRate ?? 30, color: "#8b5cf6", suffix: "%" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "22px 20px", borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>
              {s.val.toLocaleString()}{s.suffix ?? " RSD"}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ padding: "24px", borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <ShoppingCart size={15} color="#22c55e" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#ddd" }}>Sve Konverzije</span>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#555" }}>Učitavam...</div>
        ) : conversions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#444", fontSize: 13 }}>
            Još nema konverzija. Počni da deliš svoj link!
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Datum", "Iznos prodaje", "Tvoja provizija", "Status"].map(h => (
                    <th key={h} style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: ".08em", padding: "10px 14px", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {conversions.map(c => (
                  <tr key={c.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "13px 14px", fontSize: 13, color: "#888" }}>{new Date(c.created_at).toLocaleDateString("sr-RS")}</td>
                    <td style={{ padding: "13px 14px", fontSize: 13, color: "#ddd", fontWeight: 600 }}>{Number(c.order_amount).toLocaleString()} RSD</td>
                    <td style={{ padding: "13px 14px", fontSize: 13, color: "#22c55e", fontWeight: 700 }}>+{Number(c.commission_amount).toLocaleString()} RSD</td>
                    <td style={{ padding: "13px 14px" }}>
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
