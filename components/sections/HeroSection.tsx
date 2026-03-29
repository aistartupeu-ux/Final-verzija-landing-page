"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Maximize } from "lucide-react";
import Image from "next/image";
import CountdownTimer from "@/components/ui/CountdownTimer";
import EmailForm from "@/components/ui/EmailForm";
import { getCdnMediaUrl } from "@/lib/cdn-media";
import { arePromoLandingPagesEnabled } from "@/lib/promo-landing-pages";
import { CDN_PATH_HERO_BG, CDN_PATH_EXPLAINER_MP4 } from "@/lib/video-cdn-paths";

/** Poster pre prvog play-a — isti logo kao u headeru (`public/logo.png`). */
const HERO_VSL_POSTER_SRC = "/logo.png";

// Perioda giveawaya 2.–14. apr. 2026, Europe/Belgrade (CEST = UTC+2 u aprilu).
// Tajmer do kraja 14. apr. = 15. apr. 00:00 lokalno. Isto za hero / giveaway LP.
const TARGET_DATE = new Date("2026-04-15T00:00:00+02:00");

const DEFAULT_HERO_MEDIA = {
  bgMp4: getCdnMediaUrl(CDN_PATH_HERO_BG),
  explainerMp4: getCdnMediaUrl(CDN_PATH_EXPLAINER_MP4),
};

export type HeroSectionMediaUrls = {
  bgMp4: string;
  explainerMp4: string;
};

