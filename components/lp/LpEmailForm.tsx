"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle, Loader2, XCircle } from "lucide-react";
import { getLeadSourceData } from "@/lib/affiliate-tracking";
import { useEmailVerify } from "@/lib/use-email-verify";
import { pushLeadToDataLayer, storeLeadForThankYou } from "@/lib/tiktok-datalayer";
import { landingChannelFromPathname } from "@/lib/landing-attribution";
import { useRouter, usePathname } from "next/navigation";

export default function LpEmailForm({ microcopy }: { microcopy?: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const { state: verifyState, error: verifyError, check: verifyCheck } = useEmailVerify();

  useEffect(() => {
    verifyCheck(email);
  }, [email, verifyCheck]);

  const valid = verifyState === "valid";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    setError(null);
    setLoading(true);
    setError(null);
    const eventId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const sourceData = getLeadSourceData();
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone: null,
          utm_source: sourceData.utm_source,
          utm_medium: sourceData.utm_medium,
          utm_campaign: sourceData.utm_campaign,
          affiliate_code: sourceData.affiliate_code,
          source_tag: sourceData.source_tag,
          event_id: eventId,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.error("Leads API error:", errJson);
        setError("Došlo je do greške. Pokušajte ponovo.");
        setLoading(false);
        return;
      }

      // Meta/TikTok konverzije na thank-you (jednom). dataLayer na submit za GTM na Meta putu.
      await pushLeadToDataLayer(email, null);
      storeLeadForThankYou(email.trim().toLowerCase(), null, eventId, landingChannelFromPathname(pathname));
      setPendingEventId(eventId);
      setDone(true);
      setLoading(false);
    } catch {
      setError("Greška u konekciji. Pokušajte ponovo.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!done || !pendingEventId) return;
    const t = window.setTimeout(() => router.push(`/thank-you?eid=${encodeURIComponent(pendingEventId)}`), 2800);
    return () => window.clearTimeout(t);
  }, [done, pendingEventId, router]);

  if (done) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(74,222,128,0.08)",
          border: "1px solid rgba(74,222,128,0.22)",
          borderRadius: 14,
          padding: "14px 16px",
          animation: "fadeInUp 0.4s ease forwards",
        }}>
          <CheckCircle size={18} color="#4ade80" />
          <span style={{ color: "#f0f4ff", fontWeight: 600, fontSize: 14, lineHeight: 1.35 }}>
            Uspešno!
            <span style={{ display: "block", fontWeight: 400, color: "rgba(226,232,240,0.7)", fontSize: 13, marginTop: 2 }}>
              Čekaj naš mail. Bićeš obavešten čim se kurs otvori.
            </span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ width: "100%" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .lp-ef-row{display:flex;align-items:stretch;border-radius:50px;overflow:hidden}
        .lp-ef-btn{padding:16px 28px;background:linear-gradient(135deg,#00d4ff 0%,#00b0e0 100%);border:none;cursor:pointer;color:#050508;font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;font-family:inherit;transition:all 0.3s ease;flex-shrink:0}
        .lp-ef-btn:disabled{opacity:0.55;cursor:not-allowed}
        @media(max-width:480px){.lp-ef-row{flex-direction:column;border-radius:16px;gap:8px;overflow:visible}.lp-ef-btn{border-radius:12px !important;width:100%;padding:14px 20px}}
        @media (prefers-reduced-motion: reduce){.lp-ef-btn{transition:none}}
      `}</style>
      <div
        className="lp-ef-row"
        style={{
          border: `1px solid ${
            error || verifyState === "invalid"
              ? "rgba(239,68,68,0.35)"
              : focused
                ? "rgba(0,212,255,0.4)"
                : "rgba(0,212,255,0.15)"
          }`,
          background: "rgba(255,255,255,0.03)",
          boxShadow: focused ? "0 0 30px rgba(0,212,255,0.08)" : "none",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", position: "relative" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Unesi svoj email"
            autoComplete="email"
            inputMode="email"
            required
            style={{
              flex: 1,
              minWidth: 0,
              padding: "16px 44px 16px 20px",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 15,
              fontFamily: "inherit",
              width: "100%",
            }}
          />
          {verifyState === "checking" && (
            <Loader2 size={18} color="#00d4ff" style={{ position: "absolute", right: 16, animation: "spin 1s linear infinite" }} />
          )}
          {verifyState === "valid" && (
            <CheckCircle size={18} color="#22c55e" style={{ position: "absolute", right: 16 }} />
          )}
          {verifyState === "invalid" && (
            <XCircle size={18} color="#ef4444" style={{ position: "absolute", right: 16 }} />
          )}
        </div>
        <button type="submit" disabled={!valid || loading} className="lp-ef-btn">
          {loading ? (
            <>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              Slanje...
            </>
          ) : (
            <>
              Join The Hype <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>

      {(error || verifyError) && (
        <div style={{ marginTop: 10, color: "#ef4444", fontSize: 13, textAlign: "center" }}>
          {error || verifyError}
        </div>
      )}

      {microcopy && (
        <div style={{ marginTop: 10, color: "rgba(226,232,240,0.40)", fontSize: 13, textAlign: "center" }}>
          {microcopy}
        </div>
      )}
    </form>
  );
}

