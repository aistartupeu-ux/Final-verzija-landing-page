"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useEffect, useState, memo, useCallback } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";

const BUNNY_VIDEO_BASE_URL = process.env.NEXT_PUBLIC_BUNNY_VIDEO_BASE_URL?.trim() ?? "";

function getVideoSrc(path: string) {
  if (!BUNNY_VIDEO_BASE_URL) return path;
  const base = BUNNY_VIDEO_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/* Row 1: V11 + v12–v17 (bez v15) | Row 2: v1–v10 (optimizovani) */
const row1 = [
  getVideoSrc("/examples/v11.mp4"),
  getVideoSrc("/examples/v12.mp4"),
  getVideoSrc("/examples/v13.mp4"),
  getVideoSrc("/examples/v14.mp4"),
];

const row2 = [
  getVideoSrc("/examples/v1.mp4"),
  getVideoSrc("/examples/v2.mp4"),
  getVideoSrc("/examples/v3.mp4"),
  getVideoSrc("/examples/v4.mp4"),
];

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

const DETACH_DELAY_MS = 900;
const ATTACH_MIN_RATIO = 0.22;
const PLAY_MIN_RATIO = 0.12;
const IO_THRESHOLDS = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.35, 0.5, 0.75, 1];

/**
 * Marquee drži mnogo kartica u DOM-u (duplirani niz). Bez kontrole, skoro sve
 * istovremeno dobiju <video src> (širok rootMargin + threshold 0) → dekodovanje
 * i mreža gutaju CPU/GPU. Učitavamo MP4 samo kad je kartica stvarno u kadru,
 * skidamo src posle kratke pauze kad izađe, i ne učitavamo pri reduced motion.
 */
