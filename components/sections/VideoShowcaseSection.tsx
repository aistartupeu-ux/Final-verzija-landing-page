"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useEffect, useState, memo, useCallback } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { getCdnMediaUrl } from "@/lib/cdn-media";
import { CDN_PATH_SHOWCASE_ROW1, CDN_PATH_SHOWCASE_ROW2 } from "@/lib/video-cdn-paths";

const DEFAULT_ROW1 = CDN_PATH_SHOWCASE_ROW1.map((p) => getCdnMediaUrl(p));
const DEFAULT_ROW2 = CDN_PATH_SHOWCASE_ROW2.map((p) => getCdnMediaUrl(p));

const VIDEO_CARD_BG =
  "linear-gradient(135deg, rgba(15,15,28,0.95) 0%, rgba(25,20,45,0.9) 100%)";

const LogoFallback = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      background: VIDEO_CARD_BG,
    }}
  >
    <Image
      src="/logo.png"
      alt="AI Hype Academy"
      width={100}
      height={34}
      loading="lazy"
      decoding="async"
      style={{ width: "auto", height: "auto", maxWidth: "80%", opacity: 0.7 }}
    />
  </div>
);

/**
 * Kartice žive unutar CSS marquee (transform animacija). ratio iz IO često „treperi“,
 * pa za puštanje koristimo samo isIntersecting + širok margin. Preload nije „auto“ na
 * svim instancama — 40+ MP4 odjednom guši mrežu/dekoder; metadata + play() kad uđe u kadar.
 */
const CARD_PLAY_IO_MARGIN = "140px 0px 140px 0px";
const CARD_PLAY_THRESHOLDS = [0, 0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 1];

const VideoCard = memo(function VideoCard({
  src,
  reduced,
  sectionInView,
  marqueePaused,
}: {
  src: string;
  reduced: boolean;
  sectionInView: boolean;
  marqueePaused: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [videoSrc, setVideoSrc] = useState(src);
  const didMarkLoaded = useRef(false);
  const errorRetries = useRef(0);

  useEffect(() => {
    setVideoSrc(src);
    errorRetries.current = 0;
    didMarkLoaded.current = false;
    setLoaded(false);
    setFailed(false);
  }, [src]);

  const markLoaded = useCallback(() => {
    if (didMarkLoaded.current) return;
    didMarkLoaded.current = true;
    setLoaded(true);
  }, []);

  const tryPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v || failed || !loaded) return;
    if (v.readyState < 2) {
      try {
        v.load();
      } catch {
        /* ignore */
      }
    }
    v.play().catch(() => {});
  }, [failed, loaded]);

  const tryPause = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
  }, []);

  useEffect(() => {
    if (reduced || failed) return;
    const card = cardRef.current;
    const v = videoRef.current;
    if (!card || !v) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const wantPlay =
          sectionInView && !marqueePaused && entry.isIntersecting;
        if (wantPlay) tryPlay();
        else tryPause();
      },
      { root: null, rootMargin: CARD_PLAY_IO_MARGIN, threshold: CARD_PLAY_THRESHOLDS }
    );

    io.observe(card);
    return () => io.disconnect();
  }, [reduced, failed, sectionInView, marqueePaused, tryPlay, tryPause]);

  useEffect(() => {
    if (reduced || failed || !loaded) return;
    if (!sectionInView || marqueePaused) tryPause();
  }, [sectionInView, marqueePaused, reduced, failed, loaded, tryPause]);

  /** Posle loaded IO se ponekad ne okine odmah tokom marquee-a — jedan play pokušaj. */
  useEffect(() => {
    if (!loaded || reduced || failed || !sectionInView || marqueePaused) return;
    const t = requestAnimationFrame(() => tryPlay());
    return () => cancelAnimationFrame(t);
  }, [loaded, reduced, failed, sectionInView, marqueePaused, tryPlay]);

  if (reduced) {
    return (
      <div
        className="video-card"
        style={{
          flexShrink: 0,
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
          marginRight: 12,
          position: "relative",
          isolation: "isolate",
          background: VIDEO_CARD_BG,
        }}
      >
        <LogoFallback />
      </div>
    );
  }

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
        isolation: "isolate",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        cursor: "default",
        background: VIDEO_CARD_BG,
      }}
    >
      {!failed && (
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => {
            if (errorRetries.current >= 1) {
              setFailed(true);
              return;
            }
            errorRetries.current += 1;
            didMarkLoaded.current = false;
            setLoaded(false);
            try {
              const u = videoSrc.startsWith("http")
                ? new URL(videoSrc)
                : new URL(videoSrc, typeof window !== "undefined" ? window.location.href : "https://local.invalid");
              u.searchParams.set("_r", String(Date.now()));
              setVideoSrc(u.href);
            } catch {
              setFailed(true);
            }
          }}
          onStalled={() => {
            const v = videoRef.current;
            if (!v || failed) return;
            try {
              v.load();
            } catch {
              /* ignore */
            }
          }}
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (!v) return;
            try {
              v.currentTime = 0.001;
            } catch {
              /* ignore */
            }
            markLoaded();
          }}
          onLoadedData={() => markLoaded()}
          onCanPlay={() => markLoaded()}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            position: "absolute",
            inset: 0,
            zIndex: 1,
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.25s ease",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
            backgroundColor: "transparent",
          }}
        />
      )}
      {!failed && !loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          <LogoFallback />
        </div>
      )}
    </div>
  );
});

