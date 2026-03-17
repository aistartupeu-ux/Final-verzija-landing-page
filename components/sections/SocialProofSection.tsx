"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Eye, Users, Play, BookOpen, Award, Zap } from "lucide-react";
import { useLowEndDevice } from "@/components/ui/useLowEndDevice";

// ── Waitlist: startujemo od ~1200 ljudi, max ~50 dnevno, kroz ceo dan po +1 do +3 ──
const START_DATE = new Date(2026, 2, 11, 0, 0, 0); // 11. mart 2026
const START_VALUE = 1200;

// ── Progress bar: krece malo vise od pola (58%), puni se do zadnjeg sata/minuta/sekunde ──
const COUNTDOWN_END = new Date(2026, 3, 15, 0, 0, 0); // 15. april 00:00 — kurs se otvara, isti kao Hero
const BAR_START_PCT = 58;

function getBarProgress(): number {
  if (typeof window === "undefined") return BAR_START_PCT;
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

/** Dnevni limit: max 40 ljudi (deterministički po danu) */
function getDailyLimit(dayIndex: number): number {
  const base = 25;      // minimalno 25
  const spread = 16;    // 25–40 ljudi dnevno
  return base + ((dayIndex * 7919 + 31) % spread);
}

/** Ease-in-out za glatak rast kroz dan */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function getWaitlistCount(): number {
  if (typeof window === "undefined") return START_VALUE;
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

  // Ne dozvoljavamo da broj ide unazad u ovom browseru:
  // upoređujemo sa lokalno sačuvanim maksimumom i uvek vraćamo veću vrednost.
  try {
    const key = "aha_waitlist_max_v1";
    const storedRaw = window.localStorage.getItem(key);
    const stored = storedRaw ? parseInt(storedRaw, 10) : NaN;
    const safe = Number.isFinite(stored) ? Math.max(computed, stored) : computed;
    window.localStorage.setItem(key, String(safe));
    return safe;
  } catch {
    return computed;
  }
}

// ── Ticker data ───────────────────────────────────────────────────────────────
const ticks = [
  { icon: Eye,      value: "2.1M+", label: "Pregleda",    color: "#00d4ff" },
  { icon: Users,    value: "48K+",  label: "Pratilaca",   color: "#a855f7" },
  { icon: Play,     value: "30+",   label: "Sati lekcija",color: "#ec4899" },
  { icon: BookOpen, value: "8",     label: "Modula",      color: "#f97316" },
  { icon: Award,    value: "1",     label: "Nagrada",     color: "#facc15" },
  { icon: Zap,      value: "100%",  label: "Prakticno",   color: "#22c55e" },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function SocialProofSection() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: false, amount: 0.15 });
  const reduced = useReducedMotion();
  const lowEnd = useLowEndDevice();
  const heavyOk = inView && !reduced && !lowEnd;

  const [waitlist, setWaitlist] = useState(START_VALUE);
  const [barProgress, setBarProgress] = useState(BAR_START_PCT);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setWaitlist(getWaitlistCount());
    setMounted(true);
  }, []);

  // Osveži svakih 2–4 min da broj raste po +1 do +3 kroz dan
  useEffect(() => {
    if (!mounted) return;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      setWaitlist(getWaitlistCount());
      t = setTimeout(tick, 120000 + Math.random() * 120000);
    };
    t = setTimeout(tick, 60000 + Math.random() * 60000);
    return () => clearTimeout(t);
  }, [mounted]);

  // Progress bar: osvežava svake sekunde (do zadnjeg sata, minuta, sekunde → 100%)
  useEffect(() => {
    setBarProgress(getBarProgress());
    // When offscreen / low-end: refresh less frequently to reduce main-thread work.
    const ms = heavyOk ? 1000 : 10000;
    const i = setInterval(() => setBarProgress(getBarProgress()), ms);
    return () => clearInterval(i);
  }, [heavyOk]);

  // Duplicate for seamless loop
  const tickItems = heavyOk ? [...ticks, ...ticks, ...ticks] : ticks;

  return (
    <section ref={ref} style={{ position: "relative", zIndex: 10, padding: "80px 0 100px", overflow: "hidden", contentVisibility: "auto", containIntrinsicSize: "auto 600px" }}>

      {/* ── TICKER TAPE ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
        style={{
          borderTop:    "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background:   "rgba(255,255,255,0.015)",
          padding: "14px 0",
          marginBottom: 80,
          maskImage:        "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
          WebkitMaskImage:  "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
          overflow: "hidden",
        }}
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
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 28, paddingRight: 40, flexShrink: 0 }}>
                {/* Stat pill */}
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
                {/* Diamond divider */}
                <div style={{ width: 4, height: 4, borderRadius: 1, background: "rgba(255,255,255,0.1)", transform: "rotate(45deg)", flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── GIANT WAITLIST NUMBER ─────────────────────────────────────────── */}
      <div style={{ textAlign: "center", position: "relative", padding: "0 24px" }}>

        {/* Breathing glow blob */}
        {heavyOk ? (
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.65, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 500, height: 300, borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(0,212,255,0.12) 0%, rgba(139,92,246,0.06) 50%, transparent 75%)",
              pointerEvents: "none", filter: "blur(30px)",
            }}
          />
        ) : null}

        {/* UZIVO badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24, position: "relative" }}
        >
          <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 10, height: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "block", position: "relative", zIndex: 1 }} />
            {heavyOk ? (
              <motion.span
                animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(34,197,94,0.5)" }}
              />
            ) : null}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", textTransform: "uppercase" as const, letterSpacing: "0.18em" }}>Uzivo</span>
        </motion.div>

        {/* Giant number */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.92 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{ position: "relative", lineHeight: 1, marginBottom: 12 }}
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
        </motion.div>

        {/* Label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{ fontSize: "clamp(15px,2vw,18px)", color: "#666", marginBottom: 36, fontWeight: 400 }}
        >
          osoba ceka na kurs
        </motion.div>

        {/* Progress bar — aktivira se dok brojke rastu, krece od 58%, puni do zadnjeg sata/minuta/sekunde */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{ maxWidth: 440, margin: "0 auto 32px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12, color: "#555" }}>
            <span>Lista cekanja</span>
            <span style={{ color: "#00d4ff", fontWeight: 600 }}>{waitlist}</span>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <motion.div
              initial={{ width: `${BAR_START_PCT}%` }}
              animate={inView ? { width: `${barProgress}%` } : { width: `${BAR_START_PCT}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                height: "100%", borderRadius: 99,
                background: "linear-gradient(90deg, #00d4ff, #8b5cf6)",
                boxShadow: "0 0 10px rgba(0,212,255,0.5)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <motion.div
                animate={{ opacity: [0.1, 0.35, 0.1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute", inset: 0, borderRadius: 99,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                  pointerEvents: "none",
                }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.65 }}
        >
          <a
            href="#"
            onClick={e => { e.preventDefault(); document.querySelector("input[type=email]")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "16px 44px", borderRadius: 14, fontSize: 15, fontWeight: 700,
              background: "linear-gradient(135deg, #00d4ff, #7c3aed)",
              color: "#fff", textDecoration: "none", cursor: "pointer",
              boxShadow: "0 0 40px rgba(0,212,255,0.2), 0 0 80px rgba(124,58,237,0.1)",
              transition: "transform .2s, box-shadow .2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 6px 50px rgba(0,212,255,0.35), 0 0 80px rgba(124,58,237,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 0 40px rgba(0,212,255,0.2), 0 0 80px rgba(124,58,237,0.1)"; }}
          >
            Obezbedi svoje mesto
          </a>
          <div style={{ marginTop: 12, fontSize: 12, color: "#3a3a3a" }}>
            Prijava traje 10 sekundi. Bez kreditne kartice.
          </div>
        </motion.div>
      </div>
    </section>
  );
}
