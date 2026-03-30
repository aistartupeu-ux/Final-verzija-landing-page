"use client";

import { useState } from "react";
import { Montserrat } from "next/font/google";
import PhoneInput, { isValidPhoneNumber, type Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { ArrowLeft, Loader2 } from "lucide-react";
import { clearStoredLeadConfirm, ttqEnhanceWithPhone } from "@/lib/tiktok-datalayer";

const montserratPhoneInput = Montserrat({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

function toCountry(code: string): Country {
  const c = (code || "RS").toUpperCase();
  if (c.length !== 2) return "RS";
  return c as Country;
}

export default function ThankYouPhoneForm({
  email,
  defaultCountryCode,
  isLocalDesignPreview = false,
}: {
  email: string;
  defaultCountryCode: string;
  /** true = localhost layout pregled; ne šalje PATCH, ne čisti storage */
  isLocalDesignPreview?: boolean;
}) {
  const [phone, setPhone] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [focused, setFocused] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocalDesignPreview) {
      return;
    }
    if (!phone || !isValidPhoneNumber(phone)) {
      setError("Unesi ispravan broj telefona.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/phone", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(typeof j.error === "string" ? j.error : "Greška. Pokušaj ponovo.");
        setLoading(false);
        return;
      }
      void ttqEnhanceWithPhone(email, phone);
      clearStoredLeadConfirm();
      setDone(true);
    } catch {
      setError("Greška u konekciji.");
    } finally {
      setLoading(false);
    }
  };

  if (skipped) {
    return (
      <p className="text-center text-[13px]" style={{ color: "rgba(255,255,255,0.45)" }}>
        U redu — možeš i kasnije odgovoriti na SMS ako pošaljemo.
      </p>
    );
  }

  if (done) {
    return (
      <p className="text-center text-[15px] font-medium" style={{ color: "#7dd3fc" }}>
        Hvala! Broj je sačuvan — javićemo ti se po SMS-u kad bude važno.
      </p>
    );
  }

  const borderInvalid = Boolean(error);
  const rowBorder = borderInvalid
    ? "rgba(239,68,68,0.4)"
    : focused
      ? "rgba(0,212,255,0.4)"
      : "rgba(0,212,255,0.15)";

  return (
    <div className="mx-auto flex w-full max-w-[min(480px,100%)] flex-col gap-3 md:max-lg:max-w-[500px] md:max-lg:gap-4 lg:max-w-[520px] lg:gap-5">
      <style>{`
        @keyframes ty-spin{to{transform:rotate(360deg)}}
        .ty-ef-row{display:flex;align-items:stretch;border-radius:50px;overflow:hidden}
        .ty-ef-btn{padding:16px 28px;background:linear-gradient(135deg,#00d4ff 0%,#00b0e0 100%);border:none;cursor:pointer;color:#050508;font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;font-family:inherit;transition:all 0.3s ease;flex-shrink:0}
        .ty-ef-btn--hero{text-transform:none;letter-spacing:0.02em;font-size:15px;font-weight:700;color:#050508;box-shadow:0 4px 22px rgba(0,212,255,0.5),0 0 0 1px rgba(0,0,0,0.08) inset;border:1px solid rgba(0,140,180,0.35)}
        .ty-ef-btn--hero:not(:disabled):hover{box-shadow:0 6px 28px rgba(0,212,255,0.6),0 0 0 1px rgba(0,0,0,0.1) inset}
        .ty-ef-btn:disabled{cursor:not-allowed;opacity:0.6}
        .ty-pi-wrap .PhoneInput{display:flex;align-items:center;padding:0 8px 0 16px;gap:6px;width:100%;min-height:56px}
        .ty-pi-wrap .PhoneInputCountry{display:flex;align-items:center;gap:4px}
        .ty-pi-wrap .PhoneInputCountryIcon{width:22px;height:16px;border-radius:2px;overflow:hidden}
        .ty-pi-wrap .PhoneInputCountrySelectArrow{color:rgba(255,255,255,0.55);margin-left:2px;opacity:0.85;width:6px;height:6px}
        .ty-pi-wrap .PhoneInputInput{flex:1;min-width:0;padding:16px 12px 16px 4px;background:transparent;border:none;outline:none;color:#fff;font-size:15px;font-weight:400}
        .ty-pi-wrap .PhoneInputInput::placeholder{color:rgba(255,255,255,0.88);opacity:1;font-weight:400}
        @media (max-width: 767px){
          .ty-ef-row{flex-direction:column;border-radius:16px;gap:8px;overflow:visible}
          .ty-ef-btn{border-radius:12px !important;width:100%;padding:14px 20px}
        }
      `}</style>
      <div className="space-y-1.5 text-center md:max-lg:space-y-2 lg:space-y-3">
        <p className="text-[18px] font-extrabold leading-tight tracking-tight text-white md:max-lg:text-[22px] lg:text-[24px]">
          Krećemo 15. aprila <span aria-hidden>👇</span>
        </p>
        <p className="text-[14px] leading-relaxed md:max-lg:text-[16px] lg:text-[17px]" style={{ color: "rgba(255,255,255,0.78)" }}>
          Ako nećeš da propustiš, ostavi broj
        </p>
        {isLocalDesignPreview ? (
          <p className="mx-auto max-w-[42ch] text-[12px] leading-relaxed" style={{ color: "rgba(251,191,36,0.9)" }}>
            Localhost: forma je uvek vidljiva radi dizajna; dugme ne šalje zahtev dok nemaš pravi lead iz
            prijave.
          </p>
        ) : null}
      </div>
      <div className="flex w-full flex-col gap-2 md:max-lg:gap-2.5 lg:gap-3">
        <form onSubmit={submit} style={{ width: "100%" }}>
          <div
            className="ty-ef-row"
            style={{
              border: `1px solid ${rowBorder}`,
              background: "rgba(255,255,255,0.03)",
              boxShadow: focused && !borderInvalid ? "0 0 30px rgba(0,212,255,0.08)" : "none",
              transition: "border-color 0.3s ease, box-shadow 0.3s ease",
            }}
          >
            <div className="ty-pi-wrap min-w-0 flex-1">
              <PhoneInput
                international
                defaultCountry={toCountry(defaultCountryCode)}
                value={phone}
                onChange={(v) => {
                  setPhone(v);
                  setError(null);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Broj telefona"
                numberInputProps={{
                  className: montserratPhoneInput.className,
                  autoComplete: "tel",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="ty-ef-btn ty-ef-btn--hero"
            >
              {loading ? (
                <Loader2 size={18} style={{ animation: "ty-spin 1s linear infinite" }} />
              ) : (
                <>
                  <ArrowLeft size={15} aria-hidden />
                  Sačuvaj broj
                </>
              )}
            </button>
          </div>
        </form>
        {error ? <p className="text-center text-[13px] text-red-400">{error}</p> : null}
        <button
          type="button"
          onClick={() => setSkipped(true)}
          className="w-full text-center text-[12px] underline-offset-2"
          style={{ color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer" }}
        >
          Preskoči za sada
        </button>
      </div>
    </div>
  );
}
