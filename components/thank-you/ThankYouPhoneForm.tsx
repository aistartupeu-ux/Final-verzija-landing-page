"use client";

import { useState } from "react";
import { Montserrat } from "next/font/google";
import PhoneInput, { isValidPhoneNumber, type Country, getCountries } from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";
import "react-phone-number-input/style.css";
import { ArrowLeft, Loader2 } from "lucide-react";
import { clearStoredLeadConfirm, ttqEnhanceWithPhone } from "@/lib/tiktok-datalayer";
import { THANK_YOU_AI_EXPERIENCE_OPTIONS } from "@/lib/thank-you-ai-experience";

const montserratPhoneInput = Montserrat({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const montserratFields = Montserrat({
  weight: ["400", "600"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

function toCountry(code: string): Country {
  const c = (code || "RS").toUpperCase();
  if (c.length !== 2) return "RS";
  return c as Country;
}

/** Sve zemlje koje podržava biblioteka — za što duži padajući izbor. */
const ALL_COUNTRY_CODES = getCountries();

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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [aiExperience, setAiExperience] = useState<string>("");
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

    const fn = firstName.trim();
    const ln = lastName.trim();
    if (fn.length < 2 || ln.length < 2) {
      setError("Unesi ime i prezime.");
      return;
    }
    if (!aiExperience || !THANK_YOU_AI_EXPERIENCE_OPTIONS.includes(aiExperience as (typeof THANK_YOU_AI_EXPERIENCE_OPTIONS)[number])) {
      setError("Izaberi nivo upoznatosti sa AI tehnologijom.");
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
        body: JSON.stringify({
          email,
          phone,
          first_name: fn,
          last_name: ln,
          ai_experience: aiExperience,
        }),
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

  const inputCls = `${montserratFields.className} w-full rounded-[14px] border px-4 py-3.5 text-[15px] text-white outline-none transition-[border-color,box-shadow] placeholder:text-white/35 md:max-lg:py-4 lg:text-[15px]`;
  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.08)",
  };

  return (
    <div className="mx-auto flex w-full max-w-[min(480px,100%)] flex-col gap-3 md:max-lg:max-w-[500px] md:max-lg:gap-4 lg:max-w-[520px] lg:gap-5">
      <style>{`
        @keyframes ty-spin{to{transform:rotate(360deg)}}
        .ty-ef-row{display:flex;align-items:stretch;border-radius:50px;overflow:hidden}
        .ty-ef-btn{padding:16px 28px;background:linear-gradient(135deg,#00d4ff 0%,#00b0e0 100%);border:none;cursor:pointer;color:#050508;font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;font-family:inherit;transition:all 0.3s ease;flex-shrink:0}
        .ty-ef-btn--hero{text-transform:none;letter-spacing:0.02em;font-size:15px;font-weight:700;color:#050508;box-shadow:0 4px 22px rgba(0,212,255,0.5),0 0 0 1px rgba(0,0,0,0.08) inset;border:1px solid rgba(0,140,180,0.35)}
        .ty-ef-btn--hero:not(:disabled):hover{box-shadow:0 6px 28px rgba(0,212,255,0.6),0 0 0 1px rgba(0,0,0,0.1) inset}
        .ty-ef-btn:disabled{cursor:not-allowed;opacity:0.6}
 .ty-pi-wrap .PhoneInput{display:flex;align-items:center;padding:0 8px 0 14px;gap:8px;width:100%;min-height:56px}
        .ty-pi-wrap .PhoneInputCountry{display:flex;align-items:center;gap:6px;flex-shrink:0}
        .ty-pi-wrap .PhoneInputCountryIcon{width:22px;height:16px;border-radius:2px;overflow:hidden}
        .ty-pi-wrap .PhoneInputCountrySelectArrow{color:rgba(255,255,255,0.55);margin-left:2px;opacity:0.85;width:6px;height:6px}
 .ty-pi-wrap .PhoneInputCountrySelect{
   max-width:min(200px,42vw);
   max-height:min(50vh,260px);
   overflow-y:auto;
   background:#0b0f1a;
   color:#fff;
   border:1px solid rgba(0,212,255,0.28);
   border-radius:10px;
   padding:6px 8px;
   font-size:13px;
   margin-right:2px;
 }
        .ty-pi-wrap .PhoneInputInput{flex:1;min-width:0;padding:16px 10px 16px 6px;background:transparent;border:none;outline:none;color:#fff;font-size:16px;font-weight:400}
        .ty-pi-wrap .PhoneInputInput::placeholder{color:rgba(255,255,255,0.88);opacity:1;font-weight:400}
        @media (max-width: 767px){
          .ty-ef-row{flex-direction:column;border-radius:16px;gap:8px;overflow:visible}
          .ty-ef-btn{border-radius:12px !important;width:100%;padding:14px 20px}
          .ty-pi-wrap .PhoneInputCountrySelect{max-width:100%;margin-right:0}
        }
      `}</style>
      <div className="space-y-1.5 text-center md:max-lg:space-y-2 lg:space-y-3">
        <p className="text-[18px] font-extrabold leading-tight tracking-tight text-white md:max-lg:text-[22px] lg:text-[24px]">
          Krećemo 15. aprila <span aria-hidden>👇</span>
        </p>
        <p className="text-[14px] leading-relaxed md:max-lg:text-[16px] lg:text-[17px]" style={{ color: "rgba(255,255,255,0.78)" }}>
          Popuni kratak upitnik — ostavi broj da ne propustiš obaveštenje
        </p>
        {isLocalDesignPreview ? (
          <p className="mx-auto max-w-[42ch] text-[12px] leading-relaxed" style={{ color: "rgba(251,191,36,0.9)" }}>
            Localhost: forma je uvek vidljiva radi dizajna; dugme ne šalje zahtev dok nemaš pravi lead iz
            prijave.
          </p>
        ) : null}
      </div>

      <form onSubmit={submit} className="flex w-full flex-col gap-2.5 md:max-lg:gap-3 lg:gap-3.5" style={{ width: "100%" }}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
          <input
            type="text"
            name="first_name"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setError(null);
            }}
            placeholder="Ime"
            className={inputCls}
            style={inputStyle}
          />
          <input
            type="text"
            name="last_name"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              setError(null);
            }}
            placeholder="Prezime"
            className={inputCls}
            style={inputStyle}
          />
        </div>

        <div className="flex flex-col gap-1 text-left">
          <label className={`text-[12px] font-semibold uppercase tracking-wider text-white/55 ${montserratFields.className}`}>
            Koliko si upoznat/na sa AI tehnologijom?
          </label>
          <select
            value={aiExperience}
            onChange={(e) => {
              setAiExperience(e.target.value);
              setError(null);
            }}
            className={`${montserratFields.className} w-full cursor-pointer appearance-none rounded-[14px] border px-4 py-3.5 text-[14px] leading-snug text-white outline-none md:max-lg:py-4 lg:text-[15px]`}
            style={{
              ...inputStyle,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%237dd3fc' d='M1.4 0 6 4.6 10.6 0 12 1.4l-6 6-6-6z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
              paddingRight: 40,
            }}
          >
            <option value="" disabled className="bg-[#0b0f1a] text-white/50">
              Izaberi opciju…
            </option>
            {THANK_YOU_AI_EXPERIENCE_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="bg-[#0b0f1a] text-white">
                {opt}
              </option>
            ))}
          </select>
        </div>

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
              countries={ALL_COUNTRY_CODES}
              labels={en}
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
                inputMode: "tel",
              }}
            />
          </div>
          <button type="submit" disabled={loading} className="ty-ef-btn ty-ef-btn--hero">
            {loading ? (
              <Loader2 size={18} style={{ animation: "ty-spin 1s linear infinite" }} />
            ) : (
              <>
                <ArrowLeft size={15} aria-hidden />
                Sačuvaj
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
  );
}
