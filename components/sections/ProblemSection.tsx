"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Compass, Puzzle, Palette, Banknote, Clock } from "lucide-react";

const problems = [
  { icon: Compass, text: "Ne znaš odakle da kreneš" },
  { icon: Puzzle, text: "Ne znaš šta tačno da praviš" },
  { icon: Palette, text: "Ne znaš kako da to izgleda profesionalno" },
  { icon: Banknote, text: "Ne znaš kako da to pretvoriš u novac" },
  { icon: Clock, text: "Gubiš vreme na alate umesto na napredak" },
];

function Chart({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [go, setGo] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setGo(true); }, { threshold: 0.2 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);

  const data = [10, 18, 28, 40, 52, 64, 75, 82];
  const labels = ["Ned 1", "Ned 2", "Ned 3", "Ned 4", "Ned 5", "Ned 6", "Ned 7", "Ned 8"];
  const anim = go || reduced;

  return (
    <div ref={ref} style={{
      padding: "32px 28px", borderRadius: 24,
      background: "linear-gradient(145deg, rgba(0,212,255,0.04) 0%, rgba(124,58,237,0.04) 100%)",
      border: "1px solid rgba(0,212,255,0.12)",
      boxShadow: "0 4px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.02)",
      contain: "layout style",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 28 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00d4ff", boxShadow: "0 0 8px rgba(0,212,255,0.5)" }} />
        <h4 style={{ fontSize: 18, fontWeight: 700 }}>Tvoj napredak uz AI sistem</h4>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 190, padding: "0 4px" }}>
        {data.map((v, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
            <div style={{ flex: 1, width: "100%", position: "relative", overflow: "hidden" }}>
              <div style={{
                position: "absolute", bottom: 0, left: "8%", right: "8%", height: "100%",
                transformOrigin: "bottom",
                transform: anim ? `scaleY(${v / 100})` : "scaleY(0.02)",
                transition: reduced ? "none" : `transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.04}s`,
                background: `linear-gradient(to top, #00d4ff, #9333ea)`,
                borderRadius: "5px 5px 1px 1px",
                boxShadow: anim ? `0 0 12px rgba(0,212,255,${0.15 + (v / 100) * 0.2})` : "none",
              }} />
            </div>
            <span style={{ fontSize: 9, color: "#555", marginTop: 8, whiteSpace: "nowrap", letterSpacing: "0.02em" }}>{labels[i]}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 24 }}>
        {[
          { l: "Početni nivo", v: "10%", c: "#8a8a9a" },
          { l: "Trenutni nivo", v: "82%", c: "#00d4ff" },
          { l: "Napredak", v: "+720%", c: "#a855f7" },
        ].map(s => (
          <div key={s.l} style={{
            textAlign: "center", padding: "12px 8px", borderRadius: 14,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontSize: 10, color: "#666", letterSpacing: "0.03em", marginBottom: 4 }}>{s.l}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const t = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

export default function ProblemSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });
  const reduced = useReducedMotion();

  return (
    <section ref={ref} style={{ position: "relative", zIndex: 10, padding: "120px 24px", contain: "layout style" }}>
      <div className="section-container">
        <style>{`@media(min-width:768px){.problem-grid{grid-template-columns:1fr 1fr !important; gap: 56px !important}}`}</style>
        <div className="problem-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, alignItems: "center" }}>
          <motion.div
            initial={{ opacity: reduced ? 1 : 0, x: reduced ? 0 : -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={t}
          >

            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
              borderRadius: 50, padding: "6px 16px", marginBottom: 24,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#ef4444", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Problem</span>
            </div>

            <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
              Svi pričaju o <span style={{ color: "#00d4ff", fontWeight: 800 }}>AI-ju.</span> Malo ko zna kako da ga pretvori u novac.
            </h2>
            <p style={{ fontSize: 15, color: "#8a8a9a", lineHeight: 1.7, marginBottom: 28, maxWidth: 480 }}>
              Internet je prepun tutorijala, alata i kurseva.
              <br />
              Ali bez sistema sve to ostaje samo još jedna informacija.
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 24, lineHeight: 1.4 }}>
              AI nije problem. Problem je što nemaš sistem koji zarađuje.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {problems.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: reduced ? 1 : 0, x: reduced ? 0 : -14 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: reduced ? 0 : 0.15 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <p.icon size={16} color="#ef4444" strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: 14, color: "#999", lineHeight: 1.5 }}>{p.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: reduced ? 1 : 0, x: reduced ? 0 : 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...t, delay: 0.08 }}
          >
            <Chart reduced={!!reduced} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
