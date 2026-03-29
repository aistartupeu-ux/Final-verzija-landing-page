"use client";

import { type RefObject, useEffect, useState } from "react";

const THRESHOLDS = [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

type UseInViewOptions = {
  once?: boolean;
  /** 0–1: smatra se u kadru kad je intersectionRatio >= amount (približno kao framer-motion). */
  amount?: number;
  margin?: string;
};

/**
 * Lagana zamena za framer-motion useInView — samo IntersectionObserver.
 */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  options?: UseInViewOptions
): boolean {
  const { once = false, amount = 0, margin = "0px" } = options ?? {};
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

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
      { root: null, rootMargin: margin, threshold: THRESHOLDS }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [ref, once, amount, margin]);

  return inView;
}
