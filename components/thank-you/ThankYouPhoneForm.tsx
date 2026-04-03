"use client";

import { useState } from "react";
import { Montserrat } from "next/font/google";
import PhoneInput, { isValidPhoneNumber, type Country, getCountries } from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";
import "react-phone-number-input/style.css";
import { Loader2, MessageSquare, Send } from "lucide-react";
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

const ALL_COUNTRY_CODES = getCountries();

function stepBadge(n: number) {
  return (
    <div
      className="ty-forum-step grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[13px] font-bold leading-none md:h-10 md:w-10 md:text-sm"
      style={{
        background: "rgba(139,92,246,0.14)",
        border: "1px solid rgba(139,92,246,0.28)",
        color: "#c4b5fd",
      }}
      aria-hidden
    >
      {n}
    </div>
  );
}

export default function ThankYouPhoneForm({
  email,
  defaultCountryCode,
  isLocalDesignPreview = false,
}: {
  email: string;
  defaultCountryCode: string;
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
  const [phoneFocused, setPhoneFocused] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocalDesignPreview) return;

    const fn = firstName.trim();
    const ln = lastName.trim();
    if (fn.length < 2 || ln.length < 2) {
      setError("Unesi ime i prezime.");
      return;
    }
    if (
      !aiExperience ||
      !THANK_YOU_AI_EXPERIENCE_OPTIONS.includes(aiExperience as (typeof THANK_YOU_AI_EXPERIENCE_OPTIONS)[number])
    ) {
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
      <div
        className="w-full rounded-[18px] border px-4 py-5 text-center sm:px-5 sm:py-6 md:rounded-[20px] md:px-6"
        style={{
          background: "rgba(255,255,255,0.02)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <p className={`text-[13px] leading-relaxed sm:text-[14px] ${montserratFields.className}`} style={{ color: "rgba(255,255,255,0.5)" }}>
          U redu — možeš i kasnije odgovoriti na SMS ako pošaljemo.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div
        className="w-full rounded-[18px] border px-4 py-5 text-center sm:px-5 sm:py-6 md:rounded-[20px] md:px-6"
        style={{
          background: "rgba(125,211,252,0.06)",
          borderColor: "rgba(125,211,252,0.22)",
        }}
      >
        <p className={`text-[15px] font-semibold leading-snug sm:text-[16px] ${montserratFields.className}`} style={{ color: "#7dd3fc" }}>
          Hvala! Tvoj odgovor je sačuvan — javićemo ti se po SMS-u kad bude važno.
        </p>
      </div>
    );
  }

  const borderInvalid = Boolean(error);
  const phoneWrapBorder = borderInvalid
    ? "rgba(239,68,68,0.45)"
    : phoneFocused
      ? "rgba(0,212,255,0.45)"
      : "rgba(255,255,255,0.1)";

  const inputCls = `${montserratFields.className} w-full rounded-[12px] border px-3.5 py-3 text-[clamp(14px,3.8vw,15px)] text-white outline-none transition-[border-color,box-shadow] placeholder:text-white/35 sm:rounded-[14px] sm:px-4 sm:py-3.5 md:text-[15px]`;
  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
  };

  const labelCls = `block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50 sm:text-[12px] ${montserratFields.className}`;

  return (
    <div className="ty-mini-forum mx-auto w-full max-w-full">
      <style>{`
        @keyframes ty-spin{to{transform:rotate(360deg)}}
        .ty-pi-wrap .PhoneInput{display:flex;align-items:center;padding:0 10px 0 12px;gap:8px;width:100%;min-height:52px}
        @media (min-width:640px){.ty-pi-wrap .PhoneInput{min-height:56px;padding:0 12px 0 14px}}
        .ty-pi-wrap .PhoneInputCountry{display:flex;align-items:center;gap:6px;flex-shrink:0}
        .ty-pi-wrap .PhoneInputCountryIcon{width:22px;height:16px;border-radius:2px;overflow:hidden}
        .ty-pi-wrap .PhoneInputCountrySelectArrow{color:rgba(255,255,255,0.55);margin-left:2px;opacity:0.85;width:6px;height:6px}
        .ty-pi-wrap .PhoneInputCountrySelect{
          max-width:min(200px,46vw);
          max-height:min(50vh,260px);
          overflow-y:auto;
          background:#0b0f1a;
          color:#fff;
          border:1px solid rgba(0,212,255,0.28);
          border-radius:10px;
          padding:6px 8px;
          font-size:13px;
        }
        .ty-pi-wrap .PhoneInputInput{
          flex:1;min-width:0;padding:14px 8px 14px 4px;background:transparent;border:none;outline:none;
          color:#fff;font-size:16px;font-weight:400
        }
        @media (min-width:640px){.ty-pi-wrap .PhoneInputInput{padding:16px 10px 16px 6px}}
        .ty-pi-wrap .PhoneInputInput::placeholder{color:rgba(255,255,255,0.75);opacity:1;font-weight:400}
        @media (max-width:639px){.ty-pi-wrap .PhoneInputCountrySelect{max-width:100%}}
      `}</style>

      <div
        className="w-full rounded-[18px] border px-3.5 py-4 sm:rounded-[20px] sm:px-5 sm:py-5 md:px-6 md:py-6"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
          borderColor: borderInvalid ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.08)",
          boxShadow: borderInvalid ? "none" : "0 0 0 1px rgba(125,211,252,0.06) inset",
        }}
      >
        <div className="mb-4 flex items-start gap-3 border-b border-white/[0.06] pb-4 sm:mb-5 sm:gap-4 sm:pb-5">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl sm:h-12 sm:w-12"
            style={{
              background: "rgba(0,212,255,0.1)",
              border: "1px solid rgba(0,212,255,0.22)",
              color: "#7dd3fc",
            }}
          >
            <MessageSquare className="h-5 w-5 sm:h-[22px] sm:w-[22px]" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className={`text-[clamp(15px,4vw,18px)] font-extrabold leading-tight text-white ${montserratFields.className}`}>
              Brzi upitnik
            </p>
            <p className={`mt-1 text-[clamp(12px,3.2vw,14px)] leading-relaxed text-white/60 ${montserratFields.className}`}>
              Tri kratka koraka — uključujući broj za SMS obaveštenje.
            </p>
            {isLocalDesignPreview ? (
              <p className={`mt-2 text-[11px] leading-relaxed text-amber-200/90 sm:text-[12px] ${montserratFields.className}`}>
                Localhost: prikaz dizajna; slanje radi samo sa pravim leadom sa početne.
              </p>
            ) : null}
          </div>
        </div>

        <form onSubmit={submit} className="flex w-full flex-col gap-4 sm:gap-5">
          <div className="flex gap-3 sm:gap-4">
            {stepBadge(1)}
            <div className="min-w-0 flex-1 space-y-2">
              <span className={labelCls}>Lični podaci</span>
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
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4">
            {stepBadge(2)}
            <div className="min-w-0 flex-1 space-y-2">
              <label htmlFor="ty-ai-level" className={labelCls}>
                Upoznatost sa AI tehnologijom
              </label>
              <select
                id="ty-ai-level"
                value={aiExperience}
                onChange={(e) => {
                  setAiExperience(e.target.value);
                  setError(null);
                }}
                className={`${montserratFields.className} w-full cursor-pointer appearance-none rounded-[12px] border px-3.5 py-3 text-[clamp(13px,3.6vw,15px)] leading-snug text-white outline-none sm:rounded-[14px] sm:px-4 sm:py-3.5`}
                style={{
                  ...inputStyle,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%237dd3fc' d='M1.4 0 6 4.6 10.6 0 12 1.4l-6 6-6-6z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 14px center",
                  paddingRight: 40,
                }}
              >
                <option value="" disabled className="bg-[#0b0f1a] text-white/45">
                  Izaberi opciju…
                </option>
                {THANK_YOU_AI_EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#0b0f1a] text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4">
            {stepBadge(3)}
            <div className="min-w-0 flex-1 space-y-2">
              <label htmlFor="ty-phone-input" className={labelCls}>
                Broj telefona (SMS)
              </label>
              <div
                className="overflow-hidden rounded-[12px] sm:rounded-[14px]"
                style={{
                  border: `1px solid ${phoneWrapBorder}`,
                  background: "rgba(255,255,255,0.03)",
                  boxShadow: phoneFocused && !borderInvalid ? "0 0 24px rgba(0,212,255,0.08)" : "none",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <div className="ty-pi-wrap min-w-0">
                  <PhoneInput
                    id="ty-phone-input"
                    international
                    defaultCountry={toCountry(defaultCountryCode)}
                    countries={ALL_COUNTRY_CODES}
                    labels={en}
                    value={phone}
                    onChange={(v) => {
                      setPhone(v);
                      setError(null);
                    }}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                    placeholder="Broj telefona"
                    numberInputProps={{
                      className: montserratPhoneInput.className,
                      autoComplete: "tel",
                      inputMode: "tel",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <p className={`text-center text-[12px] text-red-400 sm:text-[13px] ${montserratFields.className}`} role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className={`flex w-full items-center justify-center gap-2 rounded-[14px] border px-4 py-3.5 text-[clamp(14px,3.8vw,16px)] font-bold transition-[transform,box-shadow,opacity] active:scale-[0.99] sm:py-4 ${montserratFields.className}`}
            style={{
              background: "linear-gradient(135deg,#00d4ff 0%,#00b0e0 100%)",
              borderColor: "rgba(0,140,180,0.35)",
              color: "#050508",
              boxShadow: "0 4px 22px rgba(0,212,255,0.45), 0 0 0 1px rgba(0,0,0,0.06) inset",
              opacity: loading ? 0.65 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <Loader2 className="h-[18px] w-[18px] shrink-0" style={{ animation: "ty-spin 1s linear infinite" }} aria-hidden />
            ) : (
              <Send className="h-[18px] w-[18px] shrink-0" aria-hidden />
            )}
            Pošalji odgovor
          </button>
        </form>

        <button
          type="button"
          onClick={() => setSkipped(true)}
          className={`mt-3 w-full text-center text-[11px] underline-offset-2 sm:mt-4 sm:text-[12px] ${montserratFields.className}`}
          style={{ color: "rgba(255,255,255,0.38)", background: "none", border: "none", cursor: "pointer" }}
        >
          Preskoči za sada
        </button>
      </div>
    </div>
  );
}
