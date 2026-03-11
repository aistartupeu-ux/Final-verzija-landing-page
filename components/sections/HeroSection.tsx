"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Maximize } from "lucide-react";
import Image from "next/image";
import CountdownTimer from "@/components/ui/CountdownTimer";
import EmailForm from "@/components/ui/EmailForm";

// 31. mart 23:59:59 (poslednji dan prijava)
const TARGET_DATE = new Date(2026, 2, 31, 23, 59, 59);

export default function HeroSection() {
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const explainerRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const video = bgVideoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, -rect.top / (rect.height * 0.6)));
        video.style.transform = `translate(-50%, -50%) scale(1.12) translateY(${progress * -50}px) translateZ(0)`;
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const video = bgVideoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.1, rootMargin: "50px" });
    io.observe(section);
    return () => io.disconnect();
  }, []);

  const togglePlay = () => {
    if (!explainerRef.current) return;
    if (playing) {
      explainerRef.current.pause();
      setPlaying(false);
    } else {
      explainerRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative", zIndex: 10, minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "120px 24px 80px", overflow: "hidden",
      }}
    >
      {/* Video wallpaper with parallax */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", contain: "layout style paint" }}>
        <video
          ref={bgVideoRef}
          autoPlay muted loop playsInline preload="auto"
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            minWidth: "100%", minHeight: "100%",
            width: "auto", height: "auto",
            transform: "translate(-50%, -50%) scale(1.12) translateZ(0)",
            objectFit: "cover",
          }}
        >
          <source src="/hero-vsl.mp4" type="video/mp4" />
        </video>
        <div style={{ position: "absolute", inset: 0, background: "rgba(5,5,8,0.82)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(to top, #050508 0%, rgba(5,5,8,0.7) 50%, transparent 100%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "25%", background: "linear-gradient(to bottom, rgba(5,5,8,0.4), transparent)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(5,5,8,0.5) 100%)" }} />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ textAlign: "center", maxWidth: 720, margin: "0 auto", width: "100%", position: "relative", zIndex: 2 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 40, display: "flex", justifyContent: "center" }}
        >
          <Image src="/logo.png" alt="AI Hype Academy" width={260} height={80} style={{ height: 80, width: "auto", objectFit: "contain" }} priority />
        </motion.div>

        <h1
          style={{
            fontSize: "clamp(32px, 6vw, 62px)", fontWeight: 800, color: "#fff",
            lineHeight: 1.1, marginBottom: 28,
            textShadow: "0 2px 40px rgba(0,0,0,0.5), 0 0 80px rgba(0,212,255,0.1)",
          }}
        >
          Izgradi AI karijeru pre nego što bude kasno.{" "}
          <span className="gradient-text">Počni sada.</span>
        </h1>

        {/* 1. VSL video — prvo */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 32, position: "relative" }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <div
            onClick={togglePlay}
            style={{
              position: "relative", borderRadius: 16, overflow: "hidden",
              aspectRatio: "16 / 9", cursor: "pointer",
              border: "1px solid rgba(0,212,255,0.2)",
              boxShadow: hovering
                ? "0 0 0 1px rgba(0,212,255,0.3), 0 20px 60px rgba(0,0,0,0.7), 0 0 50px rgba(0,212,255,0.08)"
                : "0 16px 50px rgba(0,0,0,0.6)",
              transition: "box-shadow 0.3s ease",
            }}
          >
            <video
              ref={explainerRef}
              src="/explainer-vsl.mp4"
              playsInline
              preload="none"
              poster="/video-poster.webp"
              onEnded={() => setPlaying(false)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {/* Overlay */}
            {!playing && (
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(5,5,12,0.52)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {/* Pulse ring */}
                <div style={{
                  position: "absolute", width: 96, height: 96, borderRadius: "50%",
                  border: "2px solid rgba(0,212,255,0.3)",
                  animation: "hero-vring 2s ease-out infinite",
                }} />
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "linear-gradient(135deg,#00d4ff,#0090c0)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 40px rgba(0,212,255,0.6)",
                  transform: hovering ? "scale(1.08)" : "scale(1)",
                  transition: "transform 0.2s ease",
                  position: "relative", zIndex: 2,
                }}>
                  <Play size={24} color="#050508" fill="#050508" style={{ marginLeft: 4 }} />
                </div>
              </div>
            )}
            {/* Pause overlay */}
            {playing && hovering && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.2)",
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Pause size={18} color="#fff" />
                </div>
              </div>
            )}

            {/* Fullscreen button — always visible on touch, hover on desktop */}
            {(hovering || playing) && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  const v = explainerRef.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void; webkitRequestFullscreen?: () => void } | null;
                  if (!v) return;
                  if (v.requestFullscreen) v.requestFullscreen();
                  else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
                  else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
                }}
                style={{
                  position: "absolute", bottom: 12, right: 12, zIndex: 10,
                  background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 8, padding: "7px 9px", cursor: "pointer",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  backdropFilter: "blur(6px)",
                  transition: "background 0.2s, border-color 0.2s",
                  lineHeight: 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,212,255,0.2)"; e.currentTarget.style.borderColor = "rgba(0,212,255,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.65)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
                title="Fullscreen"
              >
                <Maximize size={15} color="#fff" />
              </button>
            )}
          </div>
        </motion.div>

        {/* 2. Email forma — ispod videa */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 32 }}
        >
          <EmailForm />
        </motion.div>

        {/* 3. Tajmer — ispod forme */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 36 }}
        >
          <CountdownTimer targetDate={TARGET_DATE} />
        </motion.div>

        {/* 4. Tekst — na dnu */}
        <p style={{
          fontSize: "clamp(15px, 2vw, 18px)", color: "rgba(255,255,255,0.85)",
          maxWidth: 600, margin: "0 auto", lineHeight: 1.75, fontWeight: 500,
          textShadow: "0 2px 20px rgba(0,0,0,0.5)",
        }}>
          Čak i ako nemaš <strong style={{ color: "#00d4ff" }}>nikakvo prethodno znanje</strong>, naučićeš sve od nule.
          AI influenseri, filmski video, muzika, automatizacija i monetizacija.
        </p>
      </motion.div>
    </section>
  );
}
