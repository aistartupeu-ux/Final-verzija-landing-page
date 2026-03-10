"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import EmailForm from "@/components/ui/EmailForm";

export default function FinalCTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} id="final-cta" style={{ position: "relative", zIndex: 10, padding: "140px 24px", textAlign: "center", overflow: "hidden" }}>
      {/* Dramatic background glow */}
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

      <div className="section-container" style={{ maxWidth: 660, position: "relative" }}>
        <motion.div initial={{ opacity: 0, y: 25 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.12)",
            borderRadius: 50, padding: "6px 16px", marginBottom: 28,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4ff", boxShadow: "0 0 6px #00d4ff" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#00d4ff", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Ne čekaj</span>
          </div>

          <h2 style={{
            fontSize: "clamp(34px, 6vw, 58px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 20,
            textShadow: "0 0 60px rgba(0,212,255,0.1)",
          }}>
            AI era <span className="gradient-text">ne čeka.</span>
          </h2>
          <p style={{ fontSize: 17, color: "#999", maxWidth: 500, margin: "0 auto 44px", lineHeight: 1.7 }}>
            Svaki dan čekanja je dan prednosti za nekog drugog. Ako želiš sistem
            koji te vodi od nule do pravih AI projekata. Kreni sada.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.15 }}>
          <EmailForm microcopy="10 sekundi. Bez spama." />
        </motion.div>
      </div>
    </section>
  );
}
