"use client";

import { useRef } from "react";
import { Video, Users, Music2, Zap, ShoppingBag, Code2, TrendingUp, Sparkles } from "lucide-react";
import { useInView } from "@/lib/use-in-view";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const outcomes = [
  { icon: Users, color: "#00d4ff", title: "Kreirati AI influensera od nule", desc: "Potpuno virtuelni karakter koji gradi publiku i prihod" },
  { icon: Video, color: "#a855f7", title: "Praviti filmske video produkcije", desc: "Cinematic AI video filmskog kvaliteta bez opreme" },
  { icon: Music2, color: "#ec4899", title: "Generisati muziku i glasove", desc: "Originalni zvuk, glasovi i efekti pomoću AI alata" },
  { icon: Zap, color: "#22c55e", title: "Automatizovati poslovne procese", desc: "Uštedi sate rada svaki dan uz pametnu automatizaciju" },
  { icon: TrendingUp, color: "#ef4444", title: "Graditi viralni sadržaj", desc: "Sistemi koji donose preglede i engagement na svakoj platformi" },
  { icon: Code2, color: "#6366f1", title: "Kodirati uz pomoć AI", desc: "Pravi aplikacije i alate bez prethodnog iskustva u kodiranju" },
  { icon: ShoppingBag, color: "#f97316", title: "Prodavati AI usluge online", desc: "Ponudi agencijama, brendovima i klijentima iz celog sveta" },
  { icon: Sparkles, color: "#facc15", title: "Monetizovati svoja znanja", desc: "Pretvori veštine u prihod kroz produkte, kurseve i servise" },
];

export default function ForWhoSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const reduced = useReducedMotion();
  const iv = inView || reduced;

  return (
    <section
      ref={ref}
      className={`landing-section-y${reduced ? " sr-nomotion" : ""}`}
      style={{ position: "relative", zIndex: 10, textAlign: "center" }}
    >
      <div className="section-container">
        <div className={`landing-section-head sr-from-y sr-from-y-xl sr-ease ${iv ? "sr-inview" : ""}`}>
          <div className="landing-eyebrow-pill landing-eyebrow-pill--cyan">
            <span
              className="landing-eyebrow-dot landing-eyebrow-dot--cyan"
              style={{ background: "#00d4ff", boxShadow: "0 0 8px rgba(0,212,255,0.45)" }}
            />
            <span className="landing-eyebrow-pill-label">Šta ćeš naučiti</span>
          </div>

          <h2 className="landing-display">
            Posle kursa znaćeš kako da <span className="gradient-text">zaradiš od AI.</span>
          </h2>
          <p className="landing-lede landing-measure-copy" style={{ marginBottom: 52 }}>
            Konkretne veštine. Realni projekti. Bez teorije koja ti ne treba.
          </p>
        </div>

        <style>{`.outcomes-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(min-width:640px){.outcomes-grid{grid-template-columns:repeat(3,1fr)}}@media(min-width:900px){.outcomes-grid{grid-template-columns:repeat(4,1fr)}}`}</style>
        <div className={`outcomes-grid sr-outcomes ${iv ? "sr-inview" : ""}`}>
          {outcomes.map((o, i) => (
            <div
              key={i}
              className="card outcome-card-sr"
              style={{ padding: "24px 20px", textAlign: "left", position: "relative", overflow: "hidden" }}
            >
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${o.color}, transparent)`,
              }} />
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: `${o.color}10`, border: `1px solid ${o.color}20`,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
              }}>
                <o.icon size={20} color={o.color} strokeWidth={1.8} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", color: "#f5f5f7", marginBottom: 8, lineHeight: 1.4 }}>{o.title}</h3>
              <p style={{ fontSize: 14, color: "rgba(245,245,247,0.52)", lineHeight: 1.55 }}>{o.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
