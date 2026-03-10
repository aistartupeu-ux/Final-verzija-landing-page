"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Sparkles } from "lucide-react";

const row1 = ["/examples/v1.mp4", "/examples/v2.mp4", "/examples/v3.mp4", "/examples/v4.mp4", "/examples/v5.mp4"];
const row2 = ["/examples/v6.mp4", "/examples/v7.mp4", "/examples/v8.mp4", "/examples/v9.mp4", "/examples/v10.mp4"];

function VideoCard({ src }: { src: string }) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: 200,
        height: 356,
        borderRadius: 18,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
        marginRight: 12,
        position: "relative",
        transition: "transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
        cursor: "default",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "scale(1.03)";
        e.currentTarget.style.borderColor = "rgba(0,212,255,0.35)";
        e.currentTarget.style.boxShadow = "0 0 30px rgba(0,212,255,0.12)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}

function VideoRow({ videos, reverse = false }: { videos: string[]; reverse?: boolean }) {
  const items = [...videos, ...videos];
  const animName = reverse ? "vsrow-r" : "vsrow-l";

  return (
    <div style={{
      overflow: "hidden",
      maskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
      WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
    }}>
      <style>{`
        @keyframes vsrow-l { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes vsrow-r { from { transform: translateX(-50%) } to { transform: translateX(0) } }
        .vs-track-l { display: flex; width: max-content; animation: vsrow-l 40s linear infinite; will-change: transform; }
        .vs-track-l:hover { animation-play-state: paused; }
        .vs-track-r { display: flex; width: max-content; animation: vsrow-r 36s linear infinite; will-change: transform; }
        .vs-track-r:hover { animation-play-state: paused; }
      `}</style>
      <div className={reverse ? "vs-track-r" : "vs-track-l"}>
        {items.map((src, i) => <VideoCard key={i} src={src} />)}
      </div>
    </div>
  );
}

export default function VideoShowcaseSection() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} style={{ position: "relative", zIndex: 10, padding: "100px 0", overflow: "hidden" }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 800, height: 400, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(139,92,246,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        style={{ textAlign: "center", padding: "0 24px", marginBottom: 48, position: "relative" }}
      >
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.18)",
          borderRadius: 50, padding: "6px 16px", marginBottom: 20,
        }}>
          <Sparkles size={12} color="#a855f7" />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#a855f7", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Primeri radova</span>
        </div>
        <h2 style={{ fontSize: "clamp(26px,5vw,44px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 10 }}>
          Ovo ces praviti{" "}
          <span style={{ color: "#a855f7" }}>unutar kursa.</span>
        </h2>
        <p style={{ fontSize: 15, color: "#8a8a9a", maxWidth: 440, margin: "0 auto", lineHeight: 1.7 }}>
          Sve je napravljeno pomocu AI alata koje ces nauciti. Bez prethodnog iskustva.
        </p>
      </motion.div>

      {/* Row 1 — scrolls left */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.7, delay: 0.2 }}
        style={{ marginBottom: 12 }}
      >
        <VideoRow videos={row1} />
      </motion.div>

      {/* Row 2 — scrolls right */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.7, delay: 0.35 }}
      >
        <VideoRow videos={row2} reverse />
      </motion.div>
    </section>
  );
}