const VideoCard = memo(function VideoCard({
  src,
  allowMedia,
  marqueePaused,
}: {
  src: string;
  allowMedia: boolean;
  marqueePaused: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attachSrc, setAttachSrc] = useState(false);
  const visibleRef = useRef(false);
  const ratioRef = useRef(0);
  const didMarkLoaded = useRef(false);
  const detachTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attachSrcRef = useRef(false);

  const markLoaded = useCallback(() => {
    if (didMarkLoaded.current) return;
    didMarkLoaded.current = true;
    setLoaded(true);
  }, []);

  const clearDetachTimer = useCallback(() => {
    if (detachTimerRef.current != null) {
      clearTimeout(detachTimerRef.current);
      detachTimerRef.current = null;
    }
  }, []);

  const detachVideo = useCallback(() => {
    clearDetachTimer();
    attachSrcRef.current = false;
    setAttachSrc(false);
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.removeAttribute("src");
      v.load();
    }
    didMarkLoaded.current = false;
    setLoaded(false);
  }, [clearDetachTimer]);

  useEffect(() => {
    if (!allowMedia) {
      detachVideo();
    }
  }, [allowMedia, detachVideo]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || failed) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.intersectionRatio;
        ratioRef.current = ratio;
        visibleRef.current = entry.isIntersecting && ratio >= PLAY_MIN_RATIO;

        const wantAttach =
          allowMedia && entry.isIntersecting && ratio >= ATTACH_MIN_RATIO;
        if (wantAttach) {
          clearDetachTimer();
          attachSrcRef.current = true;
          setAttachSrc(true);
        } else if (allowMedia && attachSrcRef.current) {
          if (detachTimerRef.current == null) {
            detachTimerRef.current = setTimeout(() => {
              detachTimerRef.current = null;
              detachVideo();
            }, DETACH_DELAY_MS);
          }
        } else if (!allowMedia) {
          detachVideo();
        }

        const v = videoRef.current;
        if (!v || failed || !loaded) return;
        const wantPlay =
          allowMedia &&
          !marqueePaused &&
          entry.isIntersecting &&
          ratio >= PLAY_MIN_RATIO;
        if (wantPlay) v.play().catch(() => {});
        else v.pause();
      },
      { root: null, rootMargin: "24px 0px", threshold: IO_THRESHOLDS }
    );

    io.observe(card);
    return () => {
      clearDetachTimer();
      io.disconnect();
    };
  }, [allowMedia, failed, loaded, marqueePaused, clearDetachTimer, detachVideo]);

  useEffect(() => {
    if (!loaded || failed || !allowMedia) return;
    const v = videoRef.current;
    if (v && visibleRef.current && !marqueePaused) v.play().catch(() => {});
    if (v && marqueePaused) v.pause();
  }, [loaded, failed, allowMedia, marqueePaused]);

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
        transition: "transform 0.25s ease, border-color 0.25s ease",
        cursor: "default",
        background: VIDEO_CARD_BG,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.02) translateZ(0)";
        e.currentTarget.style.borderColor = "rgba(0,212,255,0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1) translateZ(0)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
      }}
    >
      {!failed && attachSrc && (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="none"
          onError={() => setFailed(true)}
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
      {!failed && (!attachSrc || !loaded) && (
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
  allowMedia,
}: {
  videos: string[];
  reverse?: boolean;
  paused?: boolean;
  allowMedia: boolean;
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

  return (
    <div
      className="video-showcase-row"
      style={{
        overflow: "hidden",
        contain: "layout paint",
        margin: "0 24px",
        transform: "translateZ(0)",
        maskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
        touchAction: isMobile ? "pan-y" : "auto",
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
        @media (min-width: 769px) {
          .video-showcase-section .video-showcase-row {
            width: 100vw !important;
            max-width: 100vw !important;
            margin-left: calc(50% - 50vw) !important;
            margin-right: calc(50% - 50vw) !important;
            box-sizing: border-box !important;
            mask-image: linear-gradient(90deg, transparent 0%, black 2%, black 98%, transparent 100%) !important;
            -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 2%, black 98%, transparent 100%) !important;
          }
        }
        @keyframes vsrow-l { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
        @keyframes vsrow-r { from { transform: translate3d(-50%,0,0); } to { transform: translate3d(0,0,0); } }
        .vs-track-l, .vs-track-r {
          display: flex;
          width: max-content;
          backface-visibility: hidden;
          transform: translate3d(0,0,0);
        }
        .video-showcase-section.video-showcase-inview .vs-track-l,
        .video-showcase-section.video-showcase-inview .vs-track-r { will-change: transform; }
        .vs-track-l { animation: vsrow-l 48s linear infinite; }
        .vs-track-r { animation: vsrow-r 44s linear infinite; }
        .vs-track-l:hover, .vs-track-l.paused, .vs-track-r:hover, .vs-track-r.paused { animation-play-state: paused; }
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
              allowMedia={allowMedia}
              marqueePaused={paused}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function VideoShowcaseSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, amount: 0.1 });
  const reduced = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const pauseMarquee = reduced || !inView;
  const allowMedia = inView && !reduced;
  const t = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <section
      ref={ref}
      className={`video-showcase-section${inView ? " video-showcase-inview" : ""}`}
      style={{
        position: "relative",
        zIndex: 10,
        padding: "100px 0",
        overflow: "hidden",
        contain: "layout paint",
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
        animate={inView ? { opacity: 1, y: 0 } : {}}
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
        animate={inView ? { opacity: 1 } : {}}
        transition={{ ...t, delay: 0.15 }}
        style={{ marginBottom: 12 }}
      >
        <VideoRow videos={row1} paused={pauseMarquee} allowMedia={allowMedia} />
      </motion.div>

      {!isMobile && (
        <motion.div
          initial={{ opacity: reduced ? 1 : 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ ...t, delay: 0.3 }}
        >
          <VideoRow videos={row2} reverse paused={pauseMarquee} allowMedia={allowMedia} />
        </motion.div>
      )}
    </section>
  );
}
