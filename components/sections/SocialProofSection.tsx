"use client";

import { useRef, useEffect, useState, type CSSProperties } from "react";
import { Eye, Users, Play, BookOpen, Award, Zap } from "lucide-react";
import SkoolCtaButton from "@/components/ui/SkoolCtaButton";
import { useInView } from "@/lib/use-in-view";
import { useDocumentHtmlDataFlag } from "@/lib/use-html-data-flag";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const START_DATE = new Date(2026, 2, 11, 0, 0, 0);
const START_VALUE = 1200;

const COUNTDOWN_END = new Date(2026, 3, 16, 0, 0, 0);
const BAR_START_PCT = 58;

function getBarProgress(): number {
  if (globalThis.window === undefined) return BAR_START_PCT;
  const now = Date.now();
  const start = START_DATE.getTime();
  const end = COUNTDOWN_END.getTime();
  if (now >= end) return 100;
  if (now < start) return BAR_START_PCT;
  const total = end - start;
  const elapsed = now - start;
  const raw = elapsed / total;
  return BAR_START_PCT + (100 - BAR_START_PCT) * raw;
}

function getDaysSinceStart(d: Date): number {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const start = new Date(START_DATE.getFullYear(), START_DATE.getMonth(), START_DATE.getDate()).getTime();
  return Math.floor((day - start) / 86400000);
}

