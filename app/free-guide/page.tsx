"use client";

import Image from "next/image";
import { useState, useEffect, useRef, type FormEvent, type MouseEvent } from "react";
import Header from "@/components/layout/Header";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { getLeadSourceData } from "@/lib/affiliate-tracking";
import { isAllowedEmailDomain, EMAIL_DOMAIN_ERROR } from "@/lib/email-domains";

const CONFIG = {
  formAction: "/api/lead-magnet",
  downloadCount: 1847,
  guideName: "AI Starter Kit",
  guidePages: "32",
  guideFormat: "PDF",
  socialLinks: {
    instagram: "https://www.instagram.com/aihype.official?igsh=MTBrbWp1Y3V5NDBwMA==",
    tiktok: "https://www.tiktok.com/@ai.hype.akademija?_r=1&_t=ZN-94bDDZdy9Sw",
    youtube: "https://youtube.com/@aihypeacademy",
  },
} as const;

const GUIDE_CONTENTS = [
  {
    icon: "🎯",
    title: "5 AI alata koja moraš znati",
    desc: "Koji alati su najbitniji i kako da ih odmah počneš koristiti.",
  },
  {
    icon: "🎬",
    title: "AI content formula",
    desc: "Korak-po-korak proces za pravljenje sadržaja koji ljudi gledaju.",
  },
  {
    icon: "💡",
    title: "3 projekta koja možeš pokrenuti danas",
    desc: "Konkretne ideje koje možeš testirati odmah — bez iskustva.",
  },
  {
    icon: "💰",
    title: "Kako monetizovati AI znanje",
    desc: "Gde su prilike i kako da napraviš prvi prihod sa AI.",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
};

const PARTICLE_PRESETS = [
  { w: 3, left: 12, top: 18, opacity: 0.08, duration: 6.2, delay: 0.1 },
  { w: 2, left: 78, top: 22, opacity: 0.07, duration: 5.5, delay: 0.4 },
  { w: 2.5, left: 22, top: 42, opacity: 0.1, duration: 7.0, delay: 1.2 },
  { w: 3, left: 88, top: 48, opacity: 0.06, duration: 5.8, delay: 0.2 },
  { w: 2, left: 8, top: 62, opacity: 0.09, duration: 6.4, delay: 2.0 },
  { w: 2, left: 52, top: 12, opacity: 0.05, duration: 5.9, delay: 0.8 },
  { w: 3, left: 66, top: 68, opacity: 0.11, duration: 6.1, delay: 1.5 },
  { w: 2, left: 34, top: 78, opacity: 0.08, duration: 5.7, delay: 0.3 },
];

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const step = (now: number) => {
            const p = Math.min((now - t0) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCount(Math.floor(eased * target));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function BackgroundEffects() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_65%)] lm-glow-pulse" />
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(125,211,252,0.05),transparent_65%)] lm-glow-pulse lm-glow-pulse--delay" />
      <div className="absolute bottom-[-5%] left-[20%] w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.05),transparent_65%)] lm-glow-pulse lm-glow-pulse--delay-2" />
      {PARTICLE_PRESETS.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white lm-particle-float"
          style={{
            width: `${p.w}px`,
            height: `${p.w}px`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function LeadForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const trimmed = email.trim();
  const canSubmit =
    trimmed.includes("@") &&
    trimmed.length > 5 &&
    isAllowedEmailDomain(trimmed) &&
    status !== "loading";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (!isAllowedEmailDomain(trimmed)) {
      setFieldError(EMAIL_DOMAIN_ERROR);
      return;
    }

    setStatus("loading");
    setFieldError(null);

    try {
      const sourceData = getLeadSourceData();
      const res = await fetch(CONFIG.formAction, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          phone: null,
          name: null,
          utm_source: sourceData.utm_source,
          utm_medium: sourceData.utm_medium,
          utm_campaign: sourceData.utm_campaign ?? "lead_magnet",
          affiliate_code: sourceData.affiliate_code,
          source_tag: "lead_magnet",
        }),
      });

      if (res.ok) {
        setEmail("");
        setStatus("idle");
        onSuccess();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        const msg =
          typeof data.error === "string"
            ? data.error
            : typeof data.message === "string"
              ? data.message
              : null;
        setFieldError(msg);
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const showFieldError = status === "error" || !!fieldError?.trim();

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[520px] mx-auto">
      <style>{`
        @keyframes lm-free-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .lm-free-row { display: flex; align-items: stretch; border-radius: 50px; overflow: hidden; }
        .lm-free-input::placeholder { color: #000; opacity: 1; font-weight: 600; }
        .lm-free-btn {
          padding: 16px 22px;
          background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
          border: none;
          cursor: pointer;
          color: #050508;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          white-space: nowrap;
          font-family: inherit;
          transition: all 0.3s ease;
          flex-shrink: 0;
          box-shadow:
            0 0 22px rgba(168, 85, 247, 0.28),
            0 0 48px rgba(168, 85, 247, 0.08),
            0 4px 14px rgba(0, 0, 0, 0.35);
        }
        .lm-free-btn:hover:not(:disabled) {
          filter: brightness(1.07);
          box-shadow:
            0 0 30px rgba(168, 85, 247, 0.4),
            0 0 64px rgba(168, 85, 247, 0.1),
            0 4px 18px rgba(0, 0, 0, 0.4);
        }
        .lm-free-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 480px) {
          .lm-free-row { flex-direction: column; border-radius: 16px; gap: 8px; overflow: visible; }
          .lm-free-btn { border-radius: 12px !important; width: 100%; padding: 14px 20px; }
        }
      `}</style>
      <div
        className="lm-free-row"
        style={{
          border: `1px solid ${
            showFieldError
              ? "rgba(239, 68, 68, 0.4)"
              : focused
                ? "rgba(168, 85, 247, 0.4)"
                : "rgba(255, 255, 255, 0.1)"
          }`,
          background: "rgba(255, 255, 255, 0.03)",
          boxShadow: focused && !showFieldError ? "0 0 30px rgba(168, 85, 247, 0.12)" : "none",
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
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
              if (fieldError) setFieldError(null);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Unesi svoj email"
            autoComplete="email"
            inputMode="email"
            className="lm-free-input"
            style={{
              flex: 1,
              minWidth: 0,
              padding: "16px 20px",
              background: "rgba(255,255,255,0.94)",
              border: "none",
              outline: "none",
              color: "#0b1020",
              fontSize: 15,
              fontFamily: "inherit",
              width: "100%",
            }}
          />
        </div>
        <button type="submit" disabled={!canSubmit} className="lm-free-btn">
          {status === "loading" ? (
            <>
              <Loader2 size={16} style={{ animation: "lm-free-spin 1s linear infinite", willChange: "transform" }} />
              Slanje...
            </>
          ) : (
            <>
              Preuzmi <ArrowRight size={15} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
      {(status === "error" || fieldError) && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-[13px] mt-3 text-center"
        >
          {fieldError?.trim()
            ? fieldError
            : status === "error"
              ? "Greška. Pokušaj ponovo."
              : ""}
        </motion.p>
      )}
    </form>
  );
}

function SuccessState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease }}
      className="w-full max-w-[520px] mx-auto text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="
          w-16 h-16 mx-auto mb-5 rounded-full
          bg-gradient-to-br from-emerald-500/20 to-emerald-600/10
          border border-emerald-500/20
          flex items-center justify-center
        "
      >
        <svg
          className="w-7 h-7 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease }}
        className="text-xl font-bold text-white mb-2"
      >
        Proverite inbox! 📬
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-white/50 text-[15px] mb-6"
      >
        {CONFIG.guideName} je na putu ka vašem email-u.
        <br />
        Proverite i spam folder.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5, ease }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/25 mb-3">Prati nas dok čekaš</p>
        <div className="flex items-center justify-center gap-3">
          {[
            { href: CONFIG.socialLinks.instagram, icon: "📸" },
            { href: CONFIG.socialLinks.tiktok, icon: "🎵" },
            { href: CONFIG.socialLinks.youtube, icon: "▶️" },
          ].map((s, i) => (
            <a
              key={i}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="
                w-11 h-11 rounded-full flex items-center justify-center
                bg-white/[0.03] border border-white/[0.06]
                hover:border-violet-500/20 hover:bg-violet-500/[0.05]
                hover:-translate-y-0.5 transition-all duration-300
                text-sm
              "
            >
              {s.icon}
            </a>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function GuidePreview() {
  const ref = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouse = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height / 2) / 20;
    const y = -(e.clientX - rect.left - rect.width / 2) / 20;
    setRotate({ x: Math.max(-8, Math.min(8, x)), y: Math.max(-8, Math.min(8, y)) });
  };

  const handleLeave = () => setRotate({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      {...scaleIn}
      transition={{ duration: 0.8, delay: 0.3, ease }}
      className="relative"
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative transition-transform duration-300 ease-out"
        style={{ transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)` }}
      >
        <div className="absolute -inset-4 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.12),transparent_70%)] rounded-3xl blur-xl" />
        <div
          className="
            relative flex h-[300px] w-[220px] flex-col overflow-hidden rounded-2xl
            border border-white/[0.08]
            bg-gradient-to-br from-[#111827] via-[#0e1320] to-[#0b0f1a]
            px-7 py-7 text-center
            shadow-[0_20px_60px_rgba(0,0,0,0.5)]
            sm:h-[350px] sm:w-[260px] sm:px-8 sm:py-8
          "
        >
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-[1] h-1/3 bg-gradient-to-b from-white/[0.04] to-transparent" />
          <div
            className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center"
            aria-hidden
          >
            <Image
              src="/logo.png"
              alt=""
              width={280}
              height={92}
              className="h-auto w-[82%] max-w-[210px] object-contain opacity-[0.2] sm:max-w-[240px]"
            />
          </div>
          <div className="absolute right-4 top-4 z-20">
            <span
              className="
                rounded-md border border-violet-500/20 bg-violet-500/15 px-2.5 py-1
                text-[9px] font-bold uppercase tracking-wider text-violet-300
              "
            >
              {CONFIG.guideFormat}
            </span>
          </div>
          <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col justify-between px-0.5 pt-11 pb-6 sm:px-1 sm:pt-12 sm:pb-7">
            <h3 className="mx-auto max-w-[92%] bg-gradient-to-r from-white via-white to-white/80 bg-clip-text pt-0.5 text-lg font-extrabold leading-snug text-transparent sm:text-xl">
              {CONFIG.guideName}
            </h3>
            <div className="flex shrink-0 items-center justify-center gap-3 px-1 text-[11px] text-white/30 sm:gap-4">
              <span className="flex items-center gap-1">📄 {CONFIG.guidePages} str.</span>
              <span className="flex items-center gap-1">⚡ Besplatno</span>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-20 bg-gradient-to-t from-[#0b0f1a] to-transparent" />
        </div>
      </div>
    </motion.div>
  );
}

function GuideContents() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className="w-full">
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-400/70 mb-10 sm:mb-12 text-center"
      >
        Šta je unutra
      </motion.p>

      <div className="flex flex-col gap-12 sm:gap-14">
        {GUIDE_CONTENTS.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.1, ease }}
            className="
              group flex w-full flex-col items-center text-center gap-4
              p-5 sm:p-6 rounded-xl
              bg-white/[0.02] border border-white/[0.04]
              hover:border-violet-500/15 hover:bg-violet-500/[0.02]
              transition-all duration-300
            "
          >
            <span className="text-xl leading-none" aria-hidden>
              {item.icon}
            </span>
            <div>
              <h4 className="text-[15px] font-semibold text-white mb-1">{item.title}</h4>
              <p className="text-[13px] text-white/45 leading-relaxed">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SocialProof() {
  const { count, ref } = useCountUp(CONFIG.downloadCount);

  return (
    <motion.div
      {...fadeIn}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-8 sm:px-10 sm:py-10 text-center"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-400/70 mb-8 sm:mb-10">
        Brojke u jednom pogledu
      </p>
      <div className="flex w-full justify-center">
        <div className="inline-flex max-w-full flex-row flex-wrap items-center justify-center gap-x-6 gap-y-5 sm:gap-x-10 md:gap-x-14">
        <div className="text-center min-w-[88px]">
          <span
            ref={ref}
            className="block text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent tabular-nums"
          >
            {count.toLocaleString()}+
          </span>
          <span className="text-[10px] font-medium text-white/30 uppercase tracking-[0.1em] mt-1.5 block">
            Preuzimanja
          </span>
        </div>
        <div className="hidden sm:block w-px h-10 bg-white/[0.08]" aria-hidden />
        <div className="text-center min-w-[72px]">
          <span className="block text-2xl sm:text-3xl font-extrabold text-white">{CONFIG.guidePages}</span>
          <span className="text-[10px] font-medium text-white/30 uppercase tracking-[0.1em] mt-1.5 block">
            Stranica
          </span>
        </div>
        <div className="hidden sm:block w-px h-10 bg-white/[0.08]" aria-hidden />
        <div className="text-center min-w-[72px]">
          <span className="block text-2xl sm:text-3xl font-extrabold text-emerald-400">€0</span>
          <span className="text-[10px] font-medium text-white/30 uppercase tracking-[0.1em] mt-1.5 block">Cena</span>
        </div>
        </div>
      </div>
    </motion.div>
  );
}

function TrustBadges() {
  return (
    <motion.div
      {...fadeIn}
      transition={{ duration: 0.5, delay: 1.2 }}
      className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-white/30"
    >
      <span className="flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        Bez spama
      </span>
      <span className="w-1 h-1 rounded-full bg-white/10" />
      <span className="flex items-center gap-1.5">⚡ Instant pristup</span>
      <span className="w-1 h-1 rounded-full bg-white/10" />
      <span className="flex items-center gap-1.5">🎁 100% besplatno</span>
    </motion.div>
  );
}

export default function LeadMagnetPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="lead-magnet-wrapper relative min-h-screen bg-[#050508] text-white antialiased overflow-x-hidden">
      <BackgroundEffects />
      <Header />

      <main className="relative z-10">
        <section className="min-h-[calc(100dvh-72px)] flex items-center justify-center px-5 pt-24 pb-20 sm:pt-28 sm:pb-24">
          <div className="w-full max-w-[1080px] mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20">
              <div className="flex-1 max-w-[520px] text-center">
                <motion.div {...fadeIn} transition={{ duration: 0.5, delay: 0.05 }} className="mb-6">
                  <span
                    className="
                      inline-flex items-center gap-2 px-4 py-1.5
                      rounded-full text-[10px] sm:text-[11px] font-semibold
                      uppercase tracking-[0.12em]
                      text-violet-300 bg-violet-500/10
                      border border-violet-500/15
                    "
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    Besplatan {CONFIG.guideFormat}
                  </span>
                </motion.div>

                <motion.h1
                  {...fadeUp}
                  transition={{ duration: 0.6, delay: 0.25, ease }}
                  className="text-[32px] sm:text-[42px] lg:text-[48px] font-extrabold leading-[1.1] tracking-tight mb-5"
                >
                  Preuzmi{" "}
                  <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                    {CONFIG.guideName}
                  </span>
                  <br />
                  potpuno besplatno.
                </motion.h1>

                <motion.p
                  {...fadeUp}
                  transition={{ duration: 0.6, delay: 0.35, ease }}
                  className="text-[16px] sm:text-[17px] text-white/55 leading-relaxed mb-8 max-w-[440px] mx-auto"
                >
                  {CONFIG.guidePages} stranica konkretnih AI strategija, alata i projekata koje možeš primeniti odmah. Bez teorije.
                  Bez floskula.
                </motion.p>

                <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.45, ease }} className="mb-6">
                  <AnimatePresence mode="wait">
                    {submitted ? (
                      <SuccessState key="success" />
                    ) : (
                      <motion.div key="form" exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                        <LeadForm onSuccess={() => setSubmitted(true)} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {!submitted && <TrustBadges />}
              </div>

              <div className="flex-shrink-0 hidden sm:block">
                <GuidePreview />
              </div>
            </div>
          </div>
        </section>

        <section className="flex w-full justify-center px-5 pt-24 pb-36 sm:pt-32 sm:pb-44">
          <div className="flex w-full max-w-[560px] flex-col gap-16 sm:gap-20">
            <GuideContents />
            <SocialProof />
          </div>
        </section>

        <section className="relative overflow-hidden px-5 pt-20 pb-28 sm:pt-24 sm:pb-36 flex flex-col items-center">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.06),transparent_60%)]" />
          </div>

          <div className="relative w-full max-w-[560px] mx-auto px-4 flex flex-col items-center text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              className="text-[28px] sm:text-[36px] font-extrabold leading-[1.15] tracking-tight mb-5"
            >
              Ne propusti{" "}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">
                besplatan vodič.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-white/45 text-[16px] mb-10"
            >
              Ostavi email. Instant pristup. Bez spama.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
              className="w-full flex flex-col items-center"
            >
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.p
                    key="done"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-emerald-400 font-semibold text-[15px] text-center"
                  >
                    ✅ Već si se prijavio! Proveri inbox.
                  </motion.p>
                ) : (
                  <motion.div key="form2" exit={{ opacity: 0 }} className="w-full flex justify-center">
                    <LeadForm onSuccess={() => setSubmitted(true)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        <footer className="mt-6 sm:mt-10 border-t border-white/[0.03] py-10 sm:py-12 text-center">
          <p className="text-[11px] text-white/20">© {new Date().getFullYear()} AI Hype Academy. Sva prava zadržana.</p>
        </footer>
      </main>

    </div>
  );
}
