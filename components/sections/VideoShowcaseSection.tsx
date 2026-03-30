"use client";

import { useRef, useEffect, useState, memo, useCallback } from "react";
import { useInView } from "@/lib/use-in-view";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { getCdnMediaUrl } from "@/lib/cdn-media";
import { useDocumentHtmlDataFlag } from "@/lib/use-html-data-flag";
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

/** Posle ovog mirnog prozora ponovo puštamo CSS marquee (manje GPU pri skrolu). */
const SCROLL_IDLE_RESUME_MS = 420;
const LOAD_REVEAL_FALLBACK_MS = 12_000;
const LAZY_SRC_ROOT_MARGIN = "80px 160px 80px 160px";

function makeDesktopInitialKeys(len: number): Set<string> {
  const next = new Set<string>();
  for (let i = 0; i < len; i += 2) next.add(String(i));
  return next;
}

const VideoCard = memo(function VideoCard({
  instanceKey,
  src,
  reduced,
  sectionInView,
  lazySrcMode = "io",
  manualSrcAttached = false,
  hoverLoop = false,
  autoPlayContest = false,
  autoPlayActive = false,
  allowAutoPlay = true,
  onVisibilityRatio,
}: {
  instanceKey: string;
  src: string;
  reduced: boolean;
  sectionInView: boolean;
  /** Desktop opt: "manual" = parent controls attach cadence; "io" = per-card IntersectionObserver. */
  lazySrcMode?: "io" | "manual";
  /** Used when lazySrcMode="manual". */
  manualSrcAttached?: boolean;
  /** Donji red: puštanje na hover (desktop). */
  hoverLoop?: boolean;
  /** Gornji red: kartica učešćuje u izboru koji 2 klipa rade automatski. */
  autoPlayContest?: boolean;
  autoPlayActive?: boolean;
  /** Za auto red: false kad je marquee zbog skrola ili sekcija van kadra. */
  allowAutoPlay?: boolean;
  onVisibilityRatio?: (key: string, ratio: number) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [videoSrc, setVideoSrc] = useState(src);
  /** Ne vezuj src dok kartica nije blizu viewporta — ne povlači sve mp4 odjednom. */
  const [srcAttached, setSrcAttached] = useState(false);
  const [hoverPlaying, setHoverPlaying] = useState(false);
  const didMarkLoaded = useRef(false);
  const errorRetries = useRef(0);

  const markLoaded = useCallback(() => {
    if (didMarkLoaded.current) return;
    didMarkLoaded.current = true;
    setLoaded(true);
  }, []);

  const effectiveSrcAttached =
    lazySrcMode === "manual" ? Boolean(sectionInView && manualSrcAttached && !reduced && !failed) : srcAttached;

  useEffect(() => {
    if (lazySrcMode !== "io") return;
    // Ne vezuj src (i ne pravimo IO) dok sekcija nije u kadru.
    // Ovo sprečava “mid-scroll” spike kad korisnik tek prilazi sekciji.
    if (reduced || failed || !sectionInView) return;
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setSrcAttached(true);
      },
      { root: null, rootMargin: LAZY_SRC_ROOT_MARGIN, threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lazySrcMode, reduced, failed, sectionInView]);

  useEffect(() => {
    // Visibility scoring (autoplay contest) samo kad je sekcija u kadru.
    if (reduced || failed || !sectionInView || !autoPlayContest || !onVisibilityRatio) return;
    const el = cardRef.current;
    if (!el) return;
    const thresholds = [0, 0.05, 0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95, 1];
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        onVisibilityRatio(instanceKey, e.intersectionRatio);
      },
      { root: null, rootMargin: "0px", threshold: thresholds }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, failed, sectionInView, autoPlayContest, onVisibilityRatio, instanceKey]);

  const shouldPlay =
    (hoverLoop && hoverPlaying && sectionInView) ||
    (autoPlayContest && autoPlayActive && allowAutoPlay);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || failed || !effectiveSrcAttached) return;
    if (shouldPlay) {
      v.preload = "auto";
      void v.play().catch(() => {});
    } else {
      v.pause();
      try {
        v.currentTime = 0.001;
      } catch {
        /* ignore */
      }
      v.preload = "metadata";
    }
  }, [shouldPlay, failed, effectiveSrcAttached, videoSrc]);

  useEffect(() => {
    if (reduced || failed || !sectionInView || loaded || !effectiveSrcAttached) return;
    const t = window.setTimeout(() => {
      if (!didMarkLoaded.current) markLoaded();
    }, LOAD_REVEAL_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [sectionInView, reduced, failed, loaded, markLoaded, effectiveSrcAttached]);

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
        cursor: hoverLoop ? "pointer" : "default",
        background: VIDEO_CARD_BG,
      }}
      onPointerEnter={() => {
        if (!hoverLoop) return;
        if (!sectionInView) return;
        if (typeof window === "undefined") return;
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
        setHoverPlaying(true);
      }}
      onPointerLeave={() => {
        if (!hoverLoop) return;
        setHoverPlaying(false);
      }}
    >
      {!failed && (lazySrcMode === "manual" ? effectiveSrcAttached : srcAttached) && (
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          loop={shouldPlay}
          playsInline
          disableRemotePlayback
          preload={shouldPlay ? "auto" : "metadata"}
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
            if (!v || failed || !shouldPlay) return;
            try {
              v.load();
            } catch {
              /* ignore */
            }
          }}
          onWaiting={() => {
            const v = videoRef.current;
            if (!v || failed || !shouldPlay) return;
            void v.play().catch(() => {});
          }}
          onProgress={() => {
            const el = videoRef.current;
            if (!el || failed || didMarkLoaded.current) return;
            try {
              if (el.buffered.length > 0 && el.buffered.end(0) > 0.05) markLoaded();
            } catch {
              /* ignore */
            }
          }}
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (!v) return;
            try {
              v.currentTime = 0.001;
              if (!shouldPlay) v.pause();
            } catch {
              /* ignore */
            }
            markLoaded();
          }}
          onLoadedData={() => {
            if (!shouldPlay) videoRef.current?.pause();
            markLoaded();
          }}
          onCanPlay={() => {
            if (!shouldPlay) videoRef.current?.pause();
            markLoaded();
          }}
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
      {!failed && (!(lazySrcMode === "manual" ? effectiveSrcAttached : srcAttached) || !loaded) && (
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

function pickTopVisibleNonAdjacent(entries: [string, number][], maxSlots: number): string[] {
  const picked: string[] = [];
  for (const [k] of entries) {
    if (picked.length >= maxSlots) break;
    const idx = Number(k);
    if (!Number.isInteger(idx)) continue;
    if (picked.some((pk) => Math.abs(Number(pk) - idx) <= 1)) continue;
    picked.push(k);
  }
  return picked;
}

function VideoRow({
  videos,
  reverse = false,
  paused = false,
  reduced,
  sectionInView,
  hoverLoop = false,
  playEveryOtherDesktop = false,
  autoPlayWinnerCount = 0,
  autoPlayWinnerCountDesktop,
}: {
  videos: string[];
  reverse?: boolean;
  paused?: boolean;
  reduced: boolean;
  sectionInView: boolean;
  hoverLoop?: boolean;
  /** Desktop: fiksno puštaj svaki drugi klip u redu (umesto visibility contest-a). */
  playEveryOtherDesktop?: boolean;
  /** Mobilni / podrazumevano: najviše ovoliko autoplay (najvidljivije). */
  autoPlayWinnerCount?: number;
  /** Desktop: više autoplay; ako je veće od autoPlayWinnerCount, biraju se bez susednih kartica. */
  autoPlayWinnerCountDesktop?: number;
}) {
  const items = [...videos, ...videos];
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });

  // Desktop: kači src postepeno da se ne desi “load spike”.
  const [desktopSrcKeys, setDesktopSrcKeys] = useState<Set<string>>(() => makeDesktopInitialKeys(items.length));
  const desktopSrcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mobileSlots = reduced ? 0 : (autoPlayWinnerCount ?? 0);
  const desktopSlots = reduced ? 0 : (autoPlayWinnerCountDesktop ?? autoPlayWinnerCount ?? 0);
  const contestSlots = isMobile ? mobileSlots : desktopSlots;
  const useSpacedDesktopPick =
    !isMobile &&
    !reduced &&
    (autoPlayWinnerCountDesktop ?? 0) > (autoPlayWinnerCount ?? 0);

  const visibilityRef = useRef<Map<string, number>>(new Map());
  const rafPickRef = useRef(0);
  const [winnerKeys, setWinnerKeys] = useState<Set<string>>(() => new Set());

  const flushWinnerPick = useCallback(() => {
    if (contestSlots <= 0) {
      setWinnerKeys(new Set());
      return;
    }
    const entries = [...visibilityRef.current.entries()]
      .filter(([, r]) => r > 0.02)
      .sort((a, b) => b[1] - a[1]);
    const picked = useSpacedDesktopPick
      ? pickTopVisibleNonAdjacent(entries, contestSlots)
      : entries.slice(0, contestSlots).map(([k]) => k);
    const next = new Set(picked);
    setWinnerKeys((prev) => {
      if (prev.size !== next.size) return next;
      for (const k of next) {
        if (!prev.has(k)) return next;
      }
      return prev;
    });
  }, [contestSlots, useSpacedDesktopPick]);

  const reportVisibility = useCallback(
    (key: string, ratio: number) => {
      if (contestSlots <= 0) return;
      if (ratio < 0.02) visibilityRef.current.delete(key);
      else visibilityRef.current.set(key, ratio);

      if (rafPickRef.current) return;
      rafPickRef.current = requestAnimationFrame(() => {
        rafPickRef.current = 0;
        flushWinnerPick();
      });
    },
    [contestSlots, flushWinnerPick]
  );

  const allowAutoPlay = sectionInView && !paused;

  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const lastX = useRef(0);
  const pendingOffset = useRef(0);
  const rafRef = useRef<number | 0>(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const fn = () => {
      const nextIsMobile = mq.matches;
      setIsMobile(nextIsMobile);
      // Kad se breakpoint promeni, odmah resetuj izbor autoplay pobednika
      // (izbegava “stare” winners dok ne stigne novi IO update).
      visibilityRef.current.clear();
      setWinnerKeys(new Set());
      setDesktopSrcKeys(makeDesktopInitialKeys(items.length));
      if (desktopSrcTimerRef.current) {
        clearTimeout(desktopSrcTimerRef.current);
        desktopSrcTimerRef.current = null;
      }
    };
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [items.length]);

  useEffect(() => {
    if (isMobile || reduced) return;
    if (!sectionInView) return;
    // Ostatak: 1 po 1 u pozadini (obe kopije), da ne ostaju logo placeholder-i.
    let idx = 1;
    const tick = () => {
      if (!sectionInView || paused) return;
      while (idx < items.length && idx % 2 === 0) idx += 1;
      if (idx >= items.length) return;
      const key = String(idx);
      setDesktopSrcKeys((prev) => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        return next;
      });
      idx += 2;
      desktopSrcTimerRef.current = setTimeout(tick, 320);
    };
    desktopSrcTimerRef.current = setTimeout(tick, 480);

    return () => {
      if (desktopSrcTimerRef.current) {
        clearTimeout(desktopSrcTimerRef.current);
        desktopSrcTimerRef.current = null;
      }
    };
  }, [isMobile, reduced, sectionInView, paused, items.length]);

  /** Telefon: bez hover-play u redu (cela prva traka ostaje kao ranije — marquee + autoplay po vidljivosti). Desktop: hover kao i do sada. */
  const hoverLoopEffective = hoverLoop && !isMobile;

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
          {items.map((videoSrc, i) => {
            const instanceKey = String(i);
            const desktopEveryOtherActive = playEveryOtherDesktop && !isMobile && i % 2 === 0;
            // "Contest" (visibility scoring + autoplay winners) samo za prvu kopiju trake.
            // Druga kopija služi za seamless marquee i ne treba dodatni IO + raf pick work.
            const isContestCandidate = !desktopEveryOtherActive && contestSlots > 0 && i < videos.length;
            const useManualSrc = !isMobile;
            const manualSrcAttached = useManualSrc && desktopSrcKeys.has(instanceKey);
            return (
              <VideoCard
                key={`${videoSrc}-${i}`}
                instanceKey={instanceKey}
                src={videoSrc}
                reduced={reduced}
                sectionInView={sectionInView}
                lazySrcMode={useManualSrc ? "manual" : "io"}
                manualSrcAttached={manualSrcAttached}
                hoverLoop={hoverLoopEffective}
                autoPlayContest={isContestCandidate}
                autoPlayActive={desktopEveryOtherActive || (isContestCandidate && winnerKeys.has(instanceKey))}
                allowAutoPlay={allowAutoPlay}
                onVisibilityRatio={isContestCandidate ? reportVisibility : undefined}
              />
            );
          })}
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
  /** Širi „prozor“ da se play/pause ne okida na border skrola (manje treperenja). */
  const inView = useInView(ref, { once: false, amount: 0.08, margin: "140px 0px 200px 0px" });
  const reduced = useReducedMotion();
  const sectionInView = inView ?? false;
  const heroVslHeavy = useDocumentHtmlDataFlag("data-hero-vsl-heavy");

  const reveal = reduced || sectionInView;
  const revealEase = "cubic-bezier(0.22, 1, 0.36, 1)";

  const [marqueeScrollHold, setMarqueeScrollHold] = useState(false);
  const marqueeScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionInViewRef = useRef(false);
  useEffect(() => {
    sectionInViewRef.current = sectionInView;
  }, [sectionInView]);

  /** Dok korisnik skroluje dok je showcase u kadru, pauziraj CSS marquee (najjeftinije za skrol). */
  useEffect(() => {
    const bump = () => {
      if (!sectionInViewRef.current) return;
      setMarqueeScrollHold(true);
      if (marqueeScrollTimerRef.current != null) {
        clearTimeout(marqueeScrollTimerRef.current);
      }
      marqueeScrollTimerRef.current = setTimeout(() => {
        marqueeScrollTimerRef.current = null;
        setMarqueeScrollHold(false);
      }, SCROLL_IDLE_RESUME_MS);
    };
    window.addEventListener("scroll", bump, { passive: true });
    window.addEventListener("wheel", bump, { passive: true });
    window.addEventListener("touchmove", bump, { passive: true });
    return () => {
      window.removeEventListener("scroll", bump);
      window.removeEventListener("wheel", bump);
      window.removeEventListener("touchmove", bump);
      if (marqueeScrollTimerRef.current != null) {
        clearTimeout(marqueeScrollTimerRef.current);
        marqueeScrollTimerRef.current = null;
      }
    };
  }, []);

  const pauseMarquee = reduced || !sectionInView || marqueeScrollHold || heroVslHeavy;

  return (
    <section
      ref={ref}
      className={`video-showcase-section${sectionInView ? " video-showcase-inview" : ""}`}
      style={{
        position: "relative",
        zIndex: 10,
        padding: "100px 0",
        overflow: "hidden",
        contain: "layout paint",
        contentVisibility: "auto",
        containIntrinsicSize: "0 820px",
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

      <div
        style={{
          textAlign: "center",
          padding: "0 24px",
          marginBottom: 48,
          position: "relative",
          opacity: reveal ? 1 : 0,
          transform: reveal ? "translateY(0)" : "translateY(16px)",
          transition: `opacity 0.55s ${revealEase}, transform 0.55s ${revealEase}`,
        }}
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
      </div>

      <div
        style={{
          marginBottom: 12,
          opacity: reveal ? 1 : 0,
          transition: `opacity 0.55s ${revealEase} 0.12s`,
        }}
      >
        <VideoRow
          videos={row1}
          paused={pauseMarquee}
          reduced={reduced}
          sectionInView={sectionInView}
          playEveryOtherDesktop
          autoPlayWinnerCount={2}
          autoPlayWinnerCountDesktop={4}
        />
      </div>

      <div
        style={{
          marginBottom: 0,
          opacity: reveal ? 1 : 0,
          transition: `opacity 0.55s ${revealEase} 0.22s`,
        }}
      >
        <VideoRow
          videos={row2}
          reverse
          paused={pauseMarquee}
          reduced={reduced}
          sectionInView={sectionInView}
        />
      </div>
    </section>
  );
}
