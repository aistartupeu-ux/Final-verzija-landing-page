"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useEffect, useState, memo } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";

/* Row 1: V11 + v12–v17 (bez v15) | Row 2: v1–v10 (optimizovani) */
const row1 = [
  "/examples/v11.mp4",
  "/examples/v12.mp4",
  "/examples/v13.mp4",
  "/examples/v14.mp4",
  "/examples/v16.mp4",
  "/examples/v17.mp4",
];

// Redosled po tvom spisku
const row2 = [
  "/examples/v9.mp4",
  "/examples/v1.mp4",
  "/examples/v2.mp4",
  "/examples/v3.mp4",
  "/examples/v4.mp4",
  "/examples/v6.mp4",
  "/examples/v5.mp4",
  "/examples/v10.mp4",
  "/examples/v8.mp4",
  "/examples/v7.mp4",
];

const LogoFallback = () => (
  <div style={{
    width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    background: "linear-gradient(135deg, rgba(15,15,28,0.95) 0%, rgba(25,20,45,0.9) 100%)",
  }}>
    <Image src="/logo.png" alt="AI Hype Academy" width={100} height={34} loading="lazy" decoding="async" style={{ width: "auto", height: "auto", maxWidth: "80%", opacity: 0.7 }} />
  </div>
);

let activeVideoSlots = 0;
const MAX_ACTIVE_VIDEO_SLOTS = 1;
const waiters = new Set<() => void>();

function tryAcquireVideoSlot() {
  if (activeVideoSlots >= MAX_ACTIVE_VIDEO_SLOTS) return false;
  activeVideoSlots += 1;
  return true;
}

function releaseVideoSlot() {
  activeVideoSlots = Math.max(0, activeVideoSlots - 1);
  // Wake up one waiter (progressive loading).
  for (const fn of waiters) {
    waiters.delete(fn);
    fn();
    break;
  }
}

function onNextVideoSlotAvailable(cb: () => void) {
  waiters.add(cb);
  return () => waiters.delete(cb);
}

const VideoCard = memo(function VideoCard({ src }: { src: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const hasSlot = useRef(false);
  const cancelWaitRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    let enterT: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          enterT = setTimeout(() => setInView(true), 320);
        } else {
          clearTimeout(enterT);
          setInView(false);
        }
      },
      { rootMargin: "80px", threshold: 0 }
    );
    io.observe(card);
    return () => { clearTimeout(enterT); io.disconnect(); };
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    const video = videoRef.current;
    if (!card || !video || failed || !inView || !allowed) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.3, rootMargin: "80px" }
    );
    io.observe(card);
    return () => io.disconnect();
  }, [allowed, failed, inView]);

  useEffect(() => {
    if (failed) return;
    if (!inView) {
      // Free slot when offscreen so other cards can load.
      if (hasSlot.current) {
        hasSlot.current = false;
        releaseVideoSlot();
      }
      setAllowed(false);
      return;
    }

    if (hasSlot.current) {
      setAllowed(true);
      return;
    }

    const requestSlot = () => {
      if (failed || !inView || hasSlot.current) return;
      if (tryAcquireVideoSlot()) {
        hasSlot.current = true;
        setAllowed(true);
        return;
      }

      // Wait for a slot, then try again when browser is idle.
      const run = () => {
        if (failed || !inView || hasSlot.current) return;
        requestSlot();
      };
      cancelWaitRef.current?.();
      const cancelWaiter = onNextVideoSlotAvailable(() => {
        const w = window as unknown as {
          requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
          cancelIdleCallback?: (id: number) => void;
        };
        if (typeof w.requestIdleCallback === "function") {
          const id = w.requestIdleCallback(run, { timeout: 1200 });
          cancelWaitRef.current = () => {
            cancelWaiter();
            w.cancelIdleCallback?.(id);
          };
          return;
        }
        const t = window.setTimeout(run, 250);
        cancelWaitRef.current = () => {
          cancelWaiter();
          window.clearTimeout(t);
        };
      });
      cancelWaitRef.current = cancelWaiter;
    };

    requestSlot();
  }, [failed, inView]);

  useEffect(() => {
    return () => {
      cancelWaitRef.current?.();
      if (hasSlot.current) {
        hasSlot.current = false;
        releaseVideoSlot();
      }
    };
  }, []);

  const shouldLoadVideo = inView && allowed && !failed;

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
        contain: "layout paint",
        isolation: "isolate",
        transition: "transform 0.25s ease, border-color 0.25s ease",
        cursor: "default",
        background: "transparent",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "scale(1.02) translateZ(0)";
        e.currentTarget.style.borderColor = "rgba(0,212,255,0.35)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "scale(1) translateZ(0)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
      }}
    >
      {!shouldLoadVideo || !loaded ? <LogoFallback /> : null}
      {shouldLoadVideo && (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="none"
          onError={() => {
            setFailed(true);
            if (hasSlot.current) {
              hasSlot.current = false;
              releaseVideoSlot();
            }
          }}
          onPause={() => {
            // If user scrolls away and playback pauses, allow others to load.
            if (!inView && hasSlot.current) {
              hasSlot.current = false;
              releaseVideoSlot();
            }
          }}
          onLoadedData={() => setLoaded(true)}
          style={{
            width: "100%", height: "100%", objectFit: "cover", display: "block",
            position: "absolute", inset: 0,
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.25s ease",
          }}
        />
      )}
    </div>
  );
});

const DRAG_SNAP_MS = 220;

function VideoRow({ videos, reverse = false, paused = false }: { videos: string[]; reverse?: boolean; paused?: boolean }) {
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
        /* PC/desktop: edge-to-edge, filled to screen edges */
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
        @keyframes vsrow-l { from { transform: translate3d(0,0,0) } to { transform: translate3d(-50%,0,0) } }
        @keyframes vsrow-r { from { transform: translate3d(-50%,0,0) } to { transform: translate3d(0,0,0) } }
        .vs-track-l, .vs-track-r {
          display: flex; width: max-content;
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
  const inView = useInView(ref, { once: false, amount: 0.1 });
  const reduced = useReducedMotion();
  const pauseMarquee = reduced || !inView;
  const t = { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <section
      ref={ref}
      className={`video-showcase-section${inView ? " video-showcase-inview" : ""}`}
      style={{
        position: "relative", zIndex: 10, padding: "100px 0", overflow: "hidden", contain: "layout style paint",
        contentVisibility: "auto", containIntrinsicSize: "auto 1100px",
      }}
    >
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
