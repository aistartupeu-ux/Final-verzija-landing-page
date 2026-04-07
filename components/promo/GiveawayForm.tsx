"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle, Gift, Loader2, XCircle } from "lucide-react";
import { getLeadSourceData } from "@/lib/affiliate-tracking";
import { storeLeadForThankYou } from "@/lib/tiktok-datalayer";
import { landingChannelFromPathname } from "@/lib/landing-attribution";
import { isAllowedEmailDomain, EMAIL_DOMAIN_ERROR } from "@/lib/email-domains";
import { useEmailVerify } from "@/lib/use-email-verify";
import PhoneInput, { type Value } from "react-phone-number-input";
import { usePathname, useRouter } from "next/navigation";
import "react-phone-number-input/style.css";

type Step = "email" | "phone" | "done";

type GiveawayAccent = "cyan" | "gold";

export default function GiveawayForm({ accent = "cyan" }: { accent?: GiveawayAccent }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const gold = accent === "gold";
  const borderDefault = gold ? "rgba(251,191,36,0.2)" : "rgba(0,212,255,0.15)";
  const borderFocus = gold ? "rgba(251,191,36,0.45)" : "rgba(0,212,255,0.4)";
  const shadowFocus = gold ? "0 0 30px rgba(251,191,36,0.10)" : "0 0 30px rgba(0,212,255,0.08)";
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<Value | undefined>();
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [didRedirect, setDidRedirect] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const { state: verifyState, error: verifyError, check: verifyCheck } = useEmailVerify();
  const typingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    verifyCheck(email);
  }, [email, verifyCheck]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (step !== "done" || didRedirect || !pendingEventId) return;
    const t = window.setTimeout(() => {
      setDidRedirect(true);
      router.push("/thank-yougw");
    }, 1000);
    return () => window.clearTimeout(t);
  }, [didRedirect, pendingEventId, router, step]);

  const submitEmail = (e: React.FormEvent) => {
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
    setStep("phone");
  };

  const submit = async (e: React.FormEvent, skipPhone = false) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    const eventId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const sourceData = getLeadSourceData();
      const res = await fetch("/api/giveaway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone: skipPhone || !phone ? null : phone,
          utm_source: sourceData.utm_source,
          utm_medium: sourceData.utm_medium,
          utm_campaign: sourceData.utm_campaign ?? null,
          affiliate_code: null,
          source_tag: "giveaway",
          event_id: eventId,
          name: null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Giveaway API error:", err);
        setError("Došlo je do greške. Pokušajte ponovo.");
        setLoading(false);
        return;
      }
      storeLeadForThankYou(email.trim().toLowerCase(), skipPhone || !phone ? null : phone, eventId, landingChannelFromPathname(pathname));
      setPendingEventId(eventId);
      setStep("done");
    } catch {
      setError("Greška u konekciji. Pokušajte ponovo.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(74,222,128,0.10)",
            border: "1px solid rgba(74,222,128,0.26)",
            borderRadius: 18,
            padding: "14px 16px",
          }}
        >
          <CheckCircle size={18} color="#4ade80" />
          <span style={{ color: "#ffffff", fontWeight: 650, fontSize: 14, lineHeight: 1.35 }}>
            Uspešno si prijavljen.
            <span style={{ display: "block", fontWeight: 450, color: "#e2e8f0", fontSize: 13, marginTop: 2 }}>
              Dobitnike javljamo putem emaila.
            </span>
          </span>
        </div>
      </div>
    );
  }

  if (step === "phone") {
    return (
      <div>
        <style>{`
          @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
          .gf-row{display:flex;align-items:stretch;border-radius:50px;overflow:hidden}
          .gf-btn{padding:16px 22px;background:linear-gradient(135deg,#00d4ff 0%,#00b0e0 100%);border:none;cursor:pointer;color:#050508;font-weight:750;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;font-family:inherit;transition:all 0.3s ease;flex-shrink:0}
          .gf-btn--gold{padding:16px 22px;background:linear-gradient(135deg,#00e0ff 0%,#662d91 55%,#7c3aed 100%);color:#fff;border:1px solid rgba(255,255,255,0.28);text-shadow:0 1px 12px rgba(0,0,0,0.38);font-weight:700;font-size:15px;letter-spacing:0.06em}
          @media(max-width:640px){.gf-row{flex-direction:column;border-radius:16px;gap:10px;overflow:visible}.gf-btn,.gf-btn--gold{border-radius:12px !important;width:100%;min-height:48px;padding:14px 20px}}
          .gf-btn:disabled,.gf-btn--gold:disabled{cursor:not-allowed;opacity:0.65}
          .phone-wrap .PhoneInput{display:flex;align-items:center;padding:0 4px 0 16px;gap:6px}
          .phone-wrap .PhoneInputCountry{display:flex;align-items:center;gap:4px}
          .phone-wrap .PhoneInputCountryIcon{width:22px;height:16px;border-radius:2px;overflow:hidden;box-shadow:0 0 2px rgba(0,0,0,0.3)}
          .phone-wrap .PhoneInputCountryIcon--border{background:none;box-shadow:none}
          .phone-wrap .PhoneInputCountrySelectArrow{color:#555;margin-left:2px;border-color:#555;opacity:0.6;width:6px;height:6px}
          .phone-wrap .PhoneInputCountrySelect{position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer}
          .phone-wrap .PhoneInputInput{flex:1;padding:16px 8px;background:transparent;border:none;outline:none;color:#fff;font-size:15px;font-family:inherit}
          .phone-wrap .PhoneInputInput::placeholder{color:#555}
          @media(max-width:640px){.phone-wrap .PhoneInputInput{padding:14px 8px;min-height:48px;font-size:16px}}
        `}</style>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              border: gold ? "1px solid rgba(251,191,36,0.2)" : "1px solid rgba(0,212,255,0.20)",
              background: gold ? "rgba(251,191,36,0.08)" : "rgba(0,212,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Gift size={18} color={gold ? "#fbbf24" : "#00d4ff"} />
          </div>
          <div style={{ color: "rgba(226,232,240,0.85)", fontSize: 13, lineHeight: 1.35 }}>
            Opciono: ostavi telefon za SMS obaveštenje.
          </div>
        </div>

        <form onSubmit={submit} style={{ maxWidth: 520, margin: "0 auto" }}>
          <div
            className="gf-row"
            style={{
              border: `1px solid ${focused ? borderFocus : borderDefault}`,
              background: "rgba(255,255,255,0.03)",
              boxShadow: focused ? shadowFocus : "none",
              transition: "border-color 0.3s ease, box-shadow 0.3s ease",
            }}
          >
            <div className="phone-wrap" style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <PhoneInput
                international
                defaultCountry="RS"
                value={phone}
                onChange={setPhone}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Broj telefona (opciono)"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={gold ? "gf-btn gf-btn--gold" : "gf-btn"}
            >
              {loading ? (
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite", willChange: "transform" }} />
              ) : (
                <>
                  Prijavi se <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <p style={{ textAlign: "center", fontSize: 13, color: "#ef4444", marginTop: 12 }}>
            {error}
          </p>
        )}
        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: error ? 8 : 12 }}>
          <button
            onClick={(e) => submit(e as unknown as React.FormEvent, true)}
            disabled={loading}
            style={{
              background: "none",
              border: "none",
              color: gold ? "#fbbf24" : "#00d4ff",
              cursor: "pointer",
              fontSize: 12,
              padding: 0,
              textDecoration: "underline",
            }}
          >
            Preskoči telefon
          </button>
        </p>
      </div>
    );
  }

  const canSubmit = verifyState === "valid";

  return (
    <div>
      <style>{`
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes gfArrowRun{0%{transform:translateX(0)}50%{transform:translateX(8px)}100%{transform:translateX(0)}}
        .gf-email-shell{position:relative;overflow:hidden;border-radius:50px}
        .gf-email-row{position:relative;display:flex;align-items:stretch;border-radius:50px;overflow:hidden;z-index:1}
        .gf-email-row::before,.gf-email-row::after{
          content:"";position:absolute;top:50%;transform:translateY(-50%);width:108px;height:46px;pointer-events:none;filter:blur(16px);
          opacity:.38;transition:opacity .25s ease;z-index:2;
        }
        .gf-email-row::before{left:8px;background:linear-gradient(90deg, rgba(0,212,255,0.64), rgba(102,45,145,0.14), rgba(0,0,0,0))}
        .gf-email-row::after{right:8px;background:linear-gradient(270deg, rgba(124,58,237,0.62), rgba(102,45,145,0.14), rgba(0,0,0,0))}
        .gf-email-shell:focus-within .gf-email-row::before,.gf-email-shell:focus-within .gf-email-row::after{opacity:.8}
        .gf-email-btn{padding:16px 22px;border:none;cursor:pointer;font-weight:900;font-size:13px;letter-spacing:0.10em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;font-family:inherit;transition:all 0.3s ease;flex-shrink:0}
        .gf-email-btn--brand{opacity:1;background:linear-gradient(135deg,#00e0ff 0%,#662d91 55%,#7c3aed 100%);color:#fff;border:1px solid rgba(255,255,255,0.28);text-shadow:0 1px 12px rgba(0,0,0,0.38);box-shadow:0 0 30px rgba(0,212,255,0.62),0 0 64px rgba(102,45,145,0.42),0 0 86px rgba(124,58,237,0.34),0 6px 22px rgba(0,0,0,0.5)}
        .gf-email-btn--brand:not(:disabled):hover{opacity:1;background:linear-gradient(135deg,#00f0ff 0%,#7c3aed 100%);box-shadow:0 0 40px rgba(0,212,255,0.78),0 0 86px rgba(102,45,145,0.5),0 0 110px rgba(124,58,237,0.38),0 8px 26px rgba(0,0,0,0.55);transform:translate3d(0,-1px,0)}
        .gf-email-btn--gold{background:linear-gradient(135deg,#00e0ff 0%,#662d91 55%,#7c3aed 100%);color:#fff;border:1px solid rgba(255,255,255,0.28);text-shadow:0 1px 12px rgba(0,0,0,0.38);font-weight:700;font-size:15px;letter-spacing:0.06em}
        .gf-email-btn:disabled,.gf-email-btn--gold:disabled{opacity:1;cursor:not-allowed;filter:saturate(1.05) brightness(0.92)}
        .gf-arrow-run{display:inline-grid;animation:gfArrowRun .8s ease-in-out infinite}
        @media(max-width:640px){.gf-email-row::before,.gf-email-row::after{display:none}.gf-email-row{flex-direction:column;border-radius:16px;gap:10px;overflow:visible}.gf-email-btn,.gf-email-btn--gold{border-radius:12px !important;width:100%;min-height:48px;padding:14px 20px;font-size:12px;letter-spacing:0.08em}}
        .gf-email-input{font-family:Montserrat, var(--font-inter), Inter, system-ui, -apple-system, sans-serif;font-weight:600}
        .gf-email-input::placeholder{color:rgba(255,255,255,0.88);font-weight:600}
        @media(max-width:640px){
          .gf-email-shell{border-radius:16px}
          .gf-email-input{font-size:16px!important;min-height:48px;padding:14px 40px 14px 16px!important}
        }
      `}</style>
      <form onSubmit={submitEmail} style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="gf-email-shell">
          <div
            className="gf-email-row"
            style={{
              border: `1px solid ${
                verifyState === "invalid"
                  ? "rgba(239,68,68,0.4)"
                  : focused
                    ? borderFocus
                    : borderDefault
              }`,
              background: "linear-gradient(120deg, rgba(8,14,28,0.92), rgba(12,16,32,0.9))",
              boxShadow: focused ? `${shadowFocus}, 0 0 26px rgba(102,45,145,0.22)` : "0 0 16px rgba(0,212,255,0.08)",
              transition: "border-color 0.3s ease, box-shadow 0.3s ease",
            }}
          >
            <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", position: "relative" }}>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                  setIsTyping(true);
                  if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
                  typingTimerRef.current = window.setTimeout(() => setIsTyping(false), 700);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Unesi svoj email"
                autoComplete="email"
                inputMode="email"
                required
                className="gf-email-input"
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: "16px 44px 16px 20px",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: 15,
                  width: "100%",
                }}
              />
              {verifyState === "checking" && (
                <Loader2
                  size={18}
                  color={gold ? "#fbbf24" : "#00d4ff"}
                  style={{ position: "absolute", right: 16, animation: "spin 1s linear infinite", willChange: "transform" }}
                />
              )}
              {verifyState === "valid" && <CheckCircle size={18} color="#4ade80" style={{ position: "absolute", right: 16 }} />}
              {verifyState === "invalid" && <XCircle size={18} color="#ef4444" style={{ position: "absolute", right: 16 }} />}
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className={gold ? "gf-email-btn gf-email-btn--gold" : "gf-email-btn gf-email-btn--brand"}
            >
              OSIGURAJ MESTO{" "}
              <span className={isTyping ? "gf-arrow-run" : ""}>
                <ArrowRight size={15} />
              </span>
            </button>
          </div>
        </div>
      </form>

      {(error || verifyError) && (
        <p style={{ textAlign: "center", fontSize: 13, color: "#ef4444", marginTop: 12 }}>
          {error || verifyError}
        </p>
      )}
    </div>
  );
}