const DRAG_SNAP_MS = 220;

function VideoRow({
  videos,
  reverse = false,
  paused = false,
  reduced,
  sectionInView,
}: {
  videos: string[];
  reverse?: boolean;
  paused?: boolean;
  reduced: boolean;
  sectionInView: boolean;
}) {
  const items = [...videos, ...videos];
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });
  const lastX = useRef(0);
  const pendingOffset = useRef(0);
  const rafRef = useRef<number | 0>(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    lastX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const dx = e.touches[0].clientX - lastX.current;
    lastX.current = e.touches[0].clientX;
    pendingOffset.current += dx;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      setDragOffset(pendingOffset.current);
      rafRef.current = 0;
    });
  };

  const onTouchEnd = () => {
    if (!isMobile) return;
    setIsDragging(false);
    pendingOffset.current = 0;
    setDragOffset(0);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  };

  const fadeEdge =
    "linear-gradient(90deg, var(--color-background, #050508) 0%, transparent 100%)";
  const fadeEdgeR =
    "linear-gradient(270deg, var(--color-background, #050508) 0%, transparent 100%)";

  return (
    <div
      className="video-showcase-row"
      style={{
        overflow: "hidden",
        position: "relative",
        contain: "layout",
        transform: "translateZ(0)",
        touchAction: isMobile ? "pan-y" : "auto",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <style>{`
        .video-card { width: 200px; height: 356px; }
        @media (hover: hover) and (pointer: fine) {
          .video-card:hover {
            border-color: rgba(0,212,255,0.35) !important;
            box-shadow: 0 10px 26px rgba(0, 0, 0, 0.26);
          }
        }
        @media (max-width: 640px) { .video-card { width: 170px; height: 302px; } }
        @media (min-width: 641px) and (max-width: 768px) { .video-card { width: 185px; height: 329px; } }
        .video-showcase-section .video-showcase-row {
          width: 100vw !important;
          max-width: 100vw !important;
          margin-left: calc(50% - 50vw) !important;
          margin-right: calc(50% - 50vw) !important;
          box-sizing: border-box !important;
        }
        @keyframes vsrow-l { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
        @keyframes vsrow-r { from { transform: translate3d(-50%,0,0); } to { transform: translate3d(0,0,0); } }
        .vs-track-l, .vs-track-r {
          display: flex;
          width: max-content;
          backface-visibility: hidden;
          transform: translate3d(0,0,0);
          will-change: auto;
        }
        .video-showcase-inview .vs-track-l:not(.paused),
        .video-showcase-inview .vs-track-r:not(.paused) {
          will-change: transform;
        }
        .vs-track-l { animation: vsrow-l 72s linear infinite; }
        .vs-track-r { animation: vsrow-r 68s linear infinite; }
        .vs-track-l.paused, .vs-track-r.paused { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .vs-track-l, .vs-track-r { animation: none; } }
      `}</style>
      <div className={`${reverse ? "vs-track-r" : "vs-track-l"}${paused ? " paused" : ""}`}>
        <div
          style={{
            display: "flex",
            width: "max-content",
            flexShrink: 0,
            transform: `translate3d(${isMobile ? dragOffset : 0}px, 0, 0)`,
            backfaceVisibility: "hidden",
            transition: !isDragging ? `transform ${DRAG_SNAP_MS}ms cubic-bezier(0.22, 1, 0.36, 1)` : "none",
          }}
        >
          {items.map((videoSrc, i) => (
            <VideoCard
              key={`${videoSrc}-${i}`}
              src={videoSrc}
              reduced={reduced}
              sectionInView={sectionInView}
              marqueePaused={paused}
            />
          ))}
        </div>
      </div>
      {/* Isto kao meki ivičnjak kao mask, ali bez skupe mask-kompozicije pri skrolu */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 4,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "clamp(28px, 7vw, 88px)",
            background: fadeEdge,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "clamp(28px, 7vw, 88px)",
            background: fadeEdgeR,
          }}
        />
      </div>
    </div>
  );
}

