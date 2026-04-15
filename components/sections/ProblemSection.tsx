"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Compass, Puzzle, Palette, Banknote, Clock } from "lucide-react";
import { useInView } from "@/lib/use-in-view";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { SpotlightGlowCard } from "@/components/ui/spotlight-card";

const problems = [
  { icon: Compass, text: "Ne znaš odakle da kreneš" },
  { icon: Puzzle, text: "Ne znaš šta tačno da praviš" },
  { icon: Palette, text: "Ne znaš kako da to izgleda profesionalno" },
  { icon: Banknote, text: "Ne znaš kako da to pretvoriš u novac" },
  { icon: Clock, text: "Gubiš vreme na alate umesto na napredak" },
];

/** Sporija, cinematskija animacija stubaca (manji „rush“, premium feel). */
const CHART_BAR_DURATION_S = 1.55;
const CHART_BAR_STAGGER_S = 0.09;
const CHART_BAR_EASE = "cubic-bezier(0.22, 0.95, 0.28, 1)";

function Chart({ reduced }: { reduced: boolean }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [go, setGo] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setGo(true);
    }, { threshold: 0.2 });
    if (chartRef.current) o.observe(chartRef.current);
    return () => o.disconnect();
  }, []);

  const data = [10, 18, 28, 40, 52, 64, 75, 82];
  const labels = ["Ned 1", "Ned 2", "Ned 3", "Ned 4", "Ned 5", "Ned 6", "Ned 7", "Ned 8"];
  const anim = go || reduced;

  return (
    <SpotlightGlowCard glowColor="purple" className="w-full max-w-[400px] mx-auto">
      <div ref={chartRef} className="apple-chart-card" style={{ padding: "36px 28px", contain: "layout style" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(245,245,247,0.42)", margin: "0 0 8px" }}>
          Napredak
        </p>
        <h4 style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em", color: "#f5f5f7", margin: 0 }}>
          Tvoj put uz <span className="apple-accent-word">AI sistem</span>
        </h4>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 184, padding: "0 2px" }}>
        {data.map((v, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
            <div style={{ flex: 1, width: "100%", position: "relative", overflow: "hidden" }}>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "10%",
                  right: "10%",
                  height: "100%",
                  transformOrigin: "bottom",
                  transform: anim ? `scaleY(${v / 100})` : "scaleY(0.02)",
                  transition: reduced
                    ? "none"
                    : `transform ${CHART_BAR_DURATION_S}s ${CHART_BAR_EASE} ${i * CHART_BAR_STAGGER_S}s`,
                  background: "linear-gradient(to top, #00d4ff, #a855f7)",
                  borderRadius: 5,
                  boxShadow: anim ? `0 0 14px rgba(0,212,255,${0.12 + (v / 100) * 0.18})` : "none",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: "rgba(245,245,247,0.38)",
                marginTop: 10,
                whiteSpace: "nowrap",
                letterSpacing: "0.04em",
              }}
            >
              {labels[i]}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 1,
          marginTop: 28,
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid rgba(0,212,255,0.12)",
          background: "rgba(0,212,255,0.04)",
        }}
      >
        {[
          { l: "Početak", v: "10%", highlight: false },
          { l: "Danas", v: "82%", highlight: true },
          { l: "Rast", v: "+720%", highlight: false },
        ].map((s, idx) => (
          <div
            key={s.l}
            style={{
              textAlign: "center",
              padding: "14px 8px",
              background: s.highlight ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.03)",
              borderRight: idx < 2 ? "1px solid rgba(255,255,255,0.06)" : undefined,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "rgba(245,245,247,0.4)",
                marginBottom: 6,
              }}
            >
              {s.l}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                background: s.highlight ? "linear-gradient(135deg, #00d4ff, #a855f7)" : "none",
                WebkitBackgroundClip: s.highlight ? "text" : undefined,
                backgroundClip: s.highlight ? "text" : undefined,
                WebkitTextFillColor: s.highlight ? "transparent" : undefined,
                color: s.highlight ? undefined : "#f5f5f7",
              }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>
    </div>
    </SpotlightGlowCard>
  );
}

export default function ProblemSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });
  const reduced = useReducedMotion();
  const iv = inView || reduced;

  return (
    <section
      ref={ref}
      className={`landing-section-y--spacious${reduced ? " sr-nomotion" : ""}`}
      style={{ position: "relative", zIndex: 10, contain: "layout style" }}
    >
      <div className="section-container">
        <div className="problem-grid-apple">
          <div className={`sr-from-x-n sr-ease ${iv ? "sr-inview" : ""}`}>
            <div className="landing-eyebrow-pill landing-eyebrow-pill--problem">
              <span
                className="landing-eyebrow-dot landing-eyebrow-dot--problem"
                style={{ background: "#FFB547", boxShadow: "0 0 8px rgba(255,181,71,0.55)" }}
              />
              <span className="landing-eyebrow-pill-label">Problem</span>
            </div>

            <h2 className="apple-display">
              Svi pričaju o <span className="gradient-text">AI-ju.</span>
              <br />
              Malo ko zna kako da ga pretvori u <span className="apple-accent-word">novac.</span>
            </h2>

            <p className="apple-body">
              Internet je prepun tutorijala, alata i kurseva. Bez sistema sve to ostaje samo još jedna informacija.
            </p>

            <p className="apple-callout">AI nije problem. Problem je što nemaš sistem koji zarađuje.</p>

            <ul className="apple-list">
              {problems.map((p, i) => (
                <li
                  key={p.text}
                  className={`sr-from-x-item ${iv ? "sr-inview" : ""}`}
                  style={{ "--sr-delay": reduced ? "0s" : `${0.12 + i * 0.05}s` } as CSSProperties}
                >
                  <p.icon
                    className="apple-list-icon"
                    size={20}
                    strokeWidth={1.5}
                    color="rgba(248,113,113,0.85)"
                    aria-hidden
                  />
                  <span>{p.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`sr-from-x-p sr-from-x-p-delay sr-ease ${iv ? "sr-inview" : ""}`}>
            <Chart reduced={reduced} />
          </div>
        </div>
      </div>
    </section>
  );
}