export default function HeroSection({
  mediaUrls = DEFAULT_HERO_MEDIA,
}: {
  mediaUrls?: HeroSectionMediaUrls;
}) {
  const { bgMp4: HERO_BG_MP4, explainerMp4: EXPLAINER_MP4 } = mediaUrls;
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const explainerRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [bgFailed, setBgFailed] = useState(false);
  const [explainerFailed, setExplainerFailed] = useState(false);
  /** Kad je jednom krenuo repro — sklanja preview (logo + providni sloj), pun video. */
  const [explainerHasPlayed, setExplainerHasPlayed] = useState(false);
  const primeExplainerFrameRef = useRef(true);

  /** Pozadinski video je iznad preklopa — bez lazy IO/load() (to je pravilo seckanje + „prazan“ hero na startu). Samo pauza kad nije u kadru. */
  useEffect(() => {
    const video = bgVideoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;
    const onCanPlay = () => video.play().catch(() => {});
    video.addEventListener("canplay", onCanPlay, { once: true });
    if (video.readyState >= 3) void video.play().catch(() => {});
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0, rootMargin: "0px" }
    );
    io.observe(section);
    return () => {
      video.removeEventListener("canplay", onCanPlay);
      io.disconnect();
    };
  }, [HERO_BG_MP4]);

  useEffect(() => {
    setExplainerHasPlayed(false);
    setPlaying(false);
    primeExplainerFrameRef.current = true;
  }, [EXPLAINER_MP4]);

  useEffect(() => {
    if (explainerFailed) return;
    const v = explainerRef.current;
    if (!v) return;
    if (playing) {
      void v.play().catch(() => setPlaying(false));
    } else {
      v.pause();
    }
  }, [playing, explainerFailed, EXPLAINER_MP4]);

  /** Jedan dekoder manje dok gledaju VSL. */
  useEffect(() => {
    const bg = bgVideoRef.current;
    if (!bg || bgFailed) return;
    if (playing) {
      bg.pause();
    } else {
      void bg.play().catch(() => {});
    }
  }, [playing, bgFailed]);

  const togglePlay = useCallback(() => {
    if (!explainerRef.current || explainerFailed) return;
    if (playing) {
      explainerRef.current.pause();
      setPlaying(false);
    } else {
      setPlaying(true);
    }
  }, [playing, explainerFailed]);

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
      <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
        {bgFailed ? (
          <Image
            src="/pozadina-plexus.png"
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <video
            key={HERO_BG_MP4}
            ref={bgVideoRef}
            src={HERO_BG_MP4}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect fill='%2305080c' width='1' height='1'/%3E%3C/svg%3E"
            onError={() => setBgFailed(true)}
            style={{
              position: "absolute",
              top: "50%", left: "50%",
              minWidth: "100%", minHeight: "100%",
              width: "auto", height: "auto",
              transform: "translate(-50%, -50%) scale(1.12) translateZ(0)",
              objectFit: "cover",
              backfaceVisibility: "hidden",
            }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: "rgba(5,5,8,0.82)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(to top, #050508 0%, rgba(5,5,8,0.7) 50%, transparent 100%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "25%", background: "linear-gradient(to bottom, rgba(5,5,8,0.4), transparent)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(5,5,8,0.5) 100%)" }} />
      </div>

      {/* Content */}
      <div
        style={{ textAlign: "center", maxWidth: 720, margin: "0 auto", width: "100%", position: "relative", zIndex: 2 }}
      >
        <h1
          className="hero-headline"
          style={{
            fontSize: "clamp(24px, 4.5vw, 44px)", fontWeight: 800, color: "#fff",
            lineHeight: 1.15, marginBottom: 32,
            textShadow: "0 2px 40px rgba(0,0,0,0.5), 0 0 80px rgba(0,212,255,0.1)",
          }}
        >
          <span className="hero-headline-line">
            Počni da koristiš AI, pre nego što bude kasno.
          </span>
          <span className="gradient-text hero-headline-line" style={{ marginTop: "0.35em" }}>
            Prijavi se odmah.
          </span>
        </h1>

        {/* 1. VSL video — prvo */}
        <div
          style={{ marginBottom: 32, position: "relative" }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          <div
            onClick={togglePlay}
            className="hero-vsl-frame"
            style={{
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
              aspectRatio: "16 / 9",
              cursor: "pointer",
              background: "linear-gradient(145deg, #12182a 0%, #0a0d18 45%, #050508 100%)",
              border: "1px solid rgba(0,212,255,0.2)",
            }}
          >
            <video
              key={EXPLAINER_MP4}
              ref={explainerRef}
              src={EXPLAINER_MP4}
              playsInline
              preload="none"
              disableRemotePlayback
              onLoadedMetadata={(e) => {
                if (!primeExplainerFrameRef.current) return;
                const v = e.currentTarget;
                try {
                  v.currentTime = 0.001;
                  v.pause();
                } catch {
                  /* ignore */
                }
              }}
              onPlay={() => {
                primeExplainerFrameRef.current = false;
                setExplainerHasPlayed(true);
              }}
              onError={() => setExplainerFailed(true)}
              onEnded={() => setPlaying(false)}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                display: "block",
                zIndex: 0,
              }}
            />
            {/* Pre play: providan sloj + logo; video (prvi kadar) vidljiv ispod. Posle play — bez overlaya. Pauza: samo play + blagi film. */}
            {!playing && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 2,
                  background: !explainerHasPlayed
                    ? "linear-gradient(180deg, rgba(5,8,20,0.32) 0%, rgba(5,5,14,0.48) 100%)"
                    : "rgba(0,0,0,0.32)",
                  pointerEvents: "auto",
                }}
              >
                {explainerFailed ? (
                  <div style={{
                    position: "absolute",
                    bottom: 14,
                    left: 14,
                    right: 14,
                    zIndex: 4,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,0.55)",
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 12,
                    lineHeight: 1.4,
                    textAlign: "left",
                    backdropFilter: "blur(8px)",
                  }}>
                    Video se trenutno ne učitava (404). Prikazujemo fallback dok ne sredimo hostovanje.
                  </div>
                ) : null}
                {!explainerHasPlayed && !explainerFailed ? (
                  <img
                    src={HERO_VSL_POSTER_SRC}
                    alt="AI Hype Academy"
                    decoding="async"
                    fetchPriority="high"
                    draggable={false}
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "clamp(12px, 10%, 40px)",
                      transform: "translateX(-50%)",
                      width: "min(260px, 62%)",
                      height: "auto",
                      objectFit: "contain",
                      filter: "drop-shadow(0 4px 28px rgba(0,0,0,0.75))",
                      zIndex: 3,
                      pointerEvents: "none",
                    }}
                  />
                ) : null}
                {!explainerFailed ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 3,
                      pointerEvents: "none",
                    }}
                  >
                    <div
                      className="hero-vsl-pulse-ring"
                      style={{
                        position: "absolute",
                        width: 96,
                        height: 96,
                        borderRadius: "50%",
                        border: "2px solid rgba(0,212,255,0.35)",
                        animation: "hero-vring 2s ease-out infinite",
                      }}
                    />
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#00d4ff,#0090c0)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 40px rgba(0,212,255,0.5)",
                      transform: hovering ? "scale(1.08)" : "scale(1)",
                      transition: "transform 0.2s ease",
                      position: "relative",
                      zIndex: 1,
                    }}>
                      <Play size={24} color="#050508" fill="#050508" style={{ marginLeft: 4 }} />
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            {/* Pause overlay */}
            {playing && hovering && (
              <div style={{
                position: "absolute", inset: 0,
                zIndex: 5,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.2)",
              }}
              >
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
        </div>

        {/* 2. Email forma — ispod videa */}
        <div id="hero-email-form" style={{ marginBottom: 32, scrollMarginTop: 100 }}>
          <EmailForm />
        </div>

        {/* 3. Tajmer — samo kad su giveaway / promo stranice aktivne (vidi NEXT_PUBLIC_PROMO_LANDING_PAGES) */}
        {arePromoLandingPagesEnabled() ? (
          <div style={{ marginBottom: 36 }}>
            <CountdownTimer targetDate={TARGET_DATE} />
          </div>
        ) : null}

      </div>
    </section>
  );
}
