"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { trackAffiliateLeadOnSubmit, getLeadSourceData } from "@/lib/affiliate-tracking";
import PhoneInput, { type Value } from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function EmailForm({ microcopy }: { microcopy?: string; className?: string }) {
  const [step, setStep] = useState<"email" | "phone" | "done">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<Value | undefined>();
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setError(null);
    setStep("phone");
  };

  const submitPhone = async (e: React.FormEvent, skipPhone = false) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const sourceData = getLeadSourceData();
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone: (skipPhone || !phone) ? null : phone,
          utm_source: sourceData.utm_source,
          utm_medium: sourceData.utm_medium,
          utm_campaign: sourceData.utm_campaign,
          affiliate_code: sourceData.affiliate_code,
          source_tag: sourceData.source_tag,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Leads API error:", err);
        setError("Došlo je do greške. Pokušajte ponovo ili nas kontaktirajte.");
        setLoading(false);
        return;
      }
      if (typeof window !== "undefined" && (window as unknown as { fbq?: (a: string, b: string) => void }).fbq) {
        (window as unknown as { fbq: (a: string, b: string) => void }).fbq("track", "Lead");
      }
      trackAffiliateLeadOnSubmit({ email, phone: (skipPhone || !phone) ? null : phone });
      setLoading(false);
      setStep("done");
      setTimeout(() => { window.location.href = "/special/offer"; }, 2000);
    } catch {
      setError("Greška u konekciji. Proverite internet i pokušajte ponovo.");
      setLoading(false);
      return;
    }
  };

  if (step === "done") {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: 50, padding: "14px 28px",
          animation: "fadeInUp 0.4s ease forwards",
        }}>
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

  if (step === "phone") {
    return (
      <div>
        <style>{`
          .ef-row{display:flex;align-items:stretch;border-radius:50px;overflow:hidden}
          .ef-btn{padding:16px 28px;background:linear-gradient(135deg,#00d4ff 0%,#00b0e0 100%);border:none;cursor:pointer;color:#050508;font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;font-family:inherit;transition:all 0.3s ease;flex-shrink:0}
          @media(max-width:480px){.ef-row{flex-direction:column;border-radius:16px;gap:8px;overflow:visible}.ef-btn{border-radius:12px !important;width:100%;padding:14px 20px}}
          .phone-wrap .PhoneInput{display:flex;align-items:center;padding:0 4px 0 16px;gap:6px}
          .phone-wrap .PhoneInputCountry{display:flex;align-items:center;gap:4px}
          .phone-wrap .PhoneInputCountryIcon{width:22px;height:16px;border-radius:2px;overflow:hidden;box-shadow:0 0 2px rgba(0,0,0,0.3)}
          .phone-wrap .PhoneInputCountryIcon--border{background:none;box-shadow:none}
          .phone-wrap .PhoneInputCountrySelectArrow{color:#555;margin-left:2px;border-color:#555;opacity:0.6;width:6px;height:6px}
          .phone-wrap .PhoneInputCountrySelect{position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer}
          .phone-wrap .PhoneInputInput{flex:1;padding:16px 8px;background:transparent;border:none;outline:none;color:#fff;font-size:15px;font-family:inherit}
          .phone-wrap .PhoneInputInput::placeholder{color:#555}
          @media(max-width:480px){.phone-wrap .PhoneInputInput{padding:14px 8px}}
        `}</style>
        <form onSubmit={submitPhone} style={{ maxWidth: 520, margin: "0 auto" }}>
          <div className="ef-row" style={{
            border: `1px solid ${focused ? "rgba(0,212,255,0.4)" : "rgba(0,212,255,0.15)"}`,
            background: "rgba(255,255,255,0.03)",
            boxShadow: focused ? "0 0 30px rgba(0,212,255,0.08)" : "none",
            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          }}>
            <div className="phone-wrap" style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <PhoneInput
                international
                defaultCountry="RS"
                value={phone}
                onChange={setPhone}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Broj telefona"
              />
            </div>
            <button type="submit" disabled={loading} className="ef-btn">
              {loading
                ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                : <>Završi <ArrowRight size={15} /></>
              }
            </button>
          </div>
        </form>
        {error && (
          <p style={{ textAlign: "center", fontSize: 13, color: "#ef4444", marginTop: 12 }}>
            {error}
          </p>
        )}
        <p style={{ textAlign: "center", fontSize: 12, color: "#555", marginTop: error ? 8 : 12 }}>
          Opciono: unesite broj za SMS obaveštenje.{" "}
          <button
            onClick={e => submitPhone(e as unknown as React.FormEvent, true)}
            disabled={loading}
            style={{ background: "none", border: "none", color: "#00d4ff", cursor: "pointer", fontSize: 12, padding: 0, textDecoration: "underline" }}
          >
            Preskoči
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .ef-email-row{display:flex;align-items:stretch;border-radius:50px;overflow:hidden}
        .ef-email-btn{padding:16px 28px;background:linear-gradient(135deg,#00d4ff 0%,#00b0e0 100%);border:none;cursor:pointer;color:#050508;font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;font-family:inherit;transition:all 0.3s ease;flex-shrink:0}
        @media(max-width:480px){.ef-email-row{flex-direction:column;border-radius:16px;gap:8px;overflow:visible}.ef-email-btn{border-radius:12px !important;width:100%;padding:14px 20px}}
      `}</style>
      <form onSubmit={submitEmail} style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="ef-email-row" style={{
          border: `1px solid ${focused ? "rgba(0,212,255,0.4)" : "rgba(0,212,255,0.15)"}`,
          background: "rgba(255,255,255,0.03)",
          boxShadow: focused ? "0 0 30px rgba(0,212,255,0.08)" : "none",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        }}>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            placeholder="Unesi svoj email" required
            style={{
              flex: 1, minWidth: 0, padding: "16px 20px", background: "transparent",
              border: "none", outline: "none", color: "#fff", fontSize: 15, fontFamily: "inherit",
              width: "100%",
            }}
          />
          <button type="submit" className="ef-email-btn">
            Join The Hype <ArrowRight size={15} />
          </button>
        </div>
      </form>
      {microcopy && (
        <p style={{ textAlign: "center", fontSize: 12, color: "#555", marginTop: 12, letterSpacing: "0.02em" }}>
          {microcopy}
        </p>
      )}
    </div>
  );
}
