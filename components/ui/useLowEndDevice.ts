"use client";

import { useEffect, useMemo, useState } from "react";

export function computeIsLowEndDevice(): boolean {
  if (typeof window === "undefined") return false;

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;

  const saveData =
    typeof navigator !== "undefined" &&
    "connection" in navigator &&
    !!(navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;

  const hw =
    typeof navigator !== "undefined"
      ? (navigator as unknown as { hardwareConcurrency?: number }).hardwareConcurrency
      : undefined;
  const mem =
    typeof navigator !== "undefined"
      ? (navigator as unknown as { deviceMemory?: number }).deviceMemory
      : undefined;

  if (reduced || coarse || saveData) return true;
  if (typeof hw === "number" && hw <= 4) return true;
  if (typeof mem === "number" && mem <= 4) return true;
  return false;
}

export function useLowEndDevice() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return useMemo(() => (mounted ? computeIsLowEndDevice() : false), [mounted]);
}

