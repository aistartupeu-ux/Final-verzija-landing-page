"use client";

import { useEffect, useMemo, useState } from "react";
import NetworkBackground from "@/components/ui/NetworkBackground";
import { SpotlightCursor } from "@/components/ui/spotlight-cursor";

function isLowEndDevice(): boolean {
  if (typeof window === "undefined") return false;

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;

  // Save-Data hint
  const saveData = typeof navigator !== "undefined"
    && "connection" in navigator
    && !!(navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;

  // Lightweight heuristics: these exist in Chromium-based browsers
  const hw = typeof navigator !== "undefined"
    ? (navigator as unknown as { hardwareConcurrency?: number }).hardwareConcurrency
    : undefined;
  const mem = typeof navigator !== "undefined"
    ? (navigator as unknown as { deviceMemory?: number }).deviceMemory
    : undefined;

  // If user requests reduced motion, or it’s a touch device, or Save-Data is on,
  // or very low CPU/RAM -> disable expensive effects.
  if (reduced || coarse || saveData) return true;
  if (typeof hw === "number" && hw <= 4) return true;
  if (typeof mem === "number" && mem <= 4) return true;

  return false;
}

export default function EffectsGate() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const lowEnd = useMemo(() => (mounted ? isLowEndDevice() : false), [mounted]);

  if (!mounted || lowEnd) return null;

  return (
    <>
      <SpotlightCursor />
      <NetworkBackground />
    </>
  );
}

