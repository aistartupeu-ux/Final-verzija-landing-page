"use client";

import { useState } from "react";
import { Montserrat } from "next/font/google";
import PhoneInput, { isValidPhoneNumber, type Country, getCountries } from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";
import "react-phone-number-input/style.css";
import { Loader2, Send } from "lucide-react";
import { clearStoredLeadConfirm, ttqEnhanceWithPhone } from "@/lib/tiktok-datalayer";
import { THANK_YOU_AI_EXPERIENCE_OPTIONS } from "@/lib/thank-you-ai-experience";
import {
  THANK_YOU_SURVEY_LABELS,
  THANK_YOU_SURVEY_Q1_OPTIONS,
  THANK_YOU_SURVEY_Q2_MAX,
  THANK_YOU_SURVEY_Q2_MIN,
  THANK_YOU_SURVEY_Q3_OPTIONS,
  THANK_YOU_SURVEY_Q4_OPTIONS,
  THANK_YOU_SURVEY_Q5_OPTIONS,
} from "@/lib/thank-you-forum-survey";

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

function ForumSelectField({
  id,
  label,
  value,
  onChange,
  options,
  selectCls,
  selectStyle,
  labelCls,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  selectCls: string;
  selectStyle: React.CSSProperties;
  labelCls: string;
}) {
  return (
    <div className="space-y-2 min-w-0">
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <div className="min-w-0">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={selectCls}
          style={selectStyle}
        >
          <option value="" disabled className="bg-[#0b0f1a] text-white/45">
            Izaberi opciju…
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-[#0b0f1a] text-white">
              {opt}
            </option>
          ))}
        </select>
      </div>
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
  const [q1, setQ1] = useState("");
  const [q2Goal, setQ2Goal] = useState("");
  const [q3, setQ3] = useState("");
  const [q4, setQ4] = useState("");
  const [q5, setQ5] = useState("");
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
    if (!q1 || !THANK_YOU_SURVEY_Q1_OPTIONS.includes(q1 as (typeof THANK_YOU_SURVEY_Q1_OPTIONS)[number])) {
      setError("Izaberi odgovor na pitanje 1.");
      return;
    }
    const goalTrim = q2Goal.trim().replace(/\s+/g, " ");
    if (goalTrim.length < THANK_YOU_SURVEY_Q2_MIN || goalTrim.length > THANK_YOU_SURVEY_Q2_MAX) {
      setError(`Pitanje 2: napiši cilj (${THANK_YOU_SURVEY_Q2_MIN}–${THANK_YOU_SURVEY_Q2_MAX} karaktera).`);
      return;
    }
    if (!q3 || !THANK_YOU_SURVEY_Q3_OPTIONS.includes(q3 as (typeof THANK_YOU_SURVEY_Q3_OPTIONS)[number])) {
      setError("Izaberi odgovor na pitanje 3.");
      return;
    }
    if (!q4 || !THANK_YOU_SURVEY_Q4_OPTIONS.includes(q4 as (typeof THANK_YOU_SURVEY_Q4_OPTIONS)[number])) {
      setError("Izaberi odgovor na pitanje 4.");
      return;
    }
    if (!q5 || !THANK_YOU_SURVEY_Q5_OPTIONS.includes(q5 as (typeof THANK_YOU_SURVEY_Q5_OPTIONS)[number])) {
      setError("Izaberi odgovor na pitanje 5.");
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
          survey_q1_interest: q1,
          survey_q2_goal: goalTrim,
          survey_q3_blocker: q3,
          survey_q4_system_apply: q4,
          survey_q5_occupation: q5,
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
        className="w-full rounded-[18px] px-4 py-5 text-center sm:px-5 sm:py-6 md:rounded-[20px] md:px-6"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "none",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
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
        className="w-full rounded-[18px] px-4 py-5 text-center sm:px-5 sm:py-6 md:rounded-[20px] md:px-6"
        style={{
          background: "rgba(125,211,252,0.08)",
          border: "none",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35), 0 0 40px rgba(125,211,252,0.08)",
        }}
      >
        <p className={`text-[15px] font-semibold leading-snug sm:text-[16px] ${montserratFields.className}`} style={{ color: "#7dd3fc" }}>
          Hvala! Tvoj odgovor je sačuvan — javićemo ti se po SMS-u kad bude važno.
        </p>
      </div>
    );
  }

  const borderInvalid = Boolean(error);

  const nameInputCls = `${montserratFields.className} ty-name-input box-border min-h-[48px] w-full rounded-[12px] border-0 py-2.5 pl-4 pr-3.5 text-[clamp(14px,3.8vw,15px)] leading-normal text-white shadow-none outline-none transition-[background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/25 sm:min-h-[52px] sm:rounded-[14px] sm:py-3 sm:pl-6 sm:pr-4 md:text-[15px]`;
  const nameInputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.07)",
    border: "none",
    color: "#ffffff",
    caretColor: "#ffffff",
    boxShadow: "none",
  };

  const selectCls = `${montserratFields.className} ty-ai-select box-border min-h-[48px] w-full min-w-0 cursor-pointer appearance-none rounded-[12px] border-0 py-2.5 pl-4 pr-3.5 text-[clamp(14px,3.8vw,16px)] leading-normal text-white shadow-none outline-none transition-[background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/25 sm:min-h-[52px] sm:rounded-[14px] sm:py-3 sm:pl-6 sm:pr-4 md:text-[16px]`;
  const selectStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.07)",
    border: "none",
    color: "#ffffff",
    boxShadow: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%237dd3fc' d='M1.4 0 6 4.6 10.6 0 12 1.4l-6 6-6-6z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 20px center",
  };

  const aiQuestionLabelCls = `block text-left text-[clamp(13px,3.5vw,15px)] font-semibold leading-snug text-white sm:text-[15px] ${montserratFields.className}`;

  return (
    <div className="ty-mini-forum mx-auto w-full min-w-0 max-w-full">
      <style>{`
        @keyframes ty-spin{to{transform:rotate(360deg)}}
        .ty-pi-wrap .PhoneInput{border:none!important;box-shadow:none!important;background:transparent!important}
        input.ty-name-input{padding-left:1rem!important}
        textarea.ty-name-input{padding-left:1rem!important}
        @media (min-width:640px){
          input.ty-name-input,textarea.ty-name-input{padding-left:1.5rem!important}
        }
        .ty-name-input,textarea.ty-name-input{color:#fff!important;-webkit-text-fill-color:#fff}
        .ty-name-input::placeholder,textarea.ty-name-input::placeholder{color:rgba(255,255,255,0.95)!important;opacity:1;-webkit-text-fill-color:rgba(255,255,255,0.95)}
        textarea.ty-name-input{min-height:108px;resize:vertical;padding-top:14px;padding-bottom:14px;line-height:1.45}
        .ty-name-input:-webkit-autofill,.ty-name-input:-webkit-autofill:hover,.ty-name-input:-webkit-autofill:focus{
          -webkit-text-fill-color:#fff!important;
          caret-color:#fff;
          transition:background-color 9999s ease-out;
          box-shadow:0 0 0 1000px rgba(255,255,255,0.06) inset!important;
        }
        .ty-pi-wrap .PhoneInput{display:flex;align-items:center;padding:0 12px 0 12px;gap:8px;width:100%;min-height:52px}
        @media (min-width:640px){.ty-pi-wrap .PhoneInput{min-height:56px;padding:0 14px 0 14px;gap:8px}}
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
          flex:1;min-width:0;padding:14px 4px 14px 4px;background:transparent;border:none;outline:none;
          color:#fff;font-size:16px;font-weight:400
        }
        @media (min-width:640px){.ty-pi-wrap .PhoneInputInput{padding:16px 6px 16px 6px}}
        .ty-pi-wrap .PhoneInputInput::placeholder{color:#fff;opacity:0.92;font-weight:400}
        @media (max-width:639px){.ty-pi-wrap .PhoneInputCountrySelect{max-width:100%}}
        .ty-ai-select{color:#fff!important;-webkit-text-fill-color:#fff;padding-left:1rem!important;padding-right:2.35rem!important}
        @media (min-width:640px){
          .ty-ai-select{padding-left:1.5rem!important;padding-right:2.5rem!important}
        }
      `}</style>

      <div
        className="box-border flex w-full flex-col items-center rounded-[20px] border border-solid py-5 sm:rounded-[22px] sm:py-6 md:py-7"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
          borderColor: borderInvalid ? "rgba(239,68,68,0.45)" : "rgba(255,255,255,0.1)",
          boxShadow: borderInvalid
            ? "0 0 28px rgba(239,68,68,0.14)"
            : "0 24px 70px rgba(0,0,0,0.4)",
        }}
      >
        <div className="w-[min(100%,520px)] min-w-0 shrink-0 px-4 sm:px-5 md:px-6">
          <div className="mb-4 text-center sm:mb-5">
            <h3
              className={`text-[18px] font-semibold leading-tight text-white sm:text-[20px] ${montserratFields.className}`}
            >
              Brz korak pre nastavka
            </h3>
            <p
              className={`mt-1.5 text-[13px] leading-relaxed text-white sm:text-[14px] ${montserratFields.className}`}
            >
              Kratak upitnik koji nam pomaže da sadržaj{" "}
              <span className="font-semibold text-cyan-300">prilagodimo tebi.</span>
            </p>
          </div>

          {isLocalDesignPreview ? (
            <p
              className={`mb-3 text-left text-[11px] leading-relaxed text-amber-200/90 sm:mb-4 sm:text-[12px] ${montserratFields.className}`}
            >
              Localhost: prikaz dizajna; slanje radi samo sa pravim leadom sa početne.
            </p>
          ) : null}

          <form onSubmit={submit} className="flex w-full flex-col gap-4 sm:gap-5">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
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
              className={nameInputCls}
              style={nameInputStyle}
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
              className={nameInputCls}
              style={nameInputStyle}
            />
          </div>

          <div className="space-y-2 min-w-0">
            <label htmlFor="ty-ai-level" className={aiQuestionLabelCls}>
              Koliko si upoznat sa AI?
            </label>
            <div className="min-w-0">
              <select
                id="ty-ai-level"
                value={aiExperience}
                onChange={(e) => {
                  setAiExperience(e.target.value);
                  setError(null);
                }}
                className={selectCls}
                style={selectStyle}
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

          <ForumSelectField
            id="ty-survey-q1"
            label={THANK_YOU_SURVEY_LABELS.q1}
            value={q1}
            onChange={(v) => {
              setQ1(v);
              setError(null);
            }}
            options={THANK_YOU_SURVEY_Q1_OPTIONS}
            selectCls={selectCls}
            selectStyle={selectStyle}
            labelCls={aiQuestionLabelCls}
          />

          <div className="space-y-2 min-w-0">
            <label htmlFor="ty-survey-q2" className={aiQuestionLabelCls}>
              {THANK_YOU_SURVEY_LABELS.q2}
            </label>
            <textarea
              id="ty-survey-q2"
              name="survey_q2_goal"
              value={q2Goal}
              onChange={(e) => {
                setQ2Goal(e.target.value);
                setError(null);
              }}
              placeholder="Ovde slobodno napiši svoj cilj…"
              maxLength={THANK_YOU_SURVEY_Q2_MAX}
              rows={4}
              className={nameInputCls}
              style={nameInputStyle}
            />
          </div>

          <ForumSelectField
            id="ty-survey-q3"
            label={THANK_YOU_SURVEY_LABELS.q3}
            value={q3}
            onChange={(v) => {
              setQ3(v);
              setError(null);
            }}
            options={THANK_YOU_SURVEY_Q3_OPTIONS}
            selectCls={selectCls}
            selectStyle={selectStyle}
            labelCls={aiQuestionLabelCls}
          />

          <ForumSelectField
            id="ty-survey-q4"
            label={THANK_YOU_SURVEY_LABELS.q4}
            value={q4}
            onChange={(v) => {
              setQ4(v);
              setError(null);
            }}
            options={THANK_YOU_SURVEY_Q4_OPTIONS}
            selectCls={selectCls}
            selectStyle={selectStyle}
            labelCls={aiQuestionLabelCls}
          />

          <ForumSelectField
            id="ty-survey-q5"
            label={THANK_YOU_SURVEY_LABELS.q5}
            value={q5}
            onChange={(v) => {
              setQ5(v);
              setError(null);
            }}
            options={THANK_YOU_SURVEY_Q5_OPTIONS}
            selectCls={selectCls}
            selectStyle={selectStyle}
            labelCls={aiQuestionLabelCls}
          />

          <div
            className="overflow-hidden rounded-[12px] sm:rounded-[14px]"
            style={{
              border: "none",
              background: "rgba(255,255,255,0.07)",
              boxShadow: borderInvalid
                ? "0 0 24px rgba(239,68,68,0.22)"
                : phoneFocused
                  ? "0 0 28px rgba(0,212,255,0.14)"
                  : "none",
              transition: "box-shadow 0.2s ease, background-color 0.2s ease",
            }}
          >
            <div className="ty-pi-wrap min-w-0">
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
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                placeholder="Broj telefona"
                numberInputProps={{
                  id: "ty-phone-input",
                  "aria-label": "Broj telefona",
                  className: montserratPhoneInput.className,
                  autoComplete: "tel",
                  inputMode: "tel",
                }}
              />
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
    </div>
  );
}
