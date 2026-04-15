"use client";

import { type RefObject, useEffect, useState } from "react";

const THRESHOLDS = [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

type UseInViewOptions = {
  once?: boolean;
  /** 0–1: smatra se u kadru kad je intersectionRatio >= amount (približno kao framer-motion). */
  amount?: number;
  margin?: string;
  /**
   * Prilagođeni pragovi za IntersectionObserver. Podrazumevano je gust niz (više callback-ova pri skrolu).
   * Za „teške” sekcije prosledi retke pragove npr. [0, 0.16, 0.5, 1] da smanjiš setState tokom skrola.
   */
  thresholds?: readonly number[];
};

/**
 * Lagana zamena za framer-motion useInView — samo IntersectionObserver.
 */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  options?: UseInViewOptions
): boolean {
  const { once = false, amount = 0, margin = "0px", thresholds } = options ?? {};
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const thresholdList = thresholds ?? THRESHOLDS;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const ok = entry.isIntersecting && entry.intersectionRatio >= amount;
        if (ok) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { root: null, rootMargin: margin, threshold: [...thresholdList] }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [ref, once, amount, margin, thresholds]);

  return inView;
}
