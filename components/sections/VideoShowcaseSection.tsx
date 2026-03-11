"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";

/* Red 1: v11–v17 (bez v15 — .mov nije podržan) | Red 2: v1–v10. Samo videi koji postoje i rade. */
const row1 = ["/examples/V11.mp4", "/examples/v12.mp4", "/examples/v13.mp4", "/examples/v14.mp4", "/examples/v16.mp4", "/examples/v17.mp4"];
const row2 = ["/examples/v1.mp4", "/examples/v2.mp4", "/examples/v3.mp4", "/examples/v4.mp4", "/examples/v5.mp4", "/examples/v6.mp4", "/examples/v7.mp4", "/examples/v8.mp4", "/examples/v9.mp4", "/examples/v10.mp4"];

function VideoCard({ src }: { src: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    const video = videoRef.current;
    if (!card || !video || failed) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.3, rootMargin: "80px" }
    );
    io.observe(card);
    return () => io.disconnect();
  }, [failed]);

  return (
    <div
      ref={cardRef}
      className="video-card"
      style={{
        flexShrink: 0,
        borderRadius: 18,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
        marginRight: 12,
        position: "relative",
        contain: "layout",
        transition: "transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
        cursor: "default",
        background: "rgba(5,5,12,0.6)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "scale(1.03) translateZ(0)";
        e.currentTarget.style.borderColor = "rgba(0,212,255,0.35)";
        e.currentTarget.style.boxShadow = "0 0 30px rgba(0,212,255,0.12)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "scale(1) translateZ(0)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {failed ? (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Image src="/logo.png" alt="AI Hype Academy" width={120} height={40} style={{ width: "auto", height: "auto", maxWidth: "100%", opacity: 0.5 }} />
        </div>
      ) : (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
    </div>
  );
}

const DRAG_CLAMP = 120;
const DRAG_SNAP_MS = 180;

function VideoRow({ videos, reverse = false, paused = false }: { videos: string[]; reverse?: boolean; paused?: boolean }) {
  const items = [...videos, ...videos];
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const lastX = useRef(0);

  const onTouchStart = (e: React.TouchEvent) => {
    lastX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - lastX.current;
    lastX.current = e.touches[0].clientX;
    setDragOffset(prev => Math.max(-DRAG_CLAMP, Math.min(DRAG_CLAMP, prev + dx)));
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    setDragOffset(0);
  };

  return (
    <div
      style={{
        overflow: "hidden",
        contain: "layout paint",
        margin: "0 24px",
        maskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
        touchAction: "pan-y",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <style>{`
        .video-card { width: 200px; height: 356px; }
        @media (max-width: 640px) { .video-card { width: 170px; height: 302px; } }
        @media (min-width: 641px) and (max-width: 768px) { .video-card { width: 185px; height: 329px; } }
        @keyframes vsrow-l { from { transform: translate3d(0,0,0) } to { transform: translate3d(-50%,0,0) } }
        @keyframes vsrow-r { from { transform: translate3d(-50%,0,0) } to { transform: translate3d(0,0,0) } }
        .vs-track-l, .vs-track-r {
          display: flex; width: max-content;
          backface-visibility: hidden;
          transform: translate3d(0,0,0);
          will-change: transform;
        }
        .vs-track-l { animation: vsrow-l 44s linear infinite; }
        .vs-track-r { animation: vsrow-r 40s linear infinite; }
        .vs-track-l:hover, .vs-track-l.paused, .vs-track-r:hover, .vs-track-r.paused { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .vs-track-l, .vs-track-r { animation: none; } }
      `}</style>
      <div className={`${reverse ? "vs-track-r" : "vs-track-l"}${paused ? " paused" : ""}`}>
        <div
          style={{
            display: "flex",
            width: "max-content",
            flexShrink: 0,
            transform: `translate3d(${dragOffset}px, 0, 0)`,
            transition: !isDragging ? `transform ${DRAG_SNAP_MS}ms ease-out` : "none",
          }}
        >
          {items.map((src, i) => (
            <VideoCard key={`${src}-${i}`} src={src} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function VideoShowcaseSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const reduced = useReducedMotion();
  const pauseMarquee = reduced || !inView;
  const t = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <section ref={ref} style={{ position: "relative", zIndex: 10, padding: "100px 0", overflow: "hidden", contain: "layout style paint" }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 800, height: 400, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(139,92,246,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Heading */}
      <motion.div
        initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={t}
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
        initial={{ opacity: reduced ? 1 : 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ ...t, delay: 0.15 }}
        style={{ marginBottom: 12 }}
      >
        <VideoRow videos={row1} paused={pauseMarquee} />
      </motion.div>

      {/* Row 2 — scrolls right */}
      <motion.div
        initial={{ opacity: reduced ? 1 : 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ ...t, delay: 0.3 }}
      >
        <VideoRow videos={row2} reverse paused={pauseMarquee} />
      </motion.div>
    </section>
  );
}
