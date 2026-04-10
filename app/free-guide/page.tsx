"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, Download } from "lucide-react";
import { getLeadSourceData } from "@/lib/affiliate-tracking";
import { isAllowedEmailDomain, EMAIL_DOMAIN_ERROR } from "@/lib/email-domains";
import { storeLeadForThankYou } from "@/lib/tiktok-datalayer";
import { landingChannelFromPathname } from "@/lib/landing-attribution";

const CONFIG = {
  formAction: "/api/lead-magnet",
  guideName: "AI Starter Kit",
  guidePages: "32",
  guideFormat: "PDF",
  // TODO: zameni sa pravim URL-om kad odlučiš (download ili redirect)
  downloadUrl: "#",
  socialLinks: {
    instagram: "https://www.instagram.com/aihype.official?igsh=MTBrbWp1Y3V5NDBwMA==",
    tiktok: "https://www.tiktok.com/@ai.hype.akademija?_r=1&_t=ZN-94bDDZdy9Sw",
    youtube: "https://youtube.com/@aihypeacademy",
  },
} as const;

const ease = [0.16, 1, 0.3, 1] as const;

const SPIN_DURATION = 700; // ms — mora da se poklopi sa CSS animacijom

const LM_STYLES = `
  @keyframes lm-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes lm-glow-breathe {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  @keyframes lm-dot-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }
  @keyframes lm-unlock-glow {
    0%, 100% { box-shadow: 0 0 30px rgba(0,212,255,0.2), 0 0 60px rgba(124,58,237,0.12); }
    50% { box-shadow: 0 0 50px rgba(0,212,255,0.35), 0 0 100px rgba(124,58,237,0.2); }
  }
  @keyframes lm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes lm-pill-glow {
    0%, 100% {
      box-shadow: 0 0 14px rgba(0,212,255,0.20), 0 0 28px rgba(124,58,237,0.10);
    }
    50% {
      box-shadow: 0 0 22px rgba(0,212,255,0.32), 0 0 44px rgba(124,58,237,0.16);
    }
  }
  @keyframes lm-pill-sheen {
    0%, 15% { transform: translateX(-130%); }
    55%, 100% { transform: translateX(130%); }
  }

  /* Kartica spin — samo rotateY, GPU compositor */
  @keyframes lm-card-spin {
    0%   { transform: rotateY(0deg); }
    100% { transform: rotateY(360deg); }
  }

  .lm-card-float    { animation: lm-float 5s ease-in-out infinite; will-change: transform; }
  .lm-glow-breathe  { animation: lm-glow-breathe 3s ease-in-out infinite; }
  .lm-badge-dot     { animation: lm-dot-pulse 2s ease-in-out infinite; will-change: transform, opacity; }
  .lm-unlock-glow   { animation: lm-unlock-glow 2.5s ease-in-out infinite; }
  .lm-pill-animated {
    position: relative;
    overflow: hidden;
    animation: lm-pill-glow 2.2s ease-in-out infinite;
  }
  .lm-pill-animated::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(110deg, transparent 26%, rgba(255,255,255,0.42) 50%, transparent 74%);
    transform: translateX(-130%);
    animation: lm-pill-sheen 2.6s ease-in-out infinite;
    pointer-events: none;
  }
  .lm-card-spinning {
    animation: lm-card-spin ${SPIN_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    will-change: transform;
  }

  .lm-row { display: flex; align-items: stretch; border-radius: 50px; overflow: hidden; }
  .lm-input::placeholder { color: #000; opacity: 1; font-weight: 600; }
  .lm-btn {
    padding: 16px 24px;
    background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%);
    border: none; cursor: pointer; color: #fff;
    font-weight: 800; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    white-space: nowrap; font-family: inherit; transition: all 0.3s ease; flex-shrink: 0;
    box-shadow: 0 0 24px rgba(0,212,255,0.3), 0 0 48px rgba(124,58,237,0.15), 0 4px 14px rgba(0,0,0,0.4);
  }
  .lm-btn:hover:not(:disabled) {
    filter: brightness(1.1);
    box-shadow: 0 0 36px rgba(0,212,255,0.45), 0 0 72px rgba(124,58,237,0.2), 0 4px 18px rgba(0,0,0,0.5);
  }
  .lm-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  @media (max-width: 480px) {
    .lm-row { flex-direction: column; border-radius: 16px; gap: 8px; overflow: visible; }
    .lm-btn { border-radius: 12px !important; width: 100%; padding: 14px 20px; }
    .lm-shell {
      border-radius: 18px !important;
      padding: 18px 14px 18px !important;
    }
    .lm-main {
      padding-top: 74px !important;
      padding-left: 12px !important;
      padding-right: 12px !important;
    }
  }
`;

