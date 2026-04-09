"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle, Download, Loader2, XCircle } from "lucide-react";
import { getLeadSourceData } from "@/lib/affiliate-tracking";
import { isAllowedEmailDomain, EMAIL_DOMAIN_ERROR } from "@/lib/email-domains";
import { useEmailVerify } from "@/lib/use-email-verify";

type Status = "idle" | "loading" | "done";

export default function LeadMagnetForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const { state: verifyState, error: verifyError, check: verifyCheck } = useEmailVerify();

  useEffect(() => {
    verifyCheck(email);
  }, [email, verifyCheck]);

  const instantDownloadUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_LEAD_MAGNET_DOWNLOAD_URL?.trim() || "";
  }, []);
  const canShowInstantDownload = useMemo(() => {
    if (!instantDownloadUrl) return false;
    try {
      const url = new URL(instantDownloadUrl);
      if (typeof window === "undefined") return false;
      return url.hostname !== window.location.hostname;
    } catch {
      return false;
    }
  }, [instantDownloadUrl]);

  const valid = verifyState === "valid";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    if (!isAllowedEmailDomain(email)) {
      setError(EMAIL_DOMAIN_ERROR);
      return;
    }
    if (verifyState !== "valid") {
      setError(verifyError ?? "Proverite da li je email adresa validna i da postoji.");
      return;
    }
    if (loading) return;
    setError(null);
    setLoading(true);
    setStatus("loading");
    try {
      const sourceData = getLeadSourceData();
      const res = await fetch("/api/lead-magnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone: null,
          name: null,
          utm_source: sourceData.utm_source,
          utm_medium: sourceData.utm_medium,
          utm_campaign: sourceData.utm_campaign ?? "lead_magnet",
          affiliate_code: sourceData.affiliate_code,
          source_tag: "lead_magnet",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Lead magnet API error:", err);
        setError("Došlo je do greške. Pokušajte ponovo.");
        setLoading(false);
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch {
      setError("Greška u konekciji. Pokušajte ponovo.");
      setStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  if (status === "done") {
    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(34,197,94,0.10)",
            border: "1px solid rgba(34,197,94,0.26)",
            borderRadius: 18,
            padding: "14px 16px",
          }}
        >
          <CheckCircle size={18} color="#22c55e" />
          <span style={{ color: "#f0f4ff", fontWeight: 650, fontSize: 14, lineHeight: 1.35 }}>
            Poslato.
            <span style={{ display: "block", fontWeight: 450, color: "rgba(226,232,240,0.65)", fontSize: 13, marginTop: 2 }}>
              Proveri email za link ka fajlu.
            </span>
          </span>
        </div>
        {canShowInstantDownload ? (
          <div style={{ marginTop: 16 }}>
            <a
              href={instantDownloadUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderRadius: 14,
                textDecoration: "none",
                background: "linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(0,212,255,0.12) 100%)",
                border: "1px solid rgba(168,85,247,0.25)",
                color: "#f0f4ff",
                fontWeight: 650,
                fontSize: 14,
              }}
            >
              <Download size={18} color="#a855f7" />
              Instant download
            </a>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ width: "100%" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .lm-row{display:flex;align-items:stretch;border-radius:50px;overflow:hidden}
        .lm-btn{padding:16px 22px;background:linear-gradient(135deg,#a855f7 0%,#7c3aed 100%);border:none;cursor:pointer;color:#050508;font-weight:800;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;font-family:inherit;transition:all 0.3s ease;flex-shrink:0}
        .lm-btn:disabled{opacity:0.6;cursor:not-allowed}
        .lm-input::placeholder{color:#000;opacity:1;font-weight:600}
        @media(max-width:480px){.lm-row{flex-direction:column;border-radius:16px;gap:8px;overflow:visible}.lm-btn{border-radius:12px !important;width:100%;padding:14px 20px}}
      `}</style>
      <div
        className="lm-row"
        style={{
          border: `1px solid ${
            error || verifyState === "invalid" ? "rgba(239,68,68,0.35)" : focused ? "rgba(168,85,247,0.40)" : "rgba(255,255,255,0.10)"
          }`,
          background: "rgba(255,255,255,0.03)",
          boxShadow: focused ? "0 0 30px rgba(168,85,247,0.10)" : "none",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            position: "relative",
            background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,248,255,0.96))",
            borderRight: "1px solid rgba(168,85,247,0.2)",
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Unesi svoj email"
            autoComplete="email"
            inputMode="email"
            required
            className="lm-input"
            style={{
              flex: 1,
              minWidth: 0,
              padding: "16px 44px 16px 20px",
              background: "rgba(255,255,255,0.94)",
              border: "none",
              outline: "none",
              color: "#0b1020",
              fontSize: 15,
              fontFamily: "inherit",
              width: "100%",
            }}
          />
          {verifyState === "checking" && (
            <Loader2 size={18} color="#a855f7" style={{ position: "absolute", right: 16, animation: "spin 1s linear infinite", willChange: "transform" }} />
          )}
          {verifyState === "valid" && <CheckCircle size={18} color="#22c55e" style={{ position: "absolute", right: 16 }} />}
          {verifyState === "invalid" && <XCircle size={18} color="#ef4444" style={{ position: "absolute", right: 16 }} />}
        </div>
        <button type="submit" disabled={!valid || loading} className="lm-btn">
          {loading ? (
            <>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite", willChange: "transform" }} />
              Slanje...
            </>
          ) : (
            <>
              Preuzmi <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>

      {(error || verifyError) && (
        <div style={{ marginTop: 10, color: "#ef4444", fontSize: 13, textAlign: "center" }}>
          {error || verifyError}
        </div>
      )}
    </form>
  );
}

