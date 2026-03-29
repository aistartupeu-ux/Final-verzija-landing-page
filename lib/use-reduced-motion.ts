"use client";

import { useSyncExternalStore } from "react";

function subscribeReduced(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Zamena za framer-motion useReducedMotion — bez dodatnog bundle-a. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, getReducedMotionSnapshot, () => false);
}
