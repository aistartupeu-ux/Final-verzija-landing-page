"use client";

import { useRef } from "react";
import { BookOpen, Image, Film, Flame, Settings, Music, Code, DollarSign } from "lucide-react";
import { useInView } from "@/lib/use-in-view";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const modules = [
  { icon: BookOpen, title: "Osnove", desc: "Temelji AI sveta — razumi kako AI funkcioniše i gde su prilike", color: "#00d4ff" },
  { icon: Image, title: "AI Slika & Video", desc: "Kreiraj profesionalne vizuale i video sadržaje sa AI alatima", color: "#a855f7" },
  { icon: Film, title: "Cinema Produkcija", desc: "Cinematic videi filmskog kvaliteta uz AI — od ideje do finala", color: "#f97316" },
  { icon: Flame, title: "Viralni Sistemi", desc: "Sistemi za kreiranje sadržaja koji dobijaju preglede i engagement", color: "#ef4444" },
  { icon: Settings, title: "Automatizacija", desc: "Automatizuj poslovne procese i povećaj produktivnost", color: "#22c55e" },
  { icon: Music, title: "AI Muzika", desc: "Generiši glasove, muziku i zvučne efekte pomoću AI-a", color: "#ec4899" },
  { icon: Code, title: "Vibe Coding", desc: "Kodiranje uz pomoć AI uz moderne pristupe i alate", color: "#6366f1" },
  { icon: DollarSign, title: "Monetizacija", desc: "Pretvori veštine u prihod kroz AI servise i produkte", color: "#facc15" },
];

export default function ModulesSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const reduced = useReducedMotion();
  const iv = inView || reduced;

  return (
    <section ref={ref} id="program" className={reduced ? "sr-nomotion" : undefined} style={{ position: "relative", zIndex: 10, padding: "120px 24px", textAlign: "center" }}>
      <div className="section-container">
        <div className={`sr-from-y sr-from-y-xl sr-ease ${iv ? "sr-inview" : ""}`}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)",
            borderRadius: 50, padding: "6px 16px", marginBottom: 24,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", boxShadow: "0 0 6px #a855f7" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#a855f7", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Program</span>
          </div>

          <h2 style={{ fontSize: "clamp(30px, 5vw, 50px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 12 }}>
            Šta tačno dobijaš <span style={{ color: "#00d4ff" }}>unutra?</span>
          </h2>
          <p style={{ fontSize: 15, color: "#8a8a9a", maxWidth: 480, margin: "0 auto 52px", lineHeight: 1.7 }}>
            Jasna struktura. Logičan redosled. Fokus na rezultate, ne na teoriju.
          </p>
        </div>

        <style>{`.mod-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(min-width:640px){.mod-grid{grid-template-columns:repeat(3,1fr);gap:16px}}@media(min-width:900px){.mod-grid{grid-template-columns:repeat(4,1fr);gap:16px}}`}</style>
        <div className={`mod-grid sr-outcomes ${iv ? "sr-inview" : ""}`}>
          {modules.map((m, i) => (
            <div key={i} className="card outcome-card-sr" style={{ padding: "24px 20px", textAlign: "left", position: "relative", overflow: "hidden" }}>

              <div style={{
                position: "absolute", top: 12, right: 14,
                fontWeight: 800, color: "rgba(255,255,255,0.06)",
                fontVariantNumeric: "tabular-nums",
                fontSize: 36, lineHeight: 1,
              }}>
                {String(i + 1).padStart(2, "0")}
              </div>

              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: `${m.color}10`, border: `1px solid ${m.color}20`,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
                position: "relative", zIndex: 1,
              }}>
                <m.icon size={20} color={m.color} strokeWidth={1.8} />
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6, position: "relative", zIndex: 1 }}>{m.title}</h3>
              <p style={{ fontSize: 12, color: "#888", lineHeight: 1.65, position: "relative", zIndex: 1 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
