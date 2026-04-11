"use client";

import { useEffect, useState } from "react";
import { Montserrat } from "next/font/google";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, XCircle } from "lucide-react";
import { trackAffiliateLeadOnSubmit, getLeadSourceData } from "@/lib/affiliate-tracking";
import { isAllowedEmailDomain, EMAIL_DOMAIN_ERROR } from "@/lib/email-domains";
import { useEmailVerify } from "@/lib/use-email-verify";
import { pushLeadToDataLayer, storeLeadForThankYou } from "@/lib/tiktok-datalayer";
import { landingChannelFromPathname } from "@/lib/landing-attribution";
import { broadcastWaitlistRefresh } from "@/lib/waitlist-refresh";
import { useRouter, usePathname } from "next/navigation";

const montserratHeroInput = Montserrat({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export default function EmailForm({
  microcopy,
  className,
  variant = "default",
}: {
  microcopy?: string;
  className?: string;
  /** Samo hero: Montserrat regular + beli placeholder; CTA „Pridruži se“ sa strelicom ulevo; jače dugme. */
  variant?: "default" | "hero";
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [step, setStep] = useState<"email" | "done">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [didRedirect, setDidRedirect] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const { state: verifyState, error: verifyError, check: verifyCheck } = useEmailVerify();

  useEffect(() => {
    verifyCheck(email);
  }, [email, verifyCheck]);

  const canSubmit = verifyState === "valid";

  const submitLead = async (e: React.FormEvent) => {
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
    setError(null);
    setLoading(true);
    const eventId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
      const leadJson = (await res.json().catch(() => ({}))) as { duplicate?: boolean; error?: string };
      if (!res.ok) {
        console.error("Leads API error:", leadJson);
        setError("Došlo je do greške. Pokušajte ponovo ili nas kontaktirajte.");
        setLoading(false);
        return;
      }
      if (!leadJson.duplicate) broadcastWaitlistRefresh();
      await pushLeadToDataLayer(email, null);
      storeLeadForThankYou(email.trim().toLowerCase(), null, eventId, landingChannelFromPathname(pathname));
      trackAffiliateLeadOnSubmit({ email, phone: null });
      setPendingEventId(eventId);
      setLoading(false);
      setStep("done");
    } catch {
      setError("Greška u konekciji. Proverite internet i pokušajte ponovo.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step !== "done" || didRedirect || !pendingEventId) return;
    const t = window.setTimeout(() => {
      setDidRedirect(true);
      router.push(`/thank-you?eid=${encodeURIComponent(pendingEventId)}`);
    }, 2800);
    return () => window.clearTimeout(t);
  }, [didRedirect, pendingEventId, router, step]);

  if (step === "done") {
    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: 50,
            padding: "14px 28px",
            animation: "fadeInUp 0.4s ease forwards",
          }}
        >
          <CheckCircle size={18} color="#22c55e" />
          <span style={{ color: "#22c55e", fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
            Uspešno ste se prijavili!
            <br />
            Na email koji ste uneli uskoro stiže poruka sa potvrdom i više informacija.
            <br />
            Bićete obavešteni čim se kurs otvori.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <style>{`
        .ef-email-row{display:flex;align-items:stretch;border-radius:50px;overflow:hidden}
        .ef-email-btn{padding:16px 28px;background:linear-gradient(135deg,#00d4ff 0%,#00b0e0 100%);border:none;cursor:pointer;color:#050508;font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;font-family:inherit;transition:all 0.3s ease;flex-shrink:0}
        .ef-email-btn--hero{text-transform:none;letter-spacing:0.02em;font-size:15px;font-weight:800;color:#fff;background:linear-gradient(135deg,#00d4ff 0%,#7c3aed 100%);text-shadow:0 1px 10px rgba(0,0,0,0.25);box-shadow:0 0 24px rgba(0,212,255,0.45),0 0 42px rgba(124,58,237,0.3),0 0 0 1px rgba(255,255,255,0.16) inset;border:1px solid rgba(255,255,255,0.22)}
        .ef-email-btn--hero:not(:disabled):hover{box-shadow:0 0 28px rgba(0,212,255,0.6),0 0 56px rgba(124,58,237,0.42),0 0 0 1px rgba(255,255,255,0.22) inset;transform:translateY(-1px)}
        .ef-email-input::placeholder{color:#000;opacity:1;font-weight:600}
        .ef-email-input-hero::placeholder{color:#000;opacity:1;font-weight:600}
        @media(max-width:480px){.ef-email-row{flex-direction:column;border-radius:16px;gap:8px;overflow:visible}        .ef-email-btn{border-radius:12px !important;width:100%;padding:14px 20px}
        .ef-email-btn:disabled{cursor:not-allowed}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
      `}</style>
      <form onSubmit={submitLead} style={{ maxWidth: 520, margin: "0 auto" }}>
        <div
          className="ef-email-row"
          style={{
            border: `1px solid ${
              verifyState === "invalid"
                ? "rgba(239,68,68,0.4)"
                : focused
                  ? variant === "hero"
                    ? "rgba(0,212,255,0.65)"
                    : "rgba(0,212,255,0.4)"
                  : variant === "hero"
                    ? "rgba(0,212,255,0.35)"
                    : "rgba(0,212,255,0.15)"
            }`,
            background:
              variant === "hero"
                ? "linear-gradient(135deg, rgba(0,212,255,0.09), rgba(124,58,237,0.08))"
                : "rgba(255,255,255,0.03)",
            boxShadow:
              variant === "hero"
                ? focused
                  ? "0 0 34px rgba(0,212,255,0.25), 0 0 64px rgba(124,58,237,0.16)"
                  : "0 0 20px rgba(0,212,255,0.12)"
                : focused
                  ? "0 0 30px rgba(0,212,255,0.08)"
                  : "none",
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
              borderRight: "1px solid rgba(0,212,255,0.2)",
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
              required
              className={`ef-email-input ${variant === "hero" ? `ef-email-input-hero ${montserratHeroInput.className}` : ""}`.trim()}
              style={{
                flex: 1,
                minWidth: 0,
                padding: "16px 44px 16px 20px",
                background: "rgba(255,255,255,0.94)",
                border: "none",
                outline: "none",
                color: "#0b1020",
                fontSize: 15,
                fontFamily: variant === "hero" ? undefined : "inherit",
                fontWeight: variant === "hero" ? 400 : undefined,
                width: "100%",
              }}
            />
            {verifyState === "checking" && (
              <Loader2
                size={18}
                color="#00d4ff"
                style={{ position: "absolute", right: 16, animation: "spin 1s linear infinite", willChange: "transform" }}
              />
            )}
            {verifyState === "valid" && (
              <CheckCircle size={18} color="#22c55e" style={{ position: "absolute", right: 16 }} />
            )}
            {verifyState === "invalid" && (
              <XCircle size={18} color="#ef4444" style={{ position: "absolute", right: 16 }} />
            )}
          </div>
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className={`ef-email-btn${variant === "hero" ? " ef-email-btn--hero" : ""}`}
            style={{
              opacity: 1,
              cursor: canSubmit && !loading ? "pointer" : "not-allowed",
            }}
          >
            {loading ? (
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite", willChange: "transform" }} />
            ) : variant === "hero" ? (
              <>
                <ArrowLeft size={15} aria-hidden />
                Pridruži se
              </>
            ) : (
              <>
                Join The Hype <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </form>
      {(error || verifyError) && (
        <p style={{ textAlign: "center", fontSize: 13, color: "#ef4444", marginTop: 12 }}>
          {error || verifyError}
        </p>
      )}
      {microcopy && (
        <p style={{ textAlign: "center", fontSize: 12, color: "#555", marginTop: 12, letterSpacing: "0.02em" }}>
          {microcopy}
        </p>
      )}
    </div>
  );
}
