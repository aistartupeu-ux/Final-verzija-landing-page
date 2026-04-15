"use client";

import { useRef, type CSSProperties } from "react";
import { Lightbulb, Bot, FileVideo, TrendingUp, DollarSign, ChevronRight, GraduationCap, Wrench, BarChart3, Award, Layers } from "lucide-react";
import { useInView } from "@/lib/use-in-view";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const flow = [
  { icon: Lightbulb, label: "Ideja", color: "#fbbf24" },
  { icon: Bot, label: "AI", color: "#00d4ff" },
  { icon: FileVideo, label: "Sadržaj", color: "#a855f7" },
  { icon: TrendingUp, label: "Rast", color: "#22c55e" },
  { icon: DollarSign, label: "Prihod", color: "#00d4ff" },
];

const points = [
  { icon: GraduationCap, text: "Te uči kako da kreiraš AI influensere i cinematic videe" },
  { icon: Wrench, text: "Pokazuje kako da koristiš AI alate bez konfuzije i gubljenja vremena" },
  { icon: Layers, text: "Pomaže ti da organizuješ rad i ubrzaš produkciju" },
  { icon: BarChart3, text: "Uči te kako da sve to pretvoriš u realan prihod" },
  { icon: Award, text: "Na kraju ti daje sertifikat koji potvrđuje tvoje znanje" },
];

export default function SolutionSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });
  const reduced = useReducedMotion();
  const iv = inView || reduced;

  return (
    <section ref={ref} className={`landing-section-y--spacious${reduced ? " sr-nomotion" : ""}`} style={{ position: "relative", zIndex: 10 }}>
      <div className="section-container">
        <div className={`landing-section-head sr-from-y sr-from-y-xl sr-ease ${iv ? "sr-inview" : ""}`}>
          <div className="landing-eyebrow-pill landing-eyebrow-pill--cyan">
            <span
              className="landing-eyebrow-dot landing-eyebrow-dot--cyan"
              style={{ background: "#00d4ff", boxShadow: "0 0 8px rgba(0,212,255,0.45)" }}
            />
            <span className="landing-eyebrow-pill-label">Rešenje</span>
          </div>

          <h2 className="apple-display landing-measure-copy" style={{ maxWidth: "22ch" }}>
            AI Hype Academy je tvoj{" "}
            <span className="gradient-text">unfair advantage.</span>
          </h2>

          <p className="apple-solution-lede">
            Nije još jedan kurs. Ovo je operativni sistem koji te vodi od nule do pravih rezultata.
          </p>
        </div>

        <div
          className={`apple-steps-wrap sr-from-y sr-from-y-tight sr-ease ${iv ? "sr-inview" : ""}`}
          style={{ transitionDelay: reduced ? "0s" : "0.12s" }}
        >
          {flow.map((s, i) => (
            <div key={s.label} className="apple-step-cluster">
              <div
                className={`sr-scale-pop ${iv ? "sr-inview" : ""}`}
                style={{ "--sr-delay": reduced ? "0s" : `${0.15 + i * 0.08}s` } as CSSProperties}
              >
                <div className="apple-step-node">
                  <div
                    className="apple-step-icon"
                    style={{
                      background: `linear-gradient(145deg, ${s.color}18, ${s.color}08)`,
                      border: `1px solid ${s.color}40`,
                      boxShadow: `0 4px 24px ${s.color}18`,
                    }}
                  >
                    <s.icon size={22} color={s.color} strokeWidth={1.65} aria-hidden />
                  </div>
                  <span className="apple-step-label" style={{ color: s.color }}>
                    {s.label}
                  </span>
                </div>
              </div>
              {i < flow.length - 1 && (
                <div
                  className={`apple-chevron sr-fade ${iv ? "sr-inview" : ""}`}
                  style={{ "--sr-delay": reduced ? "0s" : `${0.22 + i * 0.08}s`, "--sr-d": "0.28s" } as CSSProperties}
                  aria-hidden
                >
                  <ChevronRight size={14} color="rgba(0,212,255,0.35)" strokeWidth={2} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          className={`landing-measure-narrow sr-from-y sr-from-y-tight sr-ease ${iv ? "sr-inview" : ""}`}
          style={{ transitionDelay: reduced ? "0s" : "0.35s" }}
        >
          <p className="apple-solution-subhead">Ovo je sistem koji:</p>
          <ul className="apple-list" style={{ maxWidth: "none" }}>
            {points.map((p, i) => (
              <li
                key={p.text}
                className={`sr-from-x-item ${iv ? "sr-inview" : ""}`}
                style={{ "--sr-delay": reduced ? "0s" : `${0.4 + i * 0.06}s` } as CSSProperties}
              >
                <p.icon className="apple-list-icon" size={20} color="#00d4ff" strokeWidth={1.5} aria-hidden />
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
