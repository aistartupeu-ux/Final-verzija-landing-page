"use client";

import { useRef, useEffect, useLayoutEffect, useState, memo, useCallback } from "react";
import { useInView } from "@/lib/use-in-view";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import NextImage from "next/image";
import { Sparkles } from "lucide-react";
import { getCdnMediaUrl } from "@/lib/cdn-media";
import { useDocumentHtmlDataFlag } from "@/lib/use-html-data-flag";
import { CDN_PATH_SHOWCASE_VIDEOS } from "@/lib/video-cdn-paths";

/** Isti URL kao video, pathname .webm → .webp (poster na CDN-u / public/). */
function posterUrlFromVideoUrl(videoUrl: string): string {
  try {
    if (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")) {
      const u = new URL(videoUrl);
      u.pathname = u.pathname.replace(/\.webm$/i, ".webp");
      return u.href;
    }
  } catch {
    /* fall through */
  }
  return videoUrl.replace(/\.webm(?=$|[?#])/i, ".webp");
}

/** Podrazumevana lista ako stranica ne prosledi URL-ove (skraćeni showcase). */
const DEFAULT_SHOWCASE_VIDEOS = CDN_PATH_SHOWCASE_VIDEOS.map((p) => getCdnMediaUrl(p));

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
    <NextImage
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

/** Retki IO pragovi — izbegava guste setState-ove dok skroluješ preko sekcije (useInView podrazumevano koristi ~17 pragova). */
const SHOWCASE_INVIEW_THRESHOLDS = [0, 0.16, 0.35, 0.55, 0.75, 1] as const;
/**
 * Light-strip (telefon/tablet): histeresis za jedan `<video src>`.
 * — Drži trenutnu karticu dok ima bar ovoliko vidljive površine (video „radi do kraja“).
 * — Sledeća mora da bude za ovoliko viša po površini da preuzme pre vremena (manje treperenja).
 * — Kandidat sa bilo kakvim presekom ulazi u igru (ivica u kadru = počinje učitavanje u sledećem tick-u).
 */
/** Koliko često biramo aktivni slot na touch / tablet traci (marquee). */
const MOBILE_VIDEO_PICK_MS = 420;
/** Trajanje jednog kruga automatske trake (s); skalira se sa brojem klipova. */
const SHOWCASE_MARQUEE_BASE_S = 38;
const SHOWCASE_MARQUEE_PER_CARD_S = 3.2;
/** Minimalan horizontalni udeo širine kartice u preseku sa root-om za autoplay ranking (ivica u kadar). */
const VISIBILITY_AUTOPLAY_MIN_H_FRAC = 0.002;
const DEFAULT_MAX_AUTOPLAY_DESKTOP = 3;
const DEFAULT_MAX_AUTOPLAY_MOBILE = 2;
/** Koliko često računamo vidljivost kartica (polling; ređe = manje getBoundingClientRect pri skrolu stranice). */
const VISIBILITY_POLL_MS = 750;
/** Desktop/light-strip: koliko px širimo root levo-desno da se media kači pre ulaska u kadar (~2 kartice). */
const SHOWCASE_HORIZONTAL_PREFETCH_PX = 520;
/** Desktop: periodično ponovo zakači vidljive kartice (hvata ref/layout bez skrola). */
const DESKTOP_ATTACH_POLL_MS = 650;
/** Koliko ranije (van viewport-a) kreće prewarm za mobilne uređaje. */
const EARLY_MEDIA_WARM_MARGIN = "1200px 0px 1200px 0px";
/** Mobilni uređaji kače media src ranije kako bi video krenuo odmah po dolasku do sekcije. */
const MOBILE_NEAR_ATTACH_MARGIN = "920px 0px 980px 0px";
const DEFAULT_NEAR_ATTACH_MARGIN = "340px 0px 360px 0px";
const MOBILE_VISIBILITY_POLL_MS = 360;
const MOBILE_ATTACH_PREFETCH_PX = 140;
const MOBILE_MAX_ATTACHED_SLOTS = 1;
const MOBILE_MARQUEE_SLOWDOWN_FACTOR = 1.45;
const MOBILE_POSTER_ONLY_MODE = false;

/** Jedinstven ključ za koju fizičku karticu (prva ili druga kopija u loop-u) drži `<video src>` na mobilnom. */
function mobileVideoAttachKey(segment: "first" | "second", baseIdx: number): string {
  return `${segment}-${baseIdx}`;
}

function horizontalOverlapWidthPx(el: HTMLElement, sr: DOMRect): number {
  const er = el.getBoundingClientRect();
  return Math.max(0, Math.min(er.right, sr.right) - Math.max(er.left, sr.left));
}

/** Širi „prozor“ levo-desno da se `<video src>` kači pre nego što kartica uđe u pravi kadar (desktop + light-strip pick). */
function horizontalOverlapWithPrefetchPx(
  el: HTMLElement,
  root: HTMLElement,
  expandX: number
): number {
  const sr = root.getBoundingClientRect();
  const left = sr.left - expandX;
  const right = sr.right + expandX;
  const er = el.getBoundingClientRect();
  return Math.max(0, Math.min(er.right, right) - Math.max(er.left, left));
}

/** Udeo širine kartice koji je u horizontalnom preseku sa root rect-om (ivica do ivice root-a). */
function horizontalVisibleWidthFraction(el: HTMLElement, sr: DOMRect): number {
  const iw = horizontalOverlapWidthPx(el, sr);
  const er = el.getBoundingClientRect();
  if (er.width <= 0) return 0;
  return iw / er.width;
}

/** Laptop/desktop: ručni skrol + pun desktop režim. Ostalo: automatski marquee + jedan video (posteri). */
function getShowcaseDesktopLike(): boolean {
  if (globalThis.window === undefined) return true;
  return (
    globalThis.window.matchMedia("(min-width: 1100px)").matches &&
    globalThis.window.matchMedia("(hover: hover)").matches &&
    globalThis.window.matchMedia("(pointer: fine)").matches
  );
}

/**
 * Jedna horizontalna traka: ista lista klipova renderuje se dva puta uzastopno u istom flex redu.
 * To nije „drugi red“ — standard je za beskonačni skrol: kad `scrollLeft` pređe pola širine, pomerimo ga za −half
 * i korisnik vidi isti sadržaj (šav je nevidljiv). `showcaseLoopSegment` razlikuje dve ćelije istog indeksa za ref/IO.
 */
const VideoCard = memo(function VideoCard({
  src,
  mp4FallbackSrc,
  posterUrl,
  reduced,
  sectionInView,
  canAttach = sectionInView,
  manualSrcAttached = false,
  hoverLoop = false,
  autoPlayActive = false,
  allowAutoPlay = true,
  showcaseBaseIndex,
  showcaseLoopSegment,
  registerShowcaseCard,
  posterAsPlaceholder = false,
  posterLoading = "lazy",
}: Readonly<{
  src: string;
  mp4FallbackSrc?: string;
  posterUrl: string;
  reduced: boolean;
  sectionInView: boolean;
  canAttach?: boolean;
  manualSrcAttached?: boolean;
  hoverLoop?: boolean;
  autoPlayActive?: boolean;
  allowAutoPlay?: boolean;
  showcaseBaseIndex?: number;
  showcaseLoopSegment?: "first" | "second";
  registerShowcaseCard?: (baseIndex: number, segment: "first" | "second", el: HTMLDivElement | null) => void;
  /** Mobil: kad nema video src, prikaži WebP poster umesto loga — brz paint, bez dekodera. */
  posterAsPlaceholder?: boolean;
  posterLoading?: "eager" | "lazy";
}>) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [videoSrc, setVideoSrc] = useState(src);
  const [hoverAttached, setHoverAttached] = useState(false);
  const [hoverPlaying, setHoverPlaying] = useState(false);
  const [posterUnderlayFailed, setPosterUnderlayFailed] = useState(false);
  const [posterPlaceholderFailed, setPosterPlaceholderFailed] = useState(false);
  const [videoHasRenderableFrame, setVideoHasRenderableFrame] = useState(false);
  const errorRetries = useRef(0);
  const triedFallbackRef = useRef(false);

  useEffect(() => {
    const id = globalThis.window.requestAnimationFrame(() => {
      setPosterUnderlayFailed(false);
      setPosterPlaceholderFailed(false);
      setVideoHasRenderableFrame(false);
    });
    return () => globalThis.window.cancelAnimationFrame(id);
  }, [posterUrl, src]);

  const effectiveSrcAttached = Boolean(
    canAttach && (manualSrcAttached || hoverAttached) && !reduced && !failed
  );

  useEffect(() => {
    if (effectiveSrcAttached) return;
    const id = globalThis.window.requestAnimationFrame(() => {
      setVideoHasRenderableFrame(false);
    });
    return () => globalThis.window.cancelAnimationFrame(id);
  }, [effectiveSrcAttached]);

  const setCardEl = useCallback(
    (el: HTMLDivElement | null) => {
      cardRef.current = el;
      if (showcaseBaseIndex !== undefined && showcaseLoopSegment && registerShowcaseCard) {
        registerShowcaseCard(showcaseBaseIndex, showcaseLoopSegment, el);
      }
    },
    [showcaseBaseIndex, showcaseLoopSegment, registerShowcaseCard]
  );

  const shouldPlay =
    (hoverLoop && hoverPlaying && sectionInView) ||
    (autoPlayActive && allowAutoPlay);
  const videoPreload = shouldPlay ? "auto" : "metadata";

  useEffect(() => {
    const v = videoRef.current;
    if (!v || failed || !effectiveSrcAttached) return;
    /* iOS/mobile: van aktivnog slota držimo samo metadata preload radi manjeg memory/network pritiska. */
    v.preload = videoPreload;
    if (shouldPlay) {
      void v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [shouldPlay, failed, effectiveSrcAttached, videoSrc, videoPreload]);

  /** Safari/WebKit: kratak seek kad krene repro da se iscrta kadar (samo kad stvarno puštamo). */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || failed || !effectiveSrcAttached || !shouldPlay) return;
    try {
      v.currentTime = 0.001;
    } catch {
      /* ignore */
    }
  }, [shouldPlay, failed, effectiveSrcAttached]);

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterUrl}
          alt=""
          width={400}
          height={712}
          decoding="async"
          loading={posterLoading}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            background: VIDEO_CARD_BG,
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={setCardEl}
      className="video-card"
      data-showcase-base={showcaseBaseIndex !== undefined ? String(showcaseBaseIndex) : undefined}
      data-showcase-segment={showcaseLoopSegment}
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
        setHoverAttached(true);
        if (!hoverLoop) return;
        if (!sectionInView) return;
        if (globalThis.window === undefined) return;
        if (!globalThis.window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
        setHoverPlaying(true);
      }}
      onPointerLeave={() => {
        if (!hoverLoop) return;
        setHoverPlaying(false);
      }}
    >
      {!failed && effectiveSrcAttached && (
        <>
          {!posterUnderlayFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterUrl}
              alt=""
              width={400}
              height={712}
              decoding="async"
              loading={posterLoading}
              draggable={false}
              onError={() => setPosterUnderlayFailed(true)}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                pointerEvents: "none",
                background: VIDEO_CARD_BG,
              }}
            />
          ) : (
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                background: VIDEO_CARD_BG,
              }}
            />
          )}
          <video
          ref={videoRef}
          src={videoSrc}
          muted
          loop={shouldPlay}
          playsInline
          disableRemotePlayback
          preload={videoPreload}
          onError={() => {
            if (
              mp4FallbackSrc &&
              !triedFallbackRef.current &&
              videoSrc !== mp4FallbackSrc
            ) {
              triedFallbackRef.current = true;
              errorRetries.current = 0;
              setVideoHasRenderableFrame(false);
              setVideoSrc(mp4FallbackSrc);
              return;
            }
            if (errorRetries.current >= 1) {
              setFailed(true);
              return;
            }
            errorRetries.current += 1;
            try {
              const u = videoSrc.startsWith("http")
                ? new URL(videoSrc)
                : new URL(
                    videoSrc,
                    globalThis.window?.location.href ?? "https://local.invalid"
                  );
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
          onPlaying={() => setVideoHasRenderableFrame(true)}
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (!v) return;
            try {
              if (!shouldPlay) v.pause();
            } catch {
              /* ignore */
            }
          }}
          onLoadedData={() => {
            setVideoHasRenderableFrame(true);
            if (!shouldPlay) videoRef.current?.pause();
          }}
          onCanPlay={() => {
            setVideoHasRenderableFrame(true);
            if (!shouldPlay) videoRef.current?.pause();
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            position: "absolute",
            inset: 0,
            zIndex: 1,
            backgroundColor: "transparent",
            opacity: videoHasRenderableFrame ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
        />
        </>
      )}
      {!failed && !effectiveSrcAttached && posterAsPlaceholder && (
        <>
          {!posterPlaceholderFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterUrl}
              alt=""
              width={400}
              height={712}
              decoding="async"
              loading={posterLoading}
              draggable={false}
              onError={() => setPosterPlaceholderFailed(true)}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                pointerEvents: "none",
                background: VIDEO_CARD_BG,
              }}
            />
          ) : (
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
        </>
      )}
      {!failed && !effectiveSrcAttached && !posterAsPlaceholder && (
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
      {failed && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          {/* Ako video ne može da se pusti (codec/network), zadrži vizuelni kvalitet preko postera umesto logo fallback-a. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterUrl}
            alt=""
            width={400}
            height={712}
            decoding="async"
            loading="lazy"
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              background: VIDEO_CARD_BG,
            }}
          />
        </div>
      )}
    </div>
  );
});

function VideoRow({
  videos,
  posterSrcByBaseIndex,
  mp4SrcByBaseIndex,
  paused = false,
  reduced,
  sectionInView,
  canAttachMedia,
  maxConcurrentAutoplayDesktop = DEFAULT_MAX_AUTOPLAY_DESKTOP,
  maxConcurrentAutoplayMobile = DEFAULT_MAX_AUTOPLAY_MOBILE,
}: Readonly<{
  videos: string[];
  posterSrcByBaseIndex?: readonly string[];
  mp4SrcByBaseIndex?: readonly string[];
  paused?: boolean;
  reduced: boolean;
  sectionInView: boolean;
  canAttachMedia: boolean;
  maxConcurrentAutoplayDesktop?: number;
  maxConcurrentAutoplayMobile?: number;
}>) {
  const [isDesktopLike, setIsDesktopLike] = useState(() => getShowcaseDesktopLike());
  const lightStrip = !isDesktopLike;
  const mobilePosterOnly = lightStrip && MOBILE_POSTER_ONLY_MODE;
  const isDesktopLikeRef = useRef(isDesktopLike);
  const lightStripRef = useRef(lightStrip);
  useEffect(() => {
    isDesktopLikeRef.current = isDesktopLike;
    lightStripRef.current = lightStrip;
  }, [isDesktopLike, lightStrip]);

  /** Ista lista dva puta uzastopno — beskonačni horizontalni skrol (isti klipovi, nema novih kartica). */
  const items = [...videos, ...videos];

  const [attachedBaseKeys, setAttachedBaseKeys] = useState<Set<string>>(() => new Set());
  const [mobileAttachedSlotKeys, setMobileAttachedSlotKeys] = useState<Set<string>>(() => new Set());
  const desktopSrcKeys = attachedBaseKeys;

  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const loopGuardRef = useRef(false);
  const userScrolledRef = useRef(false);

  const firstCopyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const secondCopyRefs = useRef<(HTMLDivElement | null)[]>([]);

  const maxSlotsEffective = reduced
    ? 0
    : lightStrip
      ? mobilePosterOnly
        ? 0
        : Math.max(0, maxConcurrentAutoplayMobile)
      : Math.max(0, maxConcurrentAutoplayDesktop);

  const visibilityRef = useRef<Map<string, number>>(new Map());
  const [activePlayKeys, setActivePlayKeys] = useState<Set<string>>(() => new Set());

  const flushActivePick = useCallback(() => {
    if (maxSlotsEffective <= 0) {
      setActivePlayKeys(new Set());
      return;
    }
    const ranked = [...visibilityRef.current.entries()]
      .filter(([, r]) => r >= VISIBILITY_AUTOPLAY_MIN_H_FRAC)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
    const selected: string[] = [];
    const selectedIdx = new Set<number>();
    const n = Math.max(1, videos.length);
    for (const k of ranked) {
      if (selected.length >= maxSlotsEffective) break;
      const idx = Number(k);
      if (Number.isNaN(idx)) continue;
      const prev = (idx - 1 + n) % n;
      const next = (idx + 1) % n;
      if (selectedIdx.has(prev) || selectedIdx.has(next)) continue;
      selected.push(k);
      selectedIdx.add(idx);
    }
    // Fallback: ako je vidljivost takva da ne možemo popuniti budžet bez susednih,
    // popuni ostatak po rangu da ne ostane sekcija "mrtva".
    if (selected.length < maxSlotsEffective) {
      for (const k of ranked) {
        if (selected.length >= maxSlotsEffective) break;
        if (selected.includes(k)) continue;
        selected.push(k);
      }
    }
    const next = new Set(selected);
    setActivePlayKeys((prev) => {
      if (prev.size !== next.size) return next;
      for (const k of next) {
        if (!prev.has(k)) return next;
      }
      return prev;
    });
  }, [maxSlotsEffective, videos.length]);

  const registerShowcaseCard = useCallback((baseIndex: number, segment: "first" | "second", el: HTMLDivElement | null) => {
    if (segment === "first") firstCopyRefs.current[baseIndex] = el;
    else secondCopyRefs.current[baseIndex] = el;
  }, []);

  /** Touch / tablet: jedan `<video src>`; prefetch zona širi root da se slot bira pre ulaska kartice u kadar. */
  const pickMobileVideoSlot = useCallback(() => {
    if (!lightStrip || reduced || !canAttachMedia) return;
    if (mobilePosterOnly) {
      setMobileAttachedSlotKeys(new Set());
      return;
    }
    const root = scrollRef.current;
    if (!root) return;
    const px = MOBILE_ATTACH_PREFETCH_PX;
    const candidates: Array<{ key: string; overlap: number }> = [];
    for (let i = 0; i < videos.length; i += 1) {
      const a = firstCopyRefs.current[i];
      const b = secondCopyRefs.current[i];
      if (a) {
        const overlapA = horizontalOverlapWithPrefetchPx(a, root, px);
        if (overlapA > 0) {
          candidates.push({
            key: mobileVideoAttachKey("first", i),
            overlap: overlapA,
          });
        }
      }
      if (b) {
        const overlapB = horizontalOverlapWithPrefetchPx(b, root, px);
        if (overlapB > 0) {
          candidates.push({
            key: mobileVideoAttachKey("second", i),
            overlap: overlapB,
          });
        }
      }
    }
    candidates.sort((x, y) => y.overlap - x.overlap);
    const nextSlots = new Set(
      candidates.slice(0, MOBILE_MAX_ATTACHED_SLOTS).map((candidate) => candidate.key)
    );
    setMobileAttachedSlotKeys((prev) => {
      if (prev.size !== nextSlots.size) return nextSlots;
      for (const key of nextSlots) {
        if (!prev.has(key)) return nextSlots;
      }
      return prev;
    });
  }, [lightStrip, reduced, canAttachMedia, videos.length, mobilePosterOnly]);

  const mobilePickRafRef = useRef(0);
  const scheduleMobileVideoPick = useCallback(() => {
    if (!lightStrip || reduced || !canAttachMedia) return;
    if (mobilePickRafRef.current) return;
    mobilePickRafRef.current = requestAnimationFrame(() => {
      mobilePickRafRef.current = 0;
      pickMobileVideoSlot();
    });
  }, [lightStrip, reduced, canAttachMedia, pickMobileVideoSlot]);

  const pollPrimaryVisibility = useCallback(() => {
    if (maxSlotsEffective <= 0) return;
    const root = scrollRef.current;
    if (!root) return;
    const sr = root.getBoundingClientRect();
    visibilityRef.current.clear();
    for (let i = 0; i < videos.length; i += 1) {
      let best = 0;
      const a = firstCopyRefs.current[i];
      const b = secondCopyRefs.current[i];
      if (a) best = Math.max(best, horizontalVisibleWidthFraction(a, sr));
      if (b) best = Math.max(best, horizontalVisibleWidthFraction(b, sr));
      if (best >= VISIBILITY_AUTOPLAY_MIN_H_FRAC) {
        visibilityRef.current.set(String(i), best);
      }
    }
    flushActivePick();
  }, [videos.length, maxSlotsEffective, flushActivePick]);

  /** Desktop: kači `<video src>` u proširenoj zoni (prefetch) da ne čeka skrol do ivice kadra. */
  const attachVisibleDesktopCards = useCallback(() => {
    if (lightStrip || reduced || !canAttachMedia) return;
    const root = scrollRef.current;
    if (!root) return;
    const px = SHOWCASE_HORIZONTAL_PREFETCH_PX;
    const toAdd: string[] = [];
    for (let i = 0; i < videos.length; i += 1) {
      const a = firstCopyRefs.current[i];
      const b = secondCopyRefs.current[i];
      const aHit = a ? horizontalOverlapWithPrefetchPx(a, root, px) > 0 : false;
      const bHit = b ? horizontalOverlapWithPrefetchPx(b, root, px) > 0 : false;
      if (aHit || bHit) {
        toAdd.push(String(i));
      }
    }
    if (toAdd.length === 0) return;
    setAttachedBaseKeys((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const k of toAdd) {
        if (!next.has(k)) {
          next.add(k);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [lightStrip, reduced, canAttachMedia, videos.length]);

  const desktopAttachRafRef = useRef(0);
  const scheduleDesktopAttachVisible = useCallback(() => {
    if (lightStrip || reduced || !canAttachMedia) return;
    if (desktopAttachRafRef.current) return;
    desktopAttachRafRef.current = requestAnimationFrame(() => {
      desktopAttachRafRef.current = 0;
      attachVisibleDesktopCards();
    });
  }, [lightStrip, reduced, canAttachMedia, attachVisibleDesktopCards]);

  const desktopVisibilityRafRef = useRef(0);
  const scheduleDesktopVisibilityPick = useCallback(() => {
    if (lightStrip || reduced || !canAttachMedia || maxSlotsEffective <= 0) return;
    if (desktopVisibilityRafRef.current) return;
    desktopVisibilityRafRef.current = requestAnimationFrame(() => {
      desktopVisibilityRafRef.current = 0;
      pollPrimaryVisibility();
    });
  }, [lightStrip, reduced, canAttachMedia, maxSlotsEffective, pollPrimaryVisibility]);

  useEffect(() => {
    if (!sectionInView || maxSlotsEffective <= 0 || reduced || paused) return;
    const first = globalThis.window.requestAnimationFrame(() => {
      pollPrimaryVisibility();
    });
    const pollMs = lightStripRef.current ? MOBILE_VISIBILITY_POLL_MS : VISIBILITY_POLL_MS;
    const id = globalThis.window.setInterval(pollPrimaryVisibility, pollMs);
    return () => {
      globalThis.window.cancelAnimationFrame(first);
      globalThis.window.clearInterval(id);
    };
  }, [sectionInView, maxSlotsEffective, reduced, paused, pollPrimaryVisibility]);

  const allowAutoPlay = sectionInView && !paused;

  useEffect(() => {
    if (maxSlotsEffective > 0) return;
    visibilityRef.current.clear();
    const id = globalThis.window.requestAnimationFrame(() => {
      setActivePlayKeys(new Set());
    });
    return () => globalThis.window.cancelAnimationFrame(id);
  }, [maxSlotsEffective]);

  // Fail-safe: ako IO/visibility kasne ili omanu na desktopu, inicijalno zakači i aktiviraj prvih N kartica.
  useEffect(() => {
    if (lightStrip || reduced || !canAttachMedia || paused || maxSlotsEffective <= 0) return;
    if (activePlayKeys.size > 0 || attachedBaseKeys.size > 0) return;
    const warm = new Set<string>();
    for (let i = 0; i < Math.min(videos.length, maxSlotsEffective); i += 1) {
      warm.add(String(i));
    }
    if (warm.size === 0) return;
    const id = globalThis.window.requestAnimationFrame(() => {
      setAttachedBaseKeys((prev) => {
        const next = new Set(prev);
        for (const k of warm) next.add(k);
        return next;
      });
      setActivePlayKeys(warm);
    });
    return () => globalThis.window.cancelAnimationFrame(id);
  }, [
    lightStrip,
    reduced,
    canAttachMedia,
    paused,
    maxSlotsEffective,
    videos.length,
    activePlayKeys.size,
    attachedBaseKeys.size,
  ]);

  useEffect(() => {
    const mqW = globalThis.window.matchMedia("(min-width: 1100px)");
    const mqH = globalThis.window.matchMedia("(hover: hover)");
    const mqP = globalThis.window.matchMedia("(pointer: fine)");
    const sync = () => {
      const next = mqW.matches && mqH.matches && mqP.matches;
      setIsDesktopLike(next);
      visibilityRef.current.clear();
      setActivePlayKeys(new Set());
      setAttachedBaseKeys(new Set());
      setMobileAttachedSlotKeys(new Set());
    };
    sync();
    mqW.addEventListener("change", sync);
    mqH.addEventListener("change", sync);
    mqP.addEventListener("change", sync);
    return () => {
      mqW.removeEventListener("change", sync);
      mqH.removeEventListener("change", sync);
      mqP.removeEventListener("change", sync);
    };
  }, [videos.length]);

  useEffect(() => {
    if (!lightStrip || reduced) return;
    if (!canAttachMedia || paused) {
      const id = globalThis.window.requestAnimationFrame(() => {
        setActivePlayKeys(new Set());
        setMobileAttachedSlotKeys(new Set());
      });
      return () => globalThis.window.cancelAnimationFrame(id);
    }
    const first = globalThis.window.requestAnimationFrame(() => {
      pickMobileVideoSlot();
    });
    const id = globalThis.window.setInterval(pickMobileVideoSlot, MOBILE_VIDEO_PICK_MS);
    return () => {
      globalThis.window.cancelAnimationFrame(first);
      globalThis.window.clearInterval(id);
    };
  }, [lightStrip, reduced, canAttachMedia, paused, pickMobileVideoSlot]);

  /** Desktop: IO + višestruko „hvatanje“ ref-ova (često su prazni u prvom layout-u). */
  useLayoutEffect(() => {
    if (lightStrip || reduced || !canAttachMedia) return;
    const root = scrollRef.current;
    if (!root) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          const idx = (en.target as HTMLElement).dataset.showcaseBase;
          if (idx === undefined) continue;
          setAttachedBaseKeys((prev) => {
            if (prev.has(idx)) return prev;
            const next = new Set(prev);
            next.add(idx);
            return next;
          });
        }
      },
      {
        root,
        rootMargin: `0px ${SHOWCASE_HORIZONTAL_PREFETCH_PX}px 0px ${SHOWCASE_HORIZONTAL_PREFETCH_PX}px`,
        threshold: 0,
      }
    );

    const observeAll = () => {
      for (let i = 0; i < videos.length; i += 1) {
        const a = firstCopyRefs.current[i];
        const b = secondCopyRefs.current[i];
        if (a) io.observe(a);
        if (b) io.observe(b);
      }
    };

    observeAll();
    let rafA = 0;
    let rafB = 0;
    rafA = requestAnimationFrame(() => {
      observeAll();
      attachVisibleDesktopCards();
      rafB = requestAnimationFrame(() => {
        observeAll();
        attachVisibleDesktopCards();
      });
    });

    return () => {
      cancelAnimationFrame(rafA);
      cancelAnimationFrame(rafB);
      io.disconnect();
    };
  }, [lightStrip, reduced, canAttachMedia, videos.length, sectionInView, attachVisibleDesktopCards]);

  /** Desktop: dodatni prolazi posle centriranja / fontova — uklanja „rupa“ kad IO promaši prvi frejm. */
  useEffect(() => {
    if (lightStrip || reduced || !canAttachMedia || paused) return;
    const t0 = globalThis.window.setTimeout(() => attachVisibleDesktopCards(), 0);
    const t1 = globalThis.window.setTimeout(() => attachVisibleDesktopCards(), 120);
    const t2 = globalThis.window.setTimeout(() => attachVisibleDesktopCards(), 450);
    return () => {
      globalThis.window.clearTimeout(t0);
      globalThis.window.clearTimeout(t1);
      globalThis.window.clearTimeout(t2);
    };
  }, [lightStrip, reduced, canAttachMedia, paused, videos.length, sectionInView, attachVisibleDesktopCards]);

  useEffect(() => {
    if (lightStrip || reduced || !canAttachMedia || !sectionInView || paused) return;
    const first = globalThis.window.setTimeout(() => attachVisibleDesktopCards(), 0);
    const id = globalThis.window.setInterval(attachVisibleDesktopCards, DESKTOP_ATTACH_POLL_MS);
    return () => {
      globalThis.window.clearTimeout(first);
      globalThis.window.clearInterval(id);
    };
  }, [
    lightStrip,
    reduced,
    canAttachMedia,
    sectionInView,
    paused,
    videos.length,
    attachVisibleDesktopCards,
  ]);

  const runInfiniteScrollLoop = useCallback(() => {
    if (!isDesktopLikeRef.current) return;
    if (loopGuardRef.current) return;
    const el = scrollRef.current;
    const inner = innerRef.current;
    if (!el || !inner || reduced) return;
    const sw = inner.scrollWidth;
    const half = sw / 2;
    if (half < 64) return;
    const left = el.scrollLeft;
    /* Širi „mrtvi“ pojas pre šava = manje subpixel greške; skok malo pre ivice da korisnik ne vidi kraj druge kopije. */
    const buffer = Math.min(120, Math.max(40, half * 0.035));
    const releaseGuard = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          loopGuardRef.current = false;
        });
      });
    };
    if (left >= half - buffer) {
      loopGuardRef.current = true;
      el.scrollLeft = Math.round(left - half);
      releaseGuard();
    } else if (left <= buffer) {
      loopGuardRef.current = true;
      el.scrollLeft = Math.round(left + half);
      releaseGuard();
    }
  }, [reduced]);

  const onScrollLoop = useCallback(() => {
    if (!loopGuardRef.current) {
      userScrolledRef.current = true;
    }
    runInfiniteScrollLoop();
    scheduleDesktopAttachVisible();
    scheduleDesktopVisibilityPick();
    scheduleMobileVideoPick();
  }, [
    runInfiniteScrollLoop,
    scheduleDesktopAttachVisible,
    scheduleDesktopVisibilityPick,
    scheduleMobileVideoPick,
  ]);


  useEffect(() => {
    userScrolledRef.current = false;
  }, [videos.length]);

  useLayoutEffect(() => {
    if (reduced) return;
    const scrollEl = scrollRef.current;
    const inner = innerRef.current;
    if (!scrollEl || !inner) return;

    const tryCenterStrip = () => {
      if (!isDesktopLikeRef.current) return;
      if (userScrolledRef.current) return;
      const sw = scrollEl.scrollWidth;
      if (sw < 64) return;
      const half = sw / 2;
      scrollEl.scrollLeft = Math.max(0, half - scrollEl.clientWidth / 2);
    };

    tryCenterStrip();
    let roRaf = 0;
    const ro = new ResizeObserver(() => {
      if (roRaf) return;
      roRaf = requestAnimationFrame(() => {
        roRaf = 0;
        tryCenterStrip();
        attachVisibleDesktopCards();
        if (lightStripRef.current) pickMobileVideoSlot();
      });
    });
    ro.observe(inner);
    return () => {
      ro.disconnect();
      if (roRaf) cancelAnimationFrame(roRaf);
    };
  }, [
    videos.length,
    reduced,
    canAttachMedia,
    attachVisibleDesktopCards,
    pickMobileVideoSlot,
    mobilePosterOnly,
  ]);

  useLayoutEffect(() => {
    if (!lightStrip || reduced || !canAttachMedia) return;
    const id = globalThis.window.requestAnimationFrame(() => pickMobileVideoSlot());
    return () => globalThis.window.cancelAnimationFrame(id);
  }, [lightStrip, reduced, canAttachMedia, videos.length, pickMobileVideoSlot]);

  const marqueeDurationSec =
    (SHOWCASE_MARQUEE_BASE_S + videos.length * SHOWCASE_MARQUEE_PER_CARD_S) *
    (lightStrip ? MOBILE_MARQUEE_SLOWDOWN_FACTOR : 1);
  const marqueeRunning = !reduced && canAttachMedia && !paused;

  useLayoutEffect(() => {
    if (isDesktopLike) return;
    const el = scrollRef.current;
    if (el) el.scrollLeft = 0;
  }, [isDesktopLike]);

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
      }}
    >
      <style>{`
        /* Bez scroll-snap — inače browser posle programskog loop skoka „povuče“ na snap tačku i deluje kao presek. */
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
        .video-showcase-scroll {
          scroll-snap-type: none;
          scroll-behavior: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.22) transparent;
        }
        .video-showcase-scroll::-webkit-scrollbar { height: 6px; }
        .video-showcase-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 999px;
        }
        @media (prefers-reduced-motion: reduce) {
          .video-showcase-scroll { scroll-behavior: auto; }
          .video-showcase-inner--marquee {
            animation: none !important;
            transform: none !important;
          }
        }
        @keyframes video-showcase-marquee {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
        .video-showcase-inner--marquee {
          animation-name: video-showcase-marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
      `}</style>
      <div
        ref={scrollRef}
        className="video-showcase-scroll"
        aria-label="Primeri radova — automatski se vrti u krug"
        onScroll={onScrollLoop}
        style={{
          width: "100%",
          overflowX: "hidden",
          overflowY: "hidden",
          WebkitOverflowScrolling: undefined,
          overscrollBehaviorX: "contain",
          touchAction: "pan-y",
        }}
      >
        <div
          ref={innerRef}
          className={`video-showcase-inner${!reduced ? " video-showcase-inner--marquee" : ""}`}
          style={{
            display: "flex",
            flexDirection: "row",
            width: "max-content",
            flexShrink: 0,
            ...(!reduced
              ? {
                  animationDuration: `${marqueeDurationSec}s`,
                  animationPlayState: marqueeRunning ? "running" : "paused",
                }
              : {}),
          }}
        >
          {items.map((videoSrc, i) => {
            const baseIdx = i % videos.length;
            const baseKey = String(baseIdx);
            const showcaseLoopSegment: "first" | "second" =
              i < videos.length ? "first" : "second";
            const posterUrl = posterSrcByBaseIndex?.[baseIdx] ?? posterUrlFromVideoUrl(videoSrc);
            const mp4FallbackSrc = mp4SrcByBaseIndex?.[baseIdx];
            const desktopActiveKey = activePlayKeys.has(baseKey);
            const mobileSlotKey = mobileVideoAttachKey(showcaseLoopSegment, baseIdx);
            const mobileCardAttached = mobileAttachedSlotKeys.has(mobileSlotKey);
            const manualSrcAttached = lightStrip
              ? mobilePosterOnly
                ? false
                : mobileCardAttached
              : desktopSrcKeys.has(baseKey) || desktopActiveKey;
            const posterLoading: "eager" | "lazy" = lightStrip
              ? mobileCardAttached
                ? "eager"
                : "lazy"
              : canAttachMedia && (desktopActiveKey || baseIdx < 2)
                ? "eager"
                : "lazy";
            /** Desktop: vidljive kartice autoplay bez potrebe za hover-om (slot-limit štiti performanse). */
            const desktopHoverPlay = false;
            return (
              <VideoCard
                key={`${videoSrc}-${i}`}
                src={videoSrc}
                mp4FallbackSrc={mp4FallbackSrc}
                posterUrl={posterUrl}
                reduced={reduced}
                sectionInView={sectionInView}
                canAttach={mobilePosterOnly ? false : canAttachMedia}
                manualSrcAttached={manualSrcAttached}
                hoverLoop={desktopHoverPlay}
                autoPlayActive={allowAutoPlay && maxSlotsEffective > 0 && desktopActiveKey}
                allowAutoPlay={allowAutoPlay}
                showcaseBaseIndex={baseIdx}
                showcaseLoopSegment={showcaseLoopSegment}
                registerShowcaseCard={registerShowcaseCard}
                posterAsPlaceholder
                posterLoading={posterLoading}
              />
            );
          })}
        </div>
      </div>
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
  videoSrcs = DEFAULT_SHOWCASE_VIDEOS,
  posterSrcs,
  mp4Srcs,
}: Readonly<{
  /** URL-ovi klipova za jednu horizontalnu traku (duplirana sekvenca u komponenti radi seamless loop-a). */
  videoSrcs?: string[];
  /** Potpisani/postojeci poster URL-ovi po istom redosledu kao `videoSrcs`. */
  posterSrcs?: string[];
  /** Opcioni MP4 fallback URL-ovi po istom redosledu kao `videoSrcs` (iOS/Safari). */
  mp4Srcs?: string[];
}>) {
  const stripVideos = videoSrcs;
  const ref = useRef(null);
  const [tabVisible, setTabVisible] = useState(true);
  const [mobileLike, setMobileLike] = useState(false);
  const nearAttachMargin = mobileLike ? MOBILE_NEAR_ATTACH_MARGIN : DEFAULT_NEAR_ATTACH_MARGIN;
  /** Retki pragovi: manje re-rendera dok skroluješ kroz granicu sekcije (glavni uzrok „kočenja“ uz IO). */
  const inView = useInView(ref, {
    once: false,
    amount: 0.16,
    margin: "40px 0px 60px 0px",
    thresholds: SHOWCASE_INVIEW_THRESHOLDS,
  });
  // Ranije zakači media resurse pre ulaska sekcije u viewport.
  const nearInView = useInView(ref, {
    once: false,
    amount: 0,
    margin: nearAttachMargin,
    thresholds: [0, 0.01, 0.05, 0.1, 1] as const,
  });
  const earlyNearInView = useInView(ref, {
    once: false,
    amount: 0,
    margin: EARLY_MEDIA_WARM_MARGIN,
    thresholds: [0, 0.01] as const,
  });
  const reduced = useReducedMotion();
  const sectionInView = inView ?? false;
  /** Prewarm: kačenje <video src> malo pre ulaska u kadar da kartice ne "kasne". */
  const canAttachMedia = nearInView || sectionInView;
  /** Još raniji signal (pre sekcije) za zagrevanje postera/video metadata na telefonu. */
  const canWarmMediaEarly = earlyNearInView || canAttachMedia;
  const heroVslHeavy = useDocumentHtmlDataFlag("data-hero-vsl-heavy");

  useEffect(() => {
    const sync = () => setTabVisible(typeof document !== "undefined" && !document.hidden);
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    const mq = globalThis.window.matchMedia("(max-width: 900px)");
    const sync = () => setMobileLike(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const reveal = reduced || sectionInView;
  const revealEase = "cubic-bezier(0.22, 1, 0.36, 1)";

  // Pauziramo samo kada sekcija nije spremna ili tab nije aktivan.
  // Hero "heavy" više ne gasi showcase skroz, već samo smanjujemo broj aktivnih slotova.
  const pauseMarquee = reduced || !canAttachMedia || !tabVisible;
  const desktopAutoplayBudget = heroVslHeavy ? 1 : 3;
  const mobileAutoplayBudget = 1;
  const postersWarmedRef = useRef(false);
  const videoMetadataWarmedRef = useRef(false);

  // Prefetch postera malo pre ulaska u sekciju da kartice ne budu prazne pri prvom prikazu.
  useEffect(() => {
    if (!canWarmMediaEarly || stripVideos.length === 0) return;
    if (postersWarmedRef.current) return;
    postersWarmedRef.current = true;
    const warmCount = Math.min(stripVideos.length, mobileLike ? 3 : 5);
    for (let i = 0; i < warmCount; i += 1) {
      const src = stripVideos[i];
      if (!src) continue;
      const poster = posterSrcs?.[i] ?? posterUrlFromVideoUrl(src);
      const img = new globalThis.Image();
      img.decoding = "async";
      img.fetchPriority = mobileLike ? "auto" : i < 3 ? "high" : "auto";
      img.src = poster;
    }
  }, [canWarmMediaEarly, stripVideos, posterSrcs, mobileLike]);

  // Telefoni: unapred povuci prvi klip agresivnije + naredni klip metadata.
  useEffect(() => {
    if (!canWarmMediaEarly || stripVideos.length === 0) return;
    if (videoMetadataWarmedRef.current) return;
    if (!mobileLike) return;
    if (MOBILE_POSTER_ONLY_MODE) return;

    videoMetadataWarmedRef.current = true;
    const warmCount = Math.min(stripVideos.length, 1);
    for (let i = 0; i < warmCount; i += 1) {
      const primary = stripVideos[i];
      if (!primary) continue;
      const fallbackMp4 = mp4Srcs?.[i];
      const warmSrc = fallbackMp4 ?? primary;
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.playsInline = true;
      v.src = warmSrc;
      v.load();
    }
  }, [canWarmMediaEarly, stripVideos, mp4Srcs, mobileLike]);

  return (
    <section
      ref={ref}
      className={`video-showcase-section landing-section-y--compact${sectionInView ? " video-showcase-inview" : ""}`}
      style={{
        position: "relative",
        zIndex: 10,
        overflow: "hidden",
        contain: "layout",
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
        className="section-container landing-section-head"
        style={{
          textAlign: "center",
          position: "relative",
          opacity: reveal ? 1 : 0,
          transform: reveal ? "translateY(0)" : "translateY(16px)",
          transition: `opacity 0.55s ${revealEase}, transform 0.55s ${revealEase}`,
        }}
      >
        <div className="landing-eyebrow-pill landing-eyebrow-pill--purple">
          <span className="landing-eyebrow-pill-icon-wrap--purple" aria-hidden>
            <Sparkles size={12} color="#a855f7" />
          </span>
          <span className="landing-eyebrow-pill-label">Primeri radova</span>
        </div>
        <h2 className="landing-display" style={{ marginBottom: 10 }}>
          Ovo ćeš praviti <span className="apple-accent-gradient">unutar kursa.</span>
        </h2>
        <p className="landing-lede landing-measure-copy" style={{ maxWidth: "min(27.5rem, 100%)" }}>
          Sve je napravljeno pomoću AI alata koje ćeš naučiti. Bez prethodnog iskustva.
        </p>
      </div>

      <div
        style={{
          marginBottom: 0,
          opacity: reveal ? 1 : 0,
          transition: `opacity 0.55s ${revealEase} 0.12s`,
        }}
      >
        <VideoRow
          videos={stripVideos}
          posterSrcByBaseIndex={posterSrcs}
          mp4SrcByBaseIndex={mp4Srcs}
          paused={pauseMarquee}
          reduced={reduced}
          sectionInView={sectionInView}
          canAttachMedia={canAttachMedia}
          maxConcurrentAutoplayDesktop={desktopAutoplayBudget}
          maxConcurrentAutoplayMobile={mobileAutoplayBudget}
        />
      </div>
    </section>
  );
}
