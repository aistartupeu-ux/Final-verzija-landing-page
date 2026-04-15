"use client";

import { useRef, type CSSProperties } from "react";
import SkoolCtaButton from "@/components/ui/SkoolCtaButton";
import { useInView } from "@/lib/use-in-view";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export default function FinalCTASection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const reduced = useReducedMotion();
  const iv = inView || reduced;

  return (
    <section
      ref={ref}
      id="final-cta"
      className={`landing-section-y--spacious${reduced ? " sr-nomotion" : ""}`}
      style={{ position: "relative", zIndex: 10, textAlign: "center", overflow: "hidden" }}
    >
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, rgba(124,58,237,0.03) 40%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "40%", left: "30%", width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.04), transparent 70%)",
        pointerEvents: "none", filter: "blur(40px)",
      }} />

      <div className="section-container landing-measure-cta" style={{ position: "relative" }}>
        <div className={`landing-section-head sr-from-y sr-from-y-xl sr-ease ${iv ? "sr-inview" : ""}`}>
          <div className="landing-eyebrow-pill landing-eyebrow-pill--cyan">
            <span
              className="landing-eyebrow-dot landing-eyebrow-dot--cyan"
              style={{ background: "#00d4ff", boxShadow: "0 0 10px rgba(0,212,255,0.5)" }}
            />
            <span className="landing-eyebrow-pill-label">Ne čekaj</span>
          </div>

          <h2 className="landing-display" style={{ fontSize: "clamp(2.125rem, 5.5vw, 3.5rem)", marginBottom: 20, textShadow: "0 0 48px rgba(0,212,255,0.12)" }}>
            AI era <span className="gradient-text">ne čeka.</span>
          </h2>
          <p className="landing-lede landing-measure-copy" style={{ marginBottom: 44 }}>
            Svaki dan čekanja je dan prednosti za nekog drugog. Ako želiš sistem koji te vodi od nule do pravih AI projekata — kreni sada.
          </p>
        </div>
        <div
          className={`sr-from-y sr-from-y-tight sr-ease ${iv ? "sr-inview" : ""}`}
          style={{ transitionDelay: reduced ? "0s" : "0.15s" } as CSSProperties}
        >
          <SkoolCtaButton />
        </div>
      </div>
    </section>
  );
}