/* ─── Background ─── */
function BackgroundEffects() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <img
        src="/Leadmagnet-converted-from-png.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-bottom"
        style={{ opacity: 0.55 }}
        fetchPriority="high"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-[#050508]/65 to-[#050508]/80" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[340px] bg-[radial-gradient(ellipse_at_top,rgba(0,212,255,0.07),transparent_65%)] lm-glow-breathe" />
      <div className="absolute top-[20%] right-[-8%] w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.06),transparent_65%)] lm-glow-breathe" style={{ animationDelay: "1.5s" }} />
    </div>
  );
}

/* ─── Lead Form ─── */
function LeadForm({ onSuccess }: { onSuccess: (email: string, eventId: string) => void }) {
  const pathname = usePathname() ?? "";
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const trimmed = email.trim();
  const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
  const localhostBypass = isLocalhost && process.env.NEXT_PUBLIC_FREE_GUIDE_LOCAL_BYPASS === "true";
  const canSubmit =
    trimmed.includes("@") && trimmed.length > 5 && (localhostBypass || isAllowedEmailDomain(trimmed)) && status !== "loading";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    // ── Localhost bypass: preskači validaciju i API poziv ──
    if (localhostBypass) {
      const emailNorm = trimmed.toLowerCase();
      const localhostEventId = `localhost-${Date.now()}`;
      storeLeadForThankYou(emailNorm, null, localhostEventId, landingChannelFromPathname(pathname));
      onSuccess(emailNorm, localhostEventId);
      return;
    }
    if (!isAllowedEmailDomain(trimmed)) { setFieldError(EMAIL_DOMAIN_ERROR); return; }
    setStatus("loading"); setFieldError(null);
    try {
      const eventId =
        typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function"
          ? globalThis.crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const sourceData = getLeadSourceData();
      const emailNorm = trimmed.toLowerCase();
      const res = await fetch(CONFIG.formAction, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailNorm, phone: null, name: null,
          utm_source: sourceData.utm_source,
          utm_medium: sourceData.utm_medium,
          utm_campaign: sourceData.utm_campaign ?? "lead_magnet",
          affiliate_code: sourceData.affiliate_code,
          source_tag: "lead_magnet",
          event_id: eventId,
        }),
      });
      if (res.ok) {
        storeLeadForThankYou(emailNorm, null, eventId, landingChannelFromPathname(pathname));
        setEmail("");
        setStatus("idle");
        onSuccess(emailNorm, eventId);
      }
      else {
        const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        setFieldError(typeof data.error === "string" ? data.error : typeof data.message === "string" ? data.message : null);
        setStatus("error");
      }
    } catch { setStatus("error"); }
  };

  const showError = status === "error" || !!fieldError?.trim();

  return (
    <form onSubmit={handleSubmit} className="w-[min(100%,430px)] mx-auto">
      <div
        className="lm-row"
        style={{
          border: `1px solid ${showError ? "rgba(239,68,68,0.45)" : focused ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.1)"}`,
          background: "rgba(255, 255, 255, 0.03)",
          boxShadow: focused && !showError ? "0 0 30px rgba(168,85,247,0.12)" : "none",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,248,255,0.96))",
            borderRight: "1px solid rgba(168,85,247,0.2)",
          }}
        >
          <input
            type="email" required value={email}
            onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); if (fieldError) setFieldError(null); }}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            placeholder="Unesi svoj email" autoComplete="email" inputMode="email"
            className="lm-input"
            style={{ flex: 1, minWidth: 0, padding: "16px 20px", background: "rgba(255,255,255,0.94)", border: "none", outline: "none", color: "#0b1020", fontSize: 15, fontFamily: "inherit", width: "100%" }}
          />
        </div>
        <button type="submit" disabled={!canSubmit} className="lm-btn">
          {status === "loading"
            ? <><Loader2 size={16} style={{ animation: "lm-spin 1s linear infinite" }} /> Slanje...</>
            : <>Preuzmi <ArrowRight size={15} strokeWidth={2.5} /></>}
        </button>
      </div>
      {(status === "error" || fieldError) && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-[13px] mt-3 text-center">
          {fieldError?.trim() ? fieldError : "Greška. Pokušaj ponovo."}
        </motion.p>
      )}
    </form>
  );
}

