"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ShieldCheck } from "lucide-react";

export default function GuaranteeSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} style={{ position: "relative", zIndex: 10, padding: "100px 24px", textAlign: "center" }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="section-container" style={{ maxWidth: 680, position: "relative" }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.7 }}
          style={{
            padding: "56px 40px", borderRadius: 28, position: "relative", overflow: "hidden",
            background: "linear-gradient(145deg, rgba(0,212,255,0.04), rgba(124,58,237,0.03))",
            border: "1px solid rgba(0,212,255,0.15)",
            boxShadow: "0 8px 60px rgba(0,0,0,0.3), 0 0 80px rgba(0,212,255,0.03)",
          }}>

          <div style={{
            position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,212,255,0.06), transparent 70%)",
            pointerEvents: "none",
          }} />

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            style={{
              width: 76, height: 76, borderRadius: 22, margin: "0 auto 24px",
              background: "linear-gradient(145deg, rgba(0,212,255,0.12), rgba(0,212,255,0.04))",
              border: "1px solid rgba(0,212,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 30px rgba(0,212,255,0.1)",
            }}
          >
            <ShieldCheck size={36} color="#00d4ff" strokeWidth={1.8} />
          </motion.div>

          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, letterSpacing: "0.02em" }}>BEZ RIZIKA.</h2>
          <p style={{ fontSize: 16, color: "#aaa", marginBottom: 8, lineHeight: 1.6 }}>
            Uđi bez straha. Ostaješ samo ako vidiš vrednost.
          </p>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#00d4ff" }}>
            Jedini rizik je da ne probaš.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
