"use client";

import { useEffect, useState } from "react";
import NetworkBackground from "@/components/ui/NetworkBackground";

function shouldEnableEffects() {
  if (typeof window === "undefined") return false;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return false;

  const saveData =
    typeof navigator !== "undefined" &&
    "connection" in navigator &&
    !!(navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
  if (saveData) return false;

  return true;
}

export default function LpBackgroundEffects() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!shouldEnableEffects()) return;

    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setEnabled(true), { timeout: 1500 });
      return () => w.cancelIdleCallback?.(id);
    }

    const t = window.setTimeout(() => setEnabled(true), 500);
    return () => window.clearTimeout(t);
  }, []);

  if (!enabled) return null;

  return <NetworkBackground />;
}

