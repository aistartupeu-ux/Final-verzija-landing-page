"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Lightbulb, Bot, FileVideo, TrendingUp, DollarSign, ChevronRight, GraduationCap, Wrench, BarChart3, Award, Layers } from "lucide-react";

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
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });

  return (
    <section ref={ref} style={{ position: "relative", zIndex: 10, padding: "120px 24px", textAlign: "center" }}>
      <div className="section-container">
        <motion.div initial={{ opacity: 0, y: 25 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.12)",
            borderRadius: 50, padding: "6px 16px", marginBottom: 24,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4ff", boxShadow: "0 0 6px #00d4ff" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#00d4ff", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Rešenje</span>
          </div>

          <h2 style={{ fontSize: "clamp(30px, 5vw, 50px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>
            AI Hype Academy je tvoj <span className="gradient-text">unfair advantage.</span>
          </h2>
          <p style={{ fontSize: 16, color: "#8a8a9a", maxWidth: 540, margin: "0 auto 56px", lineHeight: 1.7 }}>
            Nije još jedan kurs. Ovo je operativni sistem koji te vodi od nule do pravih rezultata.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.15 }}
          style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 64 }}>
          {flow.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
              >
                <div style={{
                  width: 68, height: 68, borderRadius: 20,
                  background: `linear-gradient(145deg, ${s.color}12, ${s.color}06)`,
                  border: `1px solid ${s.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 4px 20px ${s.color}10`,
                  transition: "all 0.3s ease",
                }}>
                  <s.icon size={28} color={s.color} strokeWidth={1.8} />
                </div>
                <span style={{ fontSize: 12, color: "#aaa", fontWeight: 600, letterSpacing: "0.03em" }}>{s.label}</span>
              </motion.div>
              {i < flow.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                  style={{ marginBottom: 24 }}
                >
                  <ChevronRight size={18} color="rgba(0,212,255,0.25)" />
                </motion.div>
              )}
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.4 }}
          style={{ textAlign: "left", maxWidth: 580, margin: "0 auto" }}>
          <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: "#fff" }}>Ovo je sistem koji:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {points.map((p, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -15 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.35, delay: 0.45 + i * 0.07 }}
                style={{ display: "flex", alignItems: "center", gap: 14 }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <p.icon size={16} color="#00d4ff" strokeWidth={2} />
                </div>
                <span style={{ fontSize: 14, color: "#999", lineHeight: 1.6 }}>{p.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