function getDailyLimit(dayIndex: number): number {
  const base = 350;
  const spread = 251; // 350..600
  return base + ((dayIndex * 7919 + 31) % spread);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function getWaitlistCount(): number {
  if (globalThis.window === undefined) return START_VALUE;
  const now = new Date();
  const daysSinceStart = getDaysSinceStart(now);
  if (daysSinceStart < 0) return START_VALUE;

  let baseAtMidnight = START_VALUE;
  for (let i = 0; i < daysSinceStart; i++) {
    baseAtMidnight += getDailyLimit(i);
  }

  const todayLimit = getDailyLimit(daysSinceStart);
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const progress = easeInOut((now.getTime() - midnight) / 86400000);
  const todayAdded = Math.floor(progress * todayLimit);

  const computed = baseAtMidnight + todayAdded;

  try {
    const key = "aha_waitlist_max_v2";
    const storedRaw = globalThis.window.localStorage.getItem(key);
    const stored = storedRaw ? Number.parseInt(storedRaw, 10) : Number.NaN;
    const safe = Number.isFinite(stored) ? Math.max(computed, stored) : computed;
    globalThis.window.localStorage.setItem(key, String(safe));
    return safe;
  } catch {
    return computed;
  }
}

const ticks = [
  { icon: Eye,      value: "2.1M+", label: "Pregleda",    color: "#00d4ff" },
  { icon: Users,    value: "48K+",  label: "Pratilaca",   color: "#a855f7" },
  { icon: Play,     value: "30+",   label: "Sati lekcija",color: "#ec4899" },
  { icon: BookOpen, value: "8",     label: "Modula",      color: "#f97316" },
  { icon: Award,    value: "1",     label: "Nagrada",     color: "#facc15" },
  { icon: Zap,      value: "100%",  label: "Prakticno",   color: "#22c55e" },
];

const SOCIAL_PROOF_INVIEW_THRESHOLDS = [0, 0.15, 0.35, 0.55, 0.75, 1] as const;

export default function SocialProofSection() {
  const hideSocialProofCtaOnLocalhost = process.env.NODE_ENV === "development";
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, {
    once: false,
    amount: 0.15,
    thresholds: SOCIAL_PROOF_INVIEW_THRESHOLDS,
  });
  const reducedHook = useReducedMotion();
  const heroVslHeavy = useDocumentHtmlDataFlag("data-hero-vsl-heavy");
  const heavyOk = inView && !reducedHook && !heroVslHeavy;

  // Keep initial SSR and client render identical to avoid hydration mismatch.
  const [waitlist, setWaitlist] = useState(START_VALUE);
  const [barProgress, setBarProgress] = useState(BAR_START_PCT);

  useEffect(() => {
    const t = globalThis.window.setTimeout(() => {
      setWaitlist(getWaitlistCount());
      setBarProgress(getBarProgress());
    }, 0);
    return () => globalThis.window.clearTimeout(t);
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      setWaitlist(getWaitlistCount());
      t = setTimeout(tick, 120000 + Math.random() * 120000);
    };
    t = setTimeout(tick, 60000 + Math.random() * 60000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const r = globalThis.window.setTimeout(() => setBarProgress(getBarProgress()), 0);
    const ms = heavyOk ? 1000 : 10000;
    const i = setInterval(() => setBarProgress(getBarProgress()), ms);
    return () => {
      globalThis.window.clearTimeout(r);
      clearInterval(i);
    };
  }, [heavyOk]);

  const tickItems = heavyOk ? [...ticks, ...ticks, ...ticks] : ticks;
  const barWidth = inView ? barProgress : BAR_START_PCT;
  const iv = inView || reducedHook;

  return (
    <section
      ref={ref}
      className={`landing-section-y--compact${reducedHook ? " sr-nomotion" : ""}`}
      style={{
        position: "relative",
        zIndex: 10,
        overflow: "hidden",
        padding: hideSocialProofCtaOnLocalhost ? "0" : undefined,
      }}
    >

      <div
        className={`sr-fade sr-ease ${iv ? "sr-inview" : ""}`}
        style={{
          borderTop:    "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background:   "rgba(255,255,255,0.015)",
          padding: "14px 0",
          marginBottom: hideSocialProofCtaOnLocalhost ? 0 : "clamp(2.5rem, 8vw, 5rem)",
          maskImage:        "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
          WebkitMaskImage:  "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
          overflow: "hidden",
          "--sr-d": "0.6s",
        } as CSSProperties}
      >
        <style>{`
          @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-33.333%) } }
          .ticker-track { display: flex; width: max-content; }
          .ticker-track.ticker-anim { animation: ticker 18s linear infinite; will-change: transform; }
          @media (prefers-reduced-motion: reduce) { .ticker-track.ticker-anim { animation: none; } }
        `}</style>
        <div className={`ticker-track${heavyOk ? " ticker-anim" : ""}`}>
          {tickItems.map((t, i) => {
            const Icon = t.icon;
            const itemKey = `${t.label}-${t.value}-${i}`;
            return (
              <div key={itemKey} style={{ display: "flex", alignItems: "center", gap: 28, paddingRight: 40, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 9,
                    background: `${t.color}15`, border: `1px solid ${t.color}25`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Icon size={14} color={t.color} strokeWidth={1.8} />
                  </div>
                  <span style={{
                    fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px",
                    background: `linear-gradient(135deg, #fff 30%, ${t.color})`,
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>{t.value}</span>
                  <span style={{ fontSize: 12, color: "#555", fontWeight: 500 }}>{t.label}</span>
                </div>
                <div style={{ width: 4, height: 4, borderRadius: 1, background: "rgba(255,255,255,0.1)", transform: "rotate(45deg)", flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      </div>

      {hideSocialProofCtaOnLocalhost ? null : (
      <div className="section-container" style={{ textAlign: "center", position: "relative" }}>

        {heavyOk ? (
          <div
            className="sp-glow-blob"
            style={{
              position: "absolute", top: "50%", left: "50%",
              width: 500, height: 300, borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(0,212,255,0.12) 0%, rgba(139,92,246,0.06) 50%, transparent 75%)",
              pointerEvents: "none", filter: "blur(30px)",
            }}
          />
        ) : null}

        <div
          className={`landing-eyebrow-pill landing-eyebrow-pill--green sr-from-y sr-from-y-tight sr-ease ${iv ? "sr-inview" : ""}`}
          style={{ marginBottom: 24, position: "relative", transitionDelay: reducedHook ? "0s" : "0.1s" }}
        >
          <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 10, height: 10 }}>
            <span
              className="landing-eyebrow-dot--green"
              style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "block", position: "relative", zIndex: 1 }}
            />
            {heavyOk ? <span className="sp-status-ping" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(34,197,94,0.5)" }} /> : null}
          </span>
          <span className="landing-eyebrow-pill-label" style={{ letterSpacing: "0.14em" }}>Uzivo</span>
        </div>

        <div
          className={`sr-scale-up ${iv ? "sr-inview" : ""}`}
          style={{ position: "relative", lineHeight: 1, marginBottom: 12, "--sr-delay": reducedHook ? "0s" : "0.2s" } as CSSProperties}
        >
          <span style={{
            fontSize: "clamp(90px, 18vw, 160px)",
            fontWeight: 900,
            letterSpacing: "-4px",
            background: "linear-gradient(135deg, #ffffff 0%, #00d4ff 45%, #8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            display: "inline-block",
            fontVariantNumeric: "tabular-nums",
          }}>
            {waitlist}
          </span>
          <span style={{
            fontSize: "clamp(50px, 10vw, 90px)",
            fontWeight: 900,
            background: "linear-gradient(135deg, #00d4ff, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>+</span>
        </div>

        <div
          className={`landing-lede sr-fade ${iv ? "sr-inview" : ""}`}
          style={{ fontSize: "clamp(16px,2vw,18px)", marginBottom: 36, "--sr-delay": reducedHook ? "0s" : "0.4s", "--sr-d": "0.5s" } as CSSProperties}
        >
          osoba čeka na kurs
        </div>

        <div
          className={`sr-from-y sr-from-y-tight sr-ease ${iv ? "sr-inview" : ""}`}
          style={{ maxWidth: 440, marginLeft: "auto", marginRight: "auto", marginBottom: 32, transitionDelay: reducedHook ? "0s" : "0.5s" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: "#555" }}>
            <span>Lista cekanja</span>
            <span style={{ color: "#00d4ff", fontWeight: 600 }}>{waitlist}</span>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${barWidth}%`,
                borderRadius: 99,
                background: "linear-gradient(90deg, #00d4ff, #8b5cf6)",
                boxShadow: "0 0 10px rgba(0,212,255,0.5)",
                position: "relative",
                overflow: "hidden",
                transition: reducedHook ? "none" : "width 0.6s ease-out",
              }}
            >
              {heavyOk ? (
                <div
                  className="sp-bar-shimmer"
                  style={{
                    position: "absolute", inset: 0, borderRadius: 99,
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                    pointerEvents: "none",
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>

        <div
          className={`sr-from-y sr-from-y-tight sr-ease ${iv ? "sr-inview" : ""}`}
          style={{ transitionDelay: reducedHook ? "0s" : "0.65s" }}
        >
          <SkoolCtaButton label="Udji u AI Hype Academy" />
          <div style={{ marginTop: 12, fontSize: 12, color: "#3a3a3a" }}>
            Upis je otvoren danas.
          </div>
        </div>
      </div>
      )}
    </section>
  );
}
