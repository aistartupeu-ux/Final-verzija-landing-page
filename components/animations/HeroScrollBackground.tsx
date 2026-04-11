"use client";

import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type HeroScrollBackgroundProps = {
  triggerRef: RefObject<HTMLElement | null>;
  sequenceBaseUrl?: string;
  framePattern?: string;
  frameCount?: number;
  frameStep?: number;
  frameCountMode?: "total" | "maxIndex";
  frameUrls?: string[];
  videoFallbackUrl?: string;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  overlayOpacity?: number;
  lockScrollUntilComplete?: boolean;
  lockDistanceVh?: number;
};

const DEFAULT_START = "top top";
const DEFAULT_END = "bottom top";
const DEFAULT_SCRUB = 0.9;
const DEFAULT_OVERLAY_OPACITY = 0.34;
const INITIAL_PRELOAD_COUNT = 18;
const NEARBY_PREFETCH_RADIUS = 10;
const FRAME_EASING = 0.18;
const MIN_FRAME_DELTA_TO_DRAW = 0.08;
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

type AdaptiveSettings = {
  renderScale: number;
  preloadCount: number;
  prefetchRadius: number;
  frameEasing: number;
  minFrameDelta: number;
  maxConcurrentLoads: number;
  maxCachedFrames: number;
  enableFrameBlend: boolean;
  scrub: boolean | number;
  lockDistanceVh: number;
};

function getAdaptiveSettings(
  baseScrub: boolean | number,
  baseLockDistanceVh: number
): AdaptiveSettings {
  if (typeof window === "undefined") {
    return {
      renderScale: 1.6,
      preloadCount: INITIAL_PRELOAD_COUNT,
      prefetchRadius: NEARBY_PREFETCH_RADIUS,
      frameEasing: FRAME_EASING,
      minFrameDelta: MIN_FRAME_DELTA_TO_DRAW,
      maxConcurrentLoads: 5,
      maxCachedFrames: 80,
      enableFrameBlend: true,
      scrub: baseScrub,
      lockDistanceVh: baseLockDistanceVh,
    };
  }

  const width = window.innerWidth;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const cpuCores = navigator.hardwareConcurrency ?? 4;

  if (width <= MOBILE_BREAKPOINT || isCoarsePointer) {
    return {
      renderScale: 1.05,
      preloadCount: 10,
      prefetchRadius: 6,
      frameEasing: 0.24,
      minFrameDelta: 0.12,
      maxConcurrentLoads: 3,
      maxCachedFrames: 36,
      enableFrameBlend: false,
      scrub: typeof baseScrub === "number" ? Math.max(baseScrub, 1.45) : 1.45,
      lockDistanceVh: Math.max(180, Math.min(baseLockDistanceVh, 210)),
    };
  }

  if (width <= TABLET_BREAKPOINT || deviceMemory <= 4 || cpuCores <= 6) {
    return {
      renderScale: 1.25,
      preloadCount: 13,
      prefetchRadius: 8,
      frameEasing: 0.2,
      minFrameDelta: 0.1,
      maxConcurrentLoads: 4,
      maxCachedFrames: 52,
      enableFrameBlend: true,
      scrub: typeof baseScrub === "number" ? Math.max(baseScrub, 1.25) : 1.25,
      lockDistanceVh: Math.max(200, Math.min(baseLockDistanceVh, 230)),
    };
  }

  return {
    renderScale: 1.6,
    preloadCount: INITIAL_PRELOAD_COUNT,
    prefetchRadius: NEARBY_PREFETCH_RADIUS,
    frameEasing: FRAME_EASING,
    minFrameDelta: MIN_FRAME_DELTA_TO_DRAW,
    maxConcurrentLoads: 6,
    maxCachedFrames: 96,
    enableFrameBlend: true,
    scrub: baseScrub,
    lockDistanceVh: baseLockDistanceVh,
  };
}

function isAbsoluteHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function easeInOutSine(value: number): number {
  const t = clamp01(value);
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function joinUrl(baseUrl: string, pathOrFile: string): string {
  if (!baseUrl) return pathOrFile;
  return `${baseUrl.replace(/\/+$/, "")}/${pathOrFile.replace(/^\/+/, "")}`;
}

function buildFrameUrls({
  sequenceBaseUrl,
  framePattern,
  frameCount,
  frameStep = 1,
  frameCountMode = "total",
}: {
  sequenceBaseUrl?: string;
  framePattern?: string;
  frameCount?: number;
  frameStep?: number;
  frameCountMode?: "total" | "maxIndex";
}): string[] {
  if (!framePattern || frameCount === undefined || frameCount < 0) return [];

  const sourcePattern = isAbsoluteHttpUrl(framePattern)
    ? framePattern
    : sequenceBaseUrl
      ? joinUrl(sequenceBaseUrl, framePattern)
      : framePattern;

  const queryIndex = sourcePattern.indexOf("?");
  const baseWithoutQuery = queryIndex >= 0 ? sourcePattern.slice(0, queryIndex) : sourcePattern;
  const querySuffix = queryIndex >= 0 ? sourcePattern.slice(queryIndex) : "";
  const lastSlashIndex = baseWithoutQuery.lastIndexOf("/");
  const fileName =
    lastSlashIndex >= 0 ? baseWithoutQuery.slice(lastSlashIndex + 1) : baseWithoutQuery;

  const frameScopedMatch = fileName.match(/(frame[_-]?)(\d+)/i);
  const numericMatch = frameScopedMatch
    ? { digits: frameScopedMatch[2], indexInFile: frameScopedMatch.index! + frameScopedMatch[1].length }
    : (() => {
        const generic = fileName.match(/\d+/);
        if (!generic || generic.index === undefined) return null;
        return { digits: generic[0], indexInFile: generic.index };
      })();

  if (!numericMatch) {
    return [sourcePattern];
  }

  const numericToken = numericMatch.digits;
  const startNumber = Number.parseInt(numericToken, 10);
  const padLength = numericToken.length;
  const absoluteTokenStart = (lastSlashIndex >= 0 ? lastSlashIndex + 1 : 0) + numericMatch.indexInFile;
  const prefix = sourcePattern.slice(0, absoluteTokenStart);
  const suffix = baseWithoutQuery.slice(absoluteTokenStart + numericToken.length) + querySuffix;

  const safeStep = Math.max(1, frameStep);
  const length =
    frameCountMode === "maxIndex"
      ? Math.floor((frameCount - startNumber) / safeStep) + 1
      : frameCount;
  if (length <= 0) return [];

  return Array.from({ length }, (_, i) => {
    const current = String(startNumber + i * safeStep).padStart(padLength, "0");
    return `${prefix}${current}${suffix}`;
  });
}

export default function HeroScrollBackground({
  triggerRef,
  sequenceBaseUrl,
  framePattern,
  frameCount,
  frameStep = 1,
  frameCountMode = "total",
  frameUrls,
  videoFallbackUrl,
  start = DEFAULT_START,
  end = DEFAULT_END,
  scrub = DEFAULT_SCRUB,
  overlayOpacity = DEFAULT_OVERLAY_OPACITY,
  lockScrollUntilComplete = false,
  lockDistanceVh = 220,
}: HeroScrollBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const lastUsedFrameRef = useRef<Map<number, number>>(new Map());
  const pendingLoadsRef = useRef<Set<number>>(new Set());
  const loadQueueRef = useRef<number[]>([]);
  const activeLoadsRef = useRef(0);
  const failedRef = useRef<Set<number>>(new Set());
  const activeFrameRef = useRef(0);
  const frameTargetRef = useRef(0);
  const scrollProgressRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [hasAnyFrameLoaded, setHasAnyFrameLoaded] = useState(false);

  const resolvedFrameUrls = useMemo(() => {
    if (frameUrls && frameUrls.length > 0) return frameUrls;
    return buildFrameUrls({
      sequenceBaseUrl,
      framePattern,
      frameCount,
      frameStep,
      frameCountMode,
    });
  }, [frameUrls, sequenceBaseUrl, framePattern, frameCount, frameStep, frameCountMode]);

  const maxFrameIndex = Math.max(0, resolvedFrameUrls.length - 1);

  const drawCoverFrame = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    alpha = 1
  ) => {
    const canvas = ctx.canvas;
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = image.naturalWidth || image.width;
    const ih = image.naturalHeight || image.height;
    if (!iw || !ih || !cw || !ch) return;

    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) * 0.5;
    const dy = (ch - dh) * 0.5;

    ctx.globalAlpha = alpha;
    ctx.drawImage(image, dx, dy, dw, dh);
    ctx.globalAlpha = 1;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const adaptive = getAdaptiveSettings(scrub, lockDistanceVh);

    const markFrameUsage = (index: number) => {
      lastUsedFrameRef.current.set(index, performance.now());
    };

    const evictFramesIfNeeded = (keepCenterIndex: number) => {
      const cache = imagesRef.current;
      if (cache.size <= adaptive.maxCachedFrames) return;
      const entries = [...cache.keys()];
      entries.sort((a, b) => {
        const distDelta = Math.abs(b - keepCenterIndex) - Math.abs(a - keepCenterIndex);
        if (distDelta !== 0) return distDelta;
        const ta = lastUsedFrameRef.current.get(a) ?? 0;
        const tb = lastUsedFrameRef.current.get(b) ?? 0;
        return ta - tb;
      });
      while (cache.size > adaptive.maxCachedFrames && entries.length > 0) {
        const indexToDrop = entries.shift();
        if (indexToDrop === undefined) break;
        cache.delete(indexToDrop);
        lastUsedFrameRef.current.delete(indexToDrop);
      }
    };

    const pumpLoadQueue = () => {
      while (
        activeLoadsRef.current < adaptive.maxConcurrentLoads &&
        loadQueueRef.current.length > 0
      ) {
        const nextIndex = loadQueueRef.current.shift();
        if (nextIndex === undefined) break;
        if (
          nextIndex < 0 ||
          nextIndex > maxFrameIndex ||
          imagesRef.current.has(nextIndex) ||
          failedRef.current.has(nextIndex)
        ) {
          pendingLoadsRef.current.delete(nextIndex);
          continue;
        }

        const src = resolvedFrameUrls[nextIndex];
        if (!src) {
          pendingLoadsRef.current.delete(nextIndex);
          continue;
        }

        activeLoadsRef.current += 1;
        const image = new Image();
        image.decoding = "async";
        image.loading = "eager";
        image.src = src;
        image.onload = () => {
          activeLoadsRef.current = Math.max(0, activeLoadsRef.current - 1);
          pendingLoadsRef.current.delete(nextIndex);
          imagesRef.current.set(nextIndex, image);
          markFrameUsage(nextIndex);
          setHasAnyFrameLoaded(true);
          evictFramesIfNeeded(Math.round(activeFrameRef.current));
          pumpLoadQueue();
        };
        image.onerror = () => {
          activeLoadsRef.current = Math.max(0, activeLoadsRef.current - 1);
          pendingLoadsRef.current.delete(nextIndex);
          failedRef.current.add(nextIndex);
          pumpLoadQueue();
        };
      }
    };

    const queueFrameLoad = (index: number) => {
      if (index < 0 || index > maxFrameIndex) return;
      if (
        imagesRef.current.has(index) ||
        failedRef.current.has(index) ||
        pendingLoadsRef.current.has(index)
      ) {
        return;
      }
      pendingLoadsRef.current.add(index);
      loadQueueRef.current.push(index);
      pumpLoadQueue();
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.max(1, Math.min((window.devicePixelRatio || 1) * adaptive.renderScale, 2));
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
      }
      renderFrame(activeFrameRef.current);
    };

    const renderBlendedFrame = (frameValue: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const lowerIndex = Math.floor(frameValue);
      const upperIndex = Math.min(maxFrameIndex, Math.ceil(frameValue));
      const blend = frameValue - lowerIndex;

      const lowerImage = imagesRef.current.get(lowerIndex);
      const upperImage = imagesRef.current.get(upperIndex);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (
        adaptive.enableFrameBlend &&
        lowerImage &&
        upperImage &&
        upperIndex !== lowerIndex
      ) {
        drawCoverFrame(ctx, lowerImage, 1 - blend);
        drawCoverFrame(ctx, upperImage, blend);
        markFrameUsage(lowerIndex);
        markFrameUsage(upperIndex);
        return;
      }

      const directImage = lowerImage ?? upperImage;
      if (directImage) {
        drawCoverFrame(ctx, directImage, 1);
        markFrameUsage(lowerImage ? lowerIndex : upperIndex);
        return;
      }

      const fallbackIndex = Math.round(frameValue);
      for (let radius = 1; radius < resolvedFrameUrls.length; radius += 1) {
        const prev = fallbackIndex - radius;
        const next = fallbackIndex + radius;
        const prevImage = imagesRef.current.get(prev);
        const nextImage = imagesRef.current.get(next);
        if (prevImage) {
          drawCoverFrame(ctx, prevImage, 1);
          markFrameUsage(prev);
          return;
        }
        if (nextImage) {
          drawCoverFrame(ctx, nextImage, 1);
          markFrameUsage(next);
          return;
        }
      }
    };

    function renderFrame(frameValue: number) {
      renderBlendedFrame(frameValue);
    }

    const tick = () => {
      const target = Math.max(0, Math.min(maxFrameIndex, frameTargetRef.current));
      const current = activeFrameRef.current;
      const nextValue = current + (target - current) * adaptive.frameEasing;
      const delta = Math.abs(target - nextValue);

      const stableValue = delta < adaptive.minFrameDelta ? target : nextValue;
      activeFrameRef.current = stableValue;

      renderFrame(stableValue);

      const lowerIndex = Math.floor(stableValue);
      const upperIndex = Math.min(maxFrameIndex, Math.ceil(stableValue));
      const nextIndex = Math.round(stableValue);
      queueFrameLoad(lowerIndex);
      queueFrameLoad(upperIndex);
      for (let i = 1; i <= adaptive.prefetchRadius; i += 1) {
        queueFrameLoad(nextIndex + i);
        queueFrameLoad(nextIndex - i);
      }
      evictFramesIfNeeded(nextIndex);

      const shouldContinue = Math.abs(target - stableValue) > adaptive.minFrameDelta;
      if (shouldContinue) {
        rafRef.current = window.requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    gsap.registerPlugin(ScrollTrigger);

    for (let i = 0; i < Math.min(adaptive.preloadCount, resolvedFrameUrls.length); i += 1) {
      queueFrameLoad(i);
    }

    const triggerElement = triggerRef.current ?? container;
    const trigger = ScrollTrigger.create({
      trigger: triggerElement,
      start,
      end: lockScrollUntilComplete
        ? `+=${Math.round(window.innerHeight * (adaptive.lockDistanceVh / 100))}`
        : end,
      scrub: adaptive.scrub,
      pin: lockScrollUntilComplete,
      pinSpacing: lockScrollUntilComplete,
      anticipatePin: lockScrollUntilComplete ? 1 : 0,
      onUpdate: (self: { progress: number }) => {
        const easedProgress = easeInOutSine(self.progress);
        scrollProgressRef.current = easedProgress;
        frameTargetRef.current = easedProgress * maxFrameIndex;
        container.style.setProperty(
          "--hero-overlay-dynamic",
          (overlayOpacity - easedProgress * 0.09).toFixed(3)
        );
        container.style.setProperty(
          "--hero-canvas-scale",
          (1.05 - easedProgress * 0.05).toFixed(4)
        );
        if (rafRef.current === null) {
          rafRef.current = window.requestAnimationFrame(tick);
        }
      },
    });

    const observer = new ResizeObserver(() => resize());
    observer.observe(container);
    resize();
    container.style.setProperty("--hero-overlay-dynamic", overlayOpacity.toFixed(3));
    container.style.setProperty("--hero-canvas-scale", "1.045");
    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      trigger.kill();
      observer.disconnect();
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [end, maxFrameIndex, resolvedFrameUrls, scrub, start, triggerRef]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          transform: "scale(var(--hero-canvas-scale, 1.045))",
          transformOrigin: "center center",
          transition: "transform 120ms linear",
        }}
      />

      {videoFallbackUrl ? (
        <video
          src={videoFallbackUrl}
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: hasAnyFrameLoaded ? 0 : 1,
            transition: "opacity 220ms ease",
          }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(5, 5, 8, var(--hero-overlay-dynamic, 0.34))",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "26%",
          background: "linear-gradient(to bottom, rgba(5,5,8,0.42), transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "42%",
          background: "linear-gradient(to top, rgba(5,5,8,0.9) 0%, rgba(5,5,8,0.45) 54%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(5,5,8,0.07) 0%, rgba(5,5,8,0.22) 68%, rgba(5,5,8,0.7) 100%)",
        }}
      />
    </div>
  );
}
