"use client";

import { useEffect, useRef } from "react";

/** Prva 4-5 videa koja korisnik vidi kad stigne do VideoShowcaseSection — preload u pozadini da ne koci pri skrolu. */
const PRELOAD_URLS = [
  "/examples/v11.mp4",
  "/examples/v12.mp4",
  "/examples/v9.mp4",
  "/examples/v1.mp4",
  "/examples/v2.mp4",
];

export default function VideoPreloader() {
  const indexRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const conn = (navigator as { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;

    const schedule = () => {
      const cb = (window as { requestIdleCallback?: (fn: () => void, o?: { timeout?: number }) => number }).requestIdleCallback;
      if (typeof cb === "function") {
        return cb(() => startPreload(), { timeout: 2500 });
      }
      return window.setTimeout(startPreload, 2200) as unknown as number;
    };

    const startPreload = () => {
      if (cancelledRef.current || indexRef.current >= PRELOAD_URLS.length) return;

      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("aria-hidden", "true");
      video.style.cssText = "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;";
      document.body.appendChild(video);
      videoRef.current = video;

      const loadNext = () => {
        if (cancelledRef.current) return;
        const i = indexRef.current;
        if (i >= PRELOAD_URLS.length) {
          video.remove();
          videoRef.current = null;
          return;
        }
        video.oncanplaythrough = () => {
          indexRef.current = i + 1;
          loadNext();
        };
        video.onerror = () => {
          indexRef.current = i + 1;
          loadNext();
        };
        video.src = PRELOAD_URLS[i];
      };
      loadNext();
    };

    const id = schedule();
    return () => {
      cancelledRef.current = true;
      videoRef.current?.remove();
      videoRef.current = null;
      if (typeof id === "number") {
        (window as { cancelIdleCallback?: (n: number) => void }).cancelIdleCallback?.(id) ?? clearTimeout(id);
      }
    };
  }, []);

  return null;
}
