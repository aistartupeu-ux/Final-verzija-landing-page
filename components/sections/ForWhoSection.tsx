"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Video, Users, Music2, Zap, ShoppingBag, Code2, TrendingUp, Sparkles } from "lucide-react";

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
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} style={{ position: "relative", zIndex: 10, padding: "100px 24px", textAlign: "center" }}>
      <div className="section-container" style={{ maxWidth: 1000 }}>
        <motion.div initial={{ opacity: 0, y: 25 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.15)",
            borderRadius: 50, padding: "6px 16px", marginBottom: 24,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4ff", boxShadow: "0 0 6px #00d4ff" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#00d4ff", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Šta ćeš naučiti</span>
          </div>

          <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 12 }}>
            Posle kursa znaćeš kako da{" "}
            <span style={{ color: "#00d4ff" }}>zaradiš od AI.</span>
          </h2>
          <p style={{ fontSize: 15, color: "#8a8a9a", maxWidth: 500, margin: "0 auto 52px", lineHeight: 1.7 }}>
            Konkretne veštine. Realni projekti. Bez teorije koja ti ne treba.
          </p>
        </motion.div>

        <style>{`.outcomes-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(min-width:640px){.outcomes-grid{grid-template-columns:repeat(3,1fr)}}@media(min-width:900px){.outcomes-grid{grid-template-columns:repeat(4,1fr)}}`}</style>
        <div className="outcomes-grid">
          {outcomes.map((o, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.05 + i * 0.05 }}
              className="card"
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
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6, lineHeight: 1.4 }}>{o.title}</h3>
              <p style={{ fontSize: 12, color: "#777", lineHeight: 1.65 }}>{o.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
