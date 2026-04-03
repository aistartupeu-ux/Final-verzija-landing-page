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

const LOAD_REVEAL_FALLBACK_MS = 12_000;
const VIDEO_NEAR_VIEWPORT_ROOT_MARGIN = "220px 260px 220px 260px";
const SHOWCASE_PREWARM_MARGIN = "900px 0px 900px 0px";
const DESKTOP_INITIAL_ATTACH_COUNT = 4;
const DESKTOP_ATTACH_STEP_MS = 260;
const DESKTOP_ATTACH_PAUSED_STEP_MS = 420;
const DESKTOP_ATTACH_START_DELAY_MS = 260;
const DESKTOP_TOP_ROW_AUTOPLAY_MAX = 2;
const DESKTOP_SECOND_AUTOPLAY_DELAY_MS = 850;

function makeDesktopInitialKeys(primaryLen: number): Set<string> {
  const next = new Set<string>();
  let attached = 0;
  for (let i = 0; i < primaryLen && attached < DESKTOP_INITIAL_ATTACH_COUNT; i += 2) {
    next.add(String(i));
    attached += 1;
  }
  return next;
}

const VideoCard = memo(function VideoCard({
  instanceKey,
  src,
  reduced,
  sectionInView,
  canAttach = sectionInView,
  lazySrcMode = "io",
  manualSrcAttached = false,
  hoverLoop = false,
  tapToPlay = false,
  tapGroup,
  autoPlayActive = false,
  allowAutoPlay = true,
  onVisibilityRatio,
}: {
  instanceKey: string;
  src: string;
  reduced: boolean;
  sectionInView: boolean;
  /** Allow metadata/src attach before full in-view to prewarm decode/network. */
  canAttach?: boolean;
  /** Desktop opt: "manual" = parent controls attach cadence; "io" = per-card IntersectionObserver. */
  lazySrcMode?: "io" | "manual";
  /** Used when lazySrcMode="manual". */
  manualSrcAttached?: boolean;
  /** Donji red: puštanje na hover (desktop). */
  hoverLoop?: boolean;
  /** Telefon: puštanje na tap (bez autoplay-a ili kao override za klipove koji nisu u autoplay setu). */
  tapToPlay?: boolean;
  /** Grupisanje da tap pauzira ostale u istoj grupi. */
  tapGroup?: string;
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
  const [nearViewport, setNearViewport] = useState(false);
  const [hoverAttached, setHoverAttached] = useState(false);
  const [hoverPlaying, setHoverPlaying] = useState(false);
  const [tapPlaying, setTapPlaying] = useState(false);
  const didMarkLoaded = useRef(false);
  const errorRetries = useRef(0);

  const markLoaded = useCallback(() => {
    if (didMarkLoaded.current) return;
    didMarkLoaded.current = true;
    setLoaded(true);
  }, []);

  const effectiveSrcAttached =
    lazySrcMode === "manual"
      ? Boolean(canAttach && nearViewport && (manualSrcAttached || hoverAttached) && !reduced && !failed)
      : srcAttached;

  useEffect(() => {
    // Track whether card is near viewport and attach src only in near zone.
    if (reduced || failed || !canAttach) return;
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const isNear = Boolean(e?.isIntersecting);
        setNearViewport(isNear);
        // Mobilni stability: jednom kad je src attachovan, ne skidaj ga ponovo (sprečava stalne reload/decode spike).
        if (lazySrcMode === "io") setSrcAttached((prev) => prev || isNear);
      },
      { root: null, rootMargin: VIDEO_NEAR_VIEWPORT_ROOT_MARGIN, threshold: 0 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      setNearViewport(false);
      // Namerno: ne resetuj srcAttached u IO režimu (sticky attach).
    };
  }, [lazySrcMode, reduced, failed, canAttach]);

  useEffect(() => {
    // Visibility reporting for autoplay decisions.
    if (reduced || failed || !sectionInView || !onVisibilityRatio) return;
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
  }, [reduced, failed, sectionInView, onVisibilityRatio, instanceKey]);

  const shouldPlay =
    (tapToPlay && tapPlaying && sectionInView) ||
    (hoverLoop && hoverPlaying && sectionInView) ||
    (autoPlayActive && allowAutoPlay);

  useEffect(() => {
    if (!tapToPlay || !tapGroup) return;
    const onTap = (e: Event) => {
      const ev = e as CustomEvent<{ group?: string; key?: string }>;
      if (!ev.detail) return;
      if (ev.detail.group !== tapGroup) return;
      if (ev.detail.key === instanceKey) return;
      setTapPlaying(false);
    };
    window.addEventListener("aha:tap-play", onTap);
    return () => window.removeEventListener("aha:tap-play", onTap);
  }, [tapToPlay, tapGroup, instanceKey]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || failed || !effectiveSrcAttached) return;
    if (shouldPlay) {
      v.preload = "auto";
      void v.play().catch(() => {});
    } else {
      v.pause();
      // Keep non-active cards light to prevent decode spikes near section boundaries.
      v.preload = "none";
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
      onClick={() => {
        if (!tapToPlay) return;
        if (!sectionInView) return;
        // On tap, ensure src is attached in both modes.
        if (lazySrcMode === "manual") setHoverAttached(true);
        if (lazySrcMode === "io") setSrcAttached(true);

        const next = !tapPlaying;
        setTapPlaying(next);
        if (next && tapGroup) {
          try {
            window.dispatchEvent(new CustomEvent("aha:tap-play", { detail: { group: tapGroup, key: instanceKey } }));
          } catch {
            // ignore
          }
        }
      }}
      onPointerEnter={() => {
        if (lazySrcMode === "manual") setHoverAttached(true);
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
  canAttachMedia,
  hoverLoop = false,
  /** Desktop: gornji red — svaki drugi + odloženi drugi autoplay (kao ranije). */
  playEveryOtherDesktop = false,
  /** Telefon: isključi autoplay (donji red), ali ostavi tap-to-play. */
  disableAutoPlayOnMobile = false,
  /** Telefon: tap-to-play za sve kartice u ovom redu. */
  tapToPlayOnMobile = false,
  /** Grupa za tap-to-play (pauzira ostale u istoj grupi). */
  tapGroup,
  autoPlayWinnerCount = 0,
  autoPlayWinnerCountDesktop,
}: {
  videos: string[];
  reverse?: boolean;
  paused?: boolean;
  reduced: boolean;
  sectionInView: boolean;
  canAttachMedia: boolean;
  hoverLoop?: boolean;
  playEveryOtherDesktop?: boolean;
  disableAutoPlayOnMobile?: boolean;
  tapToPlayOnMobile?: boolean;
  tapGroup?: string;
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

  const [desktopSrcKeys, setDesktopSrcKeys] = useState<Set<string>>(() =>
    makeDesktopInitialKeys(videos.length)
  );
  const desktopSrcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mobileSlots = reduced ? 0 : (disableAutoPlayOnMobile ? 0 : (autoPlayWinnerCount ?? 0));
  const desktopSlots = reduced ? 0 : (autoPlayWinnerCountDesktop ?? autoPlayWinnerCount ?? 0);
  const contestSlots = isMobile ? mobileSlots : desktopSlots;
  const useSpacedDesktopPick =
    !isMobile &&
    !reduced &&
    (autoPlayWinnerCountDesktop ?? 0) > (autoPlayWinnerCount ?? 0);

  const visibilityRef = useRef<Map<string, number>>(new Map());
  const rafPickRef = useRef(0);
  const [winnerKeys, setWinnerKeys] = useState<Set<string>>(() => new Set());
  const evenPrimaryVisibilityRef = useRef<Map<string, number>>(new Map());
  const evenPrimaryRafRef = useRef(0);
  const [evenPrimaryPlayKeys, setEvenPrimaryPlayKeys] = useState<Set<string>>(() => new Set());
  const [evenPrimaryPlayOrder, setEvenPrimaryPlayOrder] = useState<string[]>([]);
  const [secondAutoplayReady, setSecondAutoplayReady] = useState(false);
  const secondAutoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const reportEvenPrimaryVisibility = useCallback((key: string, ratio: number) => {
    if (ratio < 0.08) evenPrimaryVisibilityRef.current.delete(key);
    else evenPrimaryVisibilityRef.current.set(key, ratio);
    if (evenPrimaryRafRef.current) return;
    evenPrimaryRafRef.current = requestAnimationFrame(() => {
      evenPrimaryRafRef.current = 0;
      const picked = [...evenPrimaryVisibilityRef.current.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, DESKTOP_TOP_ROW_AUTOPLAY_MAX)
        .map(([k]) => k);
      const next = new Set(picked);
      setEvenPrimaryPlayKeys((prev) => {
        if (prev.size !== next.size) return next;
        for (const k of next) {
          if (!prev.has(k)) return next;
        }
        return prev;
      });
      setEvenPrimaryPlayOrder((prev) => {
        if (prev.length !== picked.length) return picked;
        for (let i = 0; i < picked.length; i += 1) {
          if (prev[i] !== picked[i]) return picked;
        }
        return prev;
      });
    });
  }, []);

  const allowAutoPlay = sectionInView && !paused;

  useEffect(() => {
    if (secondAutoplayTimerRef.current != null) {
      clearTimeout(secondAutoplayTimerRef.current);
      secondAutoplayTimerRef.current = null;
    }
    secondAutoplayTimerRef.current = setTimeout(() => {
      setSecondAutoplayReady(false);
      secondAutoplayTimerRef.current = null;
    }, 0);
    if (!allowAutoPlay) return;
    secondAutoplayTimerRef.current = setTimeout(() => {
      setSecondAutoplayReady(true);
      secondAutoplayTimerRef.current = null;
    }, DESKTOP_SECOND_AUTOPLAY_DELAY_MS);
    return () => {
      if (secondAutoplayTimerRef.current != null) {
        clearTimeout(secondAutoplayTimerRef.current);
        secondAutoplayTimerRef.current = null;
      }
    };
  }, [allowAutoPlay]);

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
      evenPrimaryVisibilityRef.current.clear();
      setEvenPrimaryPlayKeys(new Set());
      setEvenPrimaryPlayOrder([]);
      setSecondAutoplayReady(false);
      setDesktopSrcKeys(makeDesktopInitialKeys(videos.length));
      if (desktopSrcTimerRef.current) {
        clearTimeout(desktopSrcTimerRef.current);
        desktopSrcTimerRef.current = null;
      }
    };
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [videos.length]);

  useEffect(() => {
    if (isMobile || reduced) return;
    if (!canAttachMedia) return;
    // Ostatak: 1 po 1 u pozadini po BASE listi (duplikat trake ne pokreće novi attach ciklus).
    let idx = 0;
    const tick = () => {
      if (!canAttachMedia) return;
      let nextIndex = -1;
      setDesktopSrcKeys((prev) => {
        while (idx < videos.length) {
          if (!prev.has(String(idx))) {
            nextIndex = idx;
            break;
          }
          idx += 1;
        }
        if (nextIndex === -1) return prev;
        const next = new Set(prev);
        next.add(String(nextIndex));
        idx = nextIndex + 1;
        return next;
      });
      if (nextIndex === -1) return;
      desktopSrcTimerRef.current = setTimeout(
        tick,
        paused ? DESKTOP_ATTACH_PAUSED_STEP_MS : DESKTOP_ATTACH_STEP_MS
      );
    };
    desktopSrcTimerRef.current = setTimeout(tick, DESKTOP_ATTACH_START_DELAY_MS);

    return () => {
      if (desktopSrcTimerRef.current) {
        clearTimeout(desktopSrcTimerRef.current);
        desktopSrcTimerRef.current = null;
      }
    };
  }, [isMobile, reduced, canAttachMedia, paused, videos.length]);

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
            const isPrimaryCopy = i < videos.length;
            const desktopEveryOtherActive =
              playEveryOtherDesktop && !isMobile && isPrimaryCopy && i % 2 === 0;
            const forceEveryOtherDesktop = playEveryOtherDesktop && !isMobile;
            // Telefon: oba reda — autoplay samo na svakom drugom klipu (0,2,4…); učitavanje src i dalje IO za sve kartice.
            const isContestCandidate =
              !forceEveryOtherDesktop &&
              !desktopEveryOtherActive &&
              contestSlots > 0 &&
              i < videos.length &&
              (!isMobile || i % 2 === 0);
            const isEvenPrimaryCandidate = forceEveryOtherDesktop && isPrimaryCopy && i % 2 === 0;
            const useManualSrc = !isMobile;
            const baseKey = String(i % videos.length);
            const manualSrcAttached = useManualSrc && desktopSrcKeys.has(baseKey);
            const evenOrderIndex = evenPrimaryPlayOrder.indexOf(instanceKey);
            const evenAutoplayAllowed =
              evenOrderIndex === 0 || (evenOrderIndex === 1 && secondAutoplayReady);
            return (
              <VideoCard
                key={`${videoSrc}-${i}`}
                instanceKey={instanceKey}
                src={videoSrc}
                reduced={reduced}
                sectionInView={sectionInView}
                canAttach={canAttachMedia}
                lazySrcMode={useManualSrc ? "manual" : "io"}
                manualSrcAttached={manualSrcAttached}
                hoverLoop={hoverLoopEffective}
                tapToPlay={Boolean(isMobile && tapToPlayOnMobile)}
                tapGroup={isMobile ? tapGroup : undefined}
                autoPlayActive={
                  (desktopEveryOtherActive &&
                    allowAutoPlay &&
                    evenPrimaryPlayKeys.has(instanceKey) &&
                    evenAutoplayAllowed) ||
                  (isContestCandidate && winnerKeys.has(instanceKey))
                }
                allowAutoPlay={allowAutoPlay}
                onVisibilityRatio={
                  isEvenPrimaryCandidate
                    ? reportEvenPrimaryVisibility
                    : isContestCandidate
                      ? reportVisibility
                      : undefined
                }
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
  const prewarmInView = useInView(ref, { once: false, amount: 0, margin: SHOWCASE_PREWARM_MARGIN });
  /** Širi „prozor“ da se play/pause ne okida na border skrola (manje treperenja). */
  const inView = useInView(ref, { once: false, amount: 0.16, margin: "40px 0px 60px 0px" });
  const reduced = useReducedMotion();
  const sectionInView = inView ?? false;
  const canAttachMedia = (prewarmInView ?? false) || sectionInView;
  const heroVslHeavy = useDocumentHtmlDataFlag("data-hero-vsl-heavy");

  const reveal = reduced || sectionInView;
  const revealEase = "cubic-bezier(0.22, 1, 0.36, 1)";

  // Keep handoff smooth around boundaries: don't stop marquee until we're fully outside prewarm zone.
  const pauseMarquee = reduced || !canAttachMedia || heroVslHeavy;

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
          canAttachMedia={canAttachMedia}
          hoverLoop
          playEveryOtherDesktop
          tapToPlayOnMobile
          tapGroup="showcase-row1"
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
          canAttachMedia={canAttachMedia}
          disableAutoPlayOnMobile
          tapToPlayOnMobile
          tapGroup="showcase-row2"
        />
      </div>
    </section>
  );
}
