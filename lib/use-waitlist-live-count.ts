"use client";

import { useCallback, useEffect, useState } from "react";
import { WAITLIST_REFRESH_EVENT } from "@/lib/waitlist-refresh";

const DEFAULT_BASE = 9000;
const DEFAULT_POLL_MS = 30_000;

type ApiPayload = { total?: number; configured?: boolean };

/**
 * Broj za prikaz = WAITLIST_DISPLAY_BASE (server, default 9000) + broj redova u `leads` (opciono samo posle WAITLIST_COUNT_SINCE_ISO).
 */
export function useWaitlistLiveCount(options: { min?: number; pollIntervalMs?: number } = {}) {
  const { min, pollIntervalMs = DEFAULT_POLL_MS } = options;
  const [total, setTotal] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/public/waitlist-count", { cache: "no-store" });
      const raw = (await res.json()) as ApiPayload;
      const t = typeof raw.total === "number" && Number.isFinite(raw.total) ? raw.total : null;
      if (t == null) return;
      const floor = typeof min === "number" ? min : Number.NEGATIVE_INFINITY;
      setTotal(Math.max(t, floor));
    } catch {
      // zadrži prethodnu vrednost
    }
  }, [min]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), pollIntervalMs);
    const onRefresh = () => void refresh();
    window.addEventListener(WAITLIST_REFRESH_EVENT, onRefresh);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(WAITLIST_REFRESH_EVENT, onRefresh);
    };
  }, [refresh, pollIntervalMs]);

  const display =
    total == null
      ? typeof min === "number"
        ? min
        : DEFAULT_BASE
      : typeof min === "number"
        ? Math.max(total, min)
        : total;

  return { display, refresh };
}
