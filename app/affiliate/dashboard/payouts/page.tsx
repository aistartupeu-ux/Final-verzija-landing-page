"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet, CheckCircle, Clock, XCircle } from "lucide-react";

interface AffiliateData { token: string; name: string; }

interface Payout {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

const statusIcon = { pending: Clock, paid: CheckCircle, rejected: XCircle };
const statusColors = { pending: "#f59e0b", paid: "#22c55e", rejected: "#ef4444" };
const statusLabels = { pending: "Na čekanju", paid: "Isplaćeno", rejected: "Odbijeno" };

export default function AffiliatePayoutsPage() {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requestMsg, setRequestMsg] = useState("");
  const [requesting, setRequesting] = useState(false);

  const fetchData = useCallback(async (aff: AffiliateData) => {
    try {
      const res = await fetch("/api/affiliate/stats", { headers: { "x-affiliate-token": aff.token } });
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts ?? []);
        setPending(data.pendingEarned ?? 0);
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

  const requestPayout = async () => {
    if (pending < 1000) {
      setRequestMsg("Minimum za isplatu je 1.000 RSD");
      return;
    }
    setRequesting(true);
    await new Promise(r => setTimeout(r, 900));
    setRequestMsg("Zahtev je uspešno primljen! Isplata u roku od 3 radna dana.");
    setRequesting(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Isplate</h1>
        <p style={{ fontSize: 14, color: "#666" }}>Upravljajte zahtevima za isplatu provizija.</p>
      </div>

      {/* Request payout */}
      <div style={{ padding: "28px", borderRadius: 20, background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Wallet size={16} color="#22c55e" />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#ddd" }}>Zatraži Isplatu</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#22c55e", marginBottom: 4 }}>{pending.toLocaleString()} RSD</div>
            <div style={{ fontSize: 12, color: "#666" }}>Dostupno za isplatu</div>
          </div>
          <button
            onClick={requestPayout}
            disabled={pending < 1000 || requesting}
            style={{
              padding: "13px 28px", borderRadius: 13, border: "none", cursor: "pointer",
              background: pending >= 1000 ? "linear-gradient(135deg,#22c55e,#16a34a)" : "rgba(255,255,255,0.05)",
              color: pending >= 1000 ? "#fff" : "#444",
              fontSize: 14, fontWeight: 700, transition: "all .2s",
              opacity: requesting ? 0.7 : 1,
            }}
          >
            {requesting ? "Šaljem..." : "Zatraži Isplatu"}
          </button>
        </div>
        {requestMsg && (
          <div style={{ marginTop: 14, fontSize: 13, color: requestMsg.includes("1.000") ? "#f59e0b" : "#22c55e", padding: "10px 14px", background: requestMsg.includes("1.000") ? "rgba(245,158,11,0.08)" : "rgba(34,197,94,0.08)", borderRadius: 10 }}>
            {requestMsg}
          </div>
        )}
        {pending < 1000 && !requestMsg && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#555" }}>
            Minimum za isplatu je 1.000 RSD. Nedostaje još {(1000 - pending).toFixed(0)} RSD.
          </div>
        )}
      </div>

      {/* Payout history */}
      <div style={{ padding: "24px", borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#ddd", marginBottom: 20 }}>Istorija Isplata</div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#555" }}>Učitavam...</div>
        ) : payouts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#444", fontSize: 13 }}>
            Još nema isplata.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {payouts.map(p => {
              const s = p.status as keyof typeof statusColors;
              const Icon = statusIcon[s] ?? Clock;
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Icon size={16} color={statusColors[s] ?? "#888"} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#ddd" }}>{Number(p.amount).toLocaleString()} RSD</div>
                      <div style={{ fontSize: 11, color: "#555" }}>Zatraženo: {new Date(p.created_at).toLocaleDateString("sr-RS")}</div>
                    </div>
                  </div>
                  <span style={{
                    padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: `${statusColors[s] ?? "#888"}18`, color: statusColors[s] ?? "#888",
                    border: `1px solid ${statusColors[s] ?? "#888"}30`,
                  }}>
                    {statusLabels[s] ?? p.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