/* ─── Success inline state (replaces form) ─── */
function SuccessInline() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease }}
      className="w-full max-w-[520px] mx-auto flex items-center justify-center gap-4 px-5 py-4 rounded-2xl text-center"
      style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.18)" }}
    >
      <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
          style={{ color: "#00d4ff" }} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-[14px] leading-tight">Inbox! 📬 Proveri email</p>
        <p className="text-white/40 text-[12px] mt-0.5">Klikni na karticu desno da preuzmis vodič</p>
      </div>
    </motion.div>
  );
}

/* ─── PDF Card ─── */
function GuideCard({ unlocked, onCardClick }: { unlocked: boolean; onCardClick: () => void }) {
  // spinning — CSS klasa aktiva tokom okretanja
  const [spinning, setSpinning] = useState(false);
  // imageUnlocked — koja slika je prikazana (menja se na 180° = pola spina)
  const [imageUnlocked, setImageUnlocked] = useState(false);
  const triggered = useRef(false);

  // Pokretanje spin-a čim korisnik popuni formu
  useEffect(() => {
    if (unlocked && !triggered.current) {
      triggered.current = true;
      const raf = requestAnimationFrame(() => setSpinning(true));
      // Na 180° (kartica okrenuta od usera) — swap slike
      const t1 = setTimeout(() => setImageUnlocked(true), SPIN_DURATION / 2);
      // Kraj spina — ukloni will-change
      const t2 = setTimeout(() => setSpinning(false), SPIN_DURATION + 50);
      return () => { cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2); };
    }
  }, [unlocked]);

  // Tilt-on-hover (samo kad nije u spinu i kad je otključano)
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || spinning) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height / 2) / 20;
    const y = -(e.clientX - rect.left - rect.width / 2) / 20;
    setTilt({ x: Math.max(-7, Math.min(7, x)), y: Math.max(-7, Math.min(7, y)) });
  };
  const handleLeave = () => setTilt({ x: 0, y: 0 });

  // CSS klase za inner div
  const innerClass = [
    spinning ? "lm-card-spinning" : "",
    !spinning && !unlocked ? "lm-card-float" : "",
    !spinning && unlocked ? "lm-unlock-glow" : "",
  ].filter(Boolean).join(" ");

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      onClick={unlocked && !spinning ? onCardClick : undefined}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease }}
      className={`relative select-none ${unlocked && !spinning ? "cursor-pointer" : "cursor-default"}`}
      style={{ perspective: "900px" }}
      title={unlocked ? "Klikni da preuzmеš" : "Popuni formu da otključaš"}
    >
      {/* Glow iza kartice */}
      <motion.div
        className="absolute -inset-6 rounded-3xl blur-2xl pointer-events-none"
        animate={{
          background: unlocked
            ? "radial-gradient(ellipse at center, rgba(0,212,255,0.22) 0%, rgba(139,92,246,0.15) 50%, transparent 75%)"
            : "radial-gradient(ellipse at center, rgba(0,212,255,0.08) 0%, rgba(139,92,246,0.05) 50%, transparent 75%)",
        }}
        transition={{ duration: 0.9 }}
      />

      {/* Spin + tilt wrapper */}
      <div
        className={`relative ${innerClass}`}
        style={
          !spinning
            ? { transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition: "transform 0.25s ease-out", borderRadius: "20px" }
            : { borderRadius: "20px" }
        }
      >
        {/* Kartica */}
        <div
          className="relative w-[180px] sm:w-[210px] overflow-hidden rounded-[20px]"
          style={{
            aspectRatio: "1792 / 2400",
            border: imageUnlocked ? "1.5px solid rgba(0,212,255,0.4)" : "1.5px solid rgba(0,212,255,0.2)",
            transition: "border-color 0.5s ease",
            // backface-visibility: hidden omogućava da kartica "nestane" na 90°-270°
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {/* Locked slika — prikazana kada !imageUnlocked */}
          <img
            src="/zakljucano-converted-from-png.png"
            alt="Zaključano"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: imageUnlocked ? 0 : 1,
              transition: "opacity 0.15s ease",
              pointerEvents: "none",
            }}
            decoding="async"
          />

          {/* Unlocked slika — prikazana kada imageUnlocked */}
          <img
            src="/otkljucano-converted-from-png.png"
            alt="Otključano"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: imageUnlocked ? 1 : 0,
              transition: "opacity 0.15s ease",
              pointerEvents: "none",
            }}
            decoding="async"
          />

          {/* Dark overlay — vidljiv kad je zaključano, nestaje po otključavanju */}
          <div
            className="absolute inset-0 z-[5] rounded-[20px] pointer-events-none"
            style={{
              background: "rgba(0,0,0,0.48)",
              opacity: imageUnlocked ? 0 : 1,
              transition: "opacity 0.7s ease",
            }}
          />

          {/* Preuzmi CTA — pojavljuje se posle spina */}
          <AnimatePresence>
            {unlocked && !spinning && (
              <motion.div
                key="unlock-cta"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="absolute left-0 right-0 z-20 flex justify-center"
                style={{ bottom: "10%", background: "transparent" }}
              >
                <div
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-bold"
                  style={{
                    background: "rgba(0,212,255,0.18)",
                    border: "1px solid rgba(0,212,255,0.4)",
                    color: "#00d4ff",
                    boxShadow: "0 0 18px rgba(0,212,255,0.2)",
                  }}
                >
                  <Download size={13} strokeWidth={2.5} />
                  Preuzmi
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Page ─── */
export default function LeadMagnetPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [redirectEventId, setRedirectEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!submitted) return;
    const id = globalThis.window.setTimeout(() => {
      const suffix = redirectEventId ? `?eid=${encodeURIComponent(redirectEventId)}` : "";
      router.push(`/thank-you-free-guide${suffix}`);
    }, 2000);
    return () => globalThis.window.clearTimeout(id);
  }, [submitted, redirectEventId, router]);

  const handleCardClick = () => {
    if (CONFIG.downloadUrl && CONFIG.downloadUrl !== "#") {
      window.open(CONFIG.downloadUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="relative min-h-screen text-white antialiased overflow-x-hidden" style={{ background: "#050508" }}>
      <style>{LM_STYLES}</style>
      <BackgroundEffects />
      <Header />

      <main className="lm-main" style={{ position: "relative", zIndex: 10, minHeight: "100vh", padding: "82px 16px 32px", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: 680 }}>

          {/* ── Shell ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="lm-shell"
            style={{
              borderRadius: 24,
              border: "1px solid rgba(0,212,255,0.2)",
              background: "linear-gradient(165deg, rgba(0,212,255,0.06) 0%, rgba(102,45,145,0.07) 36%, rgba(8,9,15,0.92) 100%)",
              boxShadow: "0 0 34px rgba(0,212,255,0.1), 0 0 72px rgba(102,45,145,0.14), 0 18px 54px rgba(0,0,0,0.45)",
              padding: "clamp(22px, 3.2vw, 30px) clamp(16px, 3vw, 26px) clamp(20px, 2.6vw, 26px)",
            }}
          >
            <div className="flex flex-col items-center gap-7 sm:gap-10">

              {/* ── Tekst + Forma ── */}
              <div className="w-full text-center max-w-[620px] mx-auto">

                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }} className="mb-5"
                >
                  <span className="lm-pill-animated inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{ background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.18)", color: "#00d4ff" }}>
                    <span className="w-1.5 h-1.5 rounded-full lm-badge-dot" style={{ background: "#00d4ff" }} />
                    Besplatan {CONFIG.guideFormat}
                  </span>
                </motion.div>

                {/* Heading */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease }}
                  className="text-[30px] sm:text-[32px] font-extrabold leading-[1.12] tracking-tight mb-6 sm:mb-8"
                >
                  Preuzmi{" "}
                  <span style={{
                    background: "linear-gradient(135deg, #00d4ff 0%, #a78bfa 60%, #7c3aed 100%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  }}>
                    AI Influencer Starter Kit
                  </span>
                  <br />besplatno.
                </motion.h1>

                <div
                  style={{
                    width: "100%",
                    maxWidth: 520,
                    height: 1,
                    margin: "0 auto 12px",
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)",
                  }}
                />

                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.28, ease }}
                  className="text-white/70 text-[14px] sm:text-[15px] leading-relaxed mt-2 sm:mt-4 mb-6 sm:mb-9 max-w-[560px] mx-auto text-left"
                >
                  <p className="mt-0">
                    Kako je AI profil sa 0 došao do 60.000 pratilaca i preko 80 miliona pregleda za samo 6 dana, bez
                    pokazivanja lica.
                  </p>
                  <p className="mt-7 sm:mt-12">
                    U ovom PDF-u otkrivamo osnovu sistema koji stoji iza viralnih AI influensera, uključujući:
                  </p>
                  <div className="mt-7 mb-7 sm:mt-9 sm:mb-9">
                    <ul className="space-y-2 list-disc pl-6 text-white/75">
                      <li>Strukturu koja omogućava brz rast profila</li>
                      <li>Kako se pravi vizuelno dosledan AI lik</li>
                      <li>Zašto većina ljudi ne dobije nikakav reach</li>
                      <li>I kako se postavlja profil da algoritam “razume” kome da prikazuje sadržaj</li>
                    </ul>
                  </div>
                  <p className="mt-3">
                    Ovo je samo deo sistema koji koristimo, ali dovoljno da vidiš kako stvari zapravo funkcionišu iza
                    scene.
                  </p>
                </motion.div>

                {/* Forma ili success */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4, ease }} className="mb-4 sm:mb-6"
                >
                  <div
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                      marginTop: 6,
                      paddingTop: 18,
                    }}
                  >
                  <p className="text-[14px] sm:text-[15px] font-semibold text-white/85 mb-2 px-1">
                      👇 Upisi svoj mail i preuzmi Starter Kit
                    </p>
                  <p className="text-[12px] sm:text-[13px] text-white/60 mb-4 sm:mb-5 px-1">
                    Takođe ulaziš na waitlistu, i moći ćeš kupiti kurs kad izađe.
                  </p>
                    <AnimatePresence mode="wait">
                      {submitted ? (
                        <SuccessInline key="success" />
                      ) : (
                        <motion.div
                          key="form"
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.25 }}
                          className="flex justify-center"
                        >
                          <LeadForm onSuccess={(_, eventId) => { setRedirectEventId(eventId); setSubmitted(true); }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

              </div>

              {/* ── PDF kartica ── */}
              <div className="flex flex-col items-center gap-3.5 sm:gap-4">
                <GuideCard unlocked={submitted} onCardClick={handleCardClick} />
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="text-[11px] text-center max-w-[220px]"
                  style={{ color: submitted ? "rgba(0,212,255,0.5)" : "rgba(255,255,255,0.18)" }}
                >
                  {submitted ? "Kartica je otključana — klikni!" : "Popuni formu da otključaš"}
                </motion.p>
              </div>

            </div>
          </motion.div>
        </div>
      </main>

      <footer style={{ position: "relative", zIndex: 10, borderTop: "1px solid rgba(0,212,255,0.05)", padding: "32px 16px", textAlign: "center", width: "100%" }}>
        <p className="text-[11px] text-white/15">© {new Date().getFullYear()} AI Hype Academy. Sva prava zadržana.</p>
      </footer>
    </div>
  );
}