export default function VideoShowcaseSection({
  row1Srcs = DEFAULT_ROW1,
  row2Srcs = DEFAULT_ROW2,
}: {
  row1Srcs?: string[];
  row2Srcs?: string[];
}) {
  const row1 = row1Srcs;
  const row2 = row2Srcs;
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, amount: 0.15, margin: "0px" });
  const reducedMotion = useReducedMotion();
  const reduced = reducedMotion ?? false;
  const sectionInView = inView ?? false;

  const pauseMarquee = reduced || !sectionInView;
  const t = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <section
      ref={ref}
      className={`video-showcase-section${sectionInView ? " video-showcase-inview" : ""}`}
      style={{
        position: "relative",
        zIndex: 10,
        padding: "100px 0",
        overflow: "hidden",
        contain: "layout",
        contentVisibility: "visible",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 800,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(139,92,246,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 16 }}
        animate={sectionInView ? { opacity: 1, y: 0 } : {}}
        transition={t}
        style={{ textAlign: "center", padding: "0 24px", marginBottom: 48, position: "relative" }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(139,92,246,0.07)",
            border: "1px solid rgba(139,92,246,0.18)",
            borderRadius: 50,
            padding: "6px 16px",
            marginBottom: 20,
          }}
        >
          <Sparkles size={12} color="#a855f7" />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#a855f7",
              textTransform: "uppercase" as const,
              letterSpacing: "0.1em",
            }}
          >
            Primeri radova
          </span>
        </div>
        <h2 style={{ fontSize: "clamp(26px,5vw,44px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 10 }}>
          Ovo ces praviti <span style={{ color: "#a855f7" }}>unutar kursa.</span>
        </h2>
        <p style={{ fontSize: 15, color: "#8a8a9a", maxWidth: 440, margin: "0 auto", lineHeight: 1.7 }}>
          Sve je napravljeno pomocu AI alata koje ces nauciti. Bez prethodnog iskustva.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: reduced ? 1 : 0 }}
        animate={sectionInView ? { opacity: 1 } : {}}
        transition={{ ...t, delay: 0.15 }}
        style={{ marginBottom: 12 }}
      >
        <VideoRow
          videos={row1}
          paused={pauseMarquee}
          reduced={reduced}
          sectionInView={sectionInView}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: reduced ? 1 : 0 }}
        animate={sectionInView ? { opacity: 1 } : {}}
        transition={{ ...t, delay: 0.3 }}
        style={{ marginBottom: 0 }}
      >
        <VideoRow
          videos={row2}
          reverse
          paused={pauseMarquee}
          reduced={reduced}
          sectionInView={sectionInView}
        />
      </motion.div>
    </section>
  );
}
