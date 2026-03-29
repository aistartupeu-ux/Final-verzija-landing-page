"use client";

import { useEffect } from "react";

/** U pozadini učitava chunkove ispod-fold sekcija da skrol bude glatkiji. */
export default function PreloadSections() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData =
      typeof navigator !== "undefined" &&
      "connection" in navigator &&
      !!(navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduced || saveData) return;

    const work = () => {
      const imports = [
        () => import("@/components/sections/ProblemSection"),
        () => import("@/components/sections/SolutionSection"),
        () => import("@/components/sections/BlogSection"),
        // VideoShowcaseSection: teške kartice — ne prefetchovati u idle; učitava se kad korisnik skroluje
        () => import("@/components/sections/SocialProofSection"),
        () => import("@/components/sections/ForWhoSection"),
        () => import("@/components/sections/HowToEnterSection"),
        () => import("@/components/sections/FAQSection"),
        () => import("@/components/sections/FinalCTASection"),
        () => import("@/components/sections/AffiliateSection"),
      ];

      // Stagger to avoid one big main-thread/network spike.
      let i = 0;
      const tick = () => {
        if (i >= imports.length) return;
        imports[i++]();
        setTimeout(tick, 250);
      };
      tick();
    };

    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(work, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }

    const t = setTimeout(work, 1800);
    return () => clearTimeout(t);
  }, []);
  return null;
}
