"use client";

import { useEffect, useMemo, useState } from "react";

// Match "live" waitlist behavior from SocialProofSection
const WAITLIST_START_DATE = new Date(2026, 2, 11, 0, 0, 0); // 11. mart 2026
const WAITLIST_START_VALUE = 1200;

function getDaysSinceStart(d: Date): number {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const start = new Date(WAITLIST_START_DATE.getFullYear(), WAITLIST_START_DATE.getMonth(), WAITLIST_START_DATE.getDate()).getTime();
  return Math.floor((day - start) / 86400000);
}

function getDailyLimit(dayIndex: number): number {
  const base = 25;
  const spread = 16;
  return base + ((dayIndex * 7919 + 31) % spread);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function computeWaitlistCount(now: Date): number {
  const daysSinceStart = getDaysSinceStart(now);
  if (daysSinceStart < 0) return WAITLIST_START_VALUE;

  let baseAtMidnight = WAITLIST_START_VALUE;
  for (let i = 0; i < daysSinceStart; i++) baseAtMidnight += getDailyLimit(i);

  const todayLimit = getDailyLimit(daysSinceStart);
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const progress = easeInOut((now.getTime() - midnight) / 86400000);
  const todayAdded = Math.floor(progress * todayLimit);
  return baseAtMidnight + todayAdded;
}

function getWaitlistCount(): number {
  const computed = computeWaitlistCount(new Date());

  try {
    const key = "aha_waitlist_max_v1";
    const storedRaw = window.localStorage.getItem(key);
    const stored = storedRaw ? parseInt(storedRaw, 10) : NaN;
    const safe = Number.isFinite(stored) ? Math.max(computed, stored) : computed;
    window.localStorage.setItem(key, String(safe));
    return safe;
  } catch {
    return computed;
  }
}

export default function LpWaitlistCount({ min, suffix }: { min?: number; suffix?: string }) {
  const [waitlist, setWaitlist] = useState(() => {
    if (typeof window === "undefined") return WAITLIST_START_VALUE;
    return getWaitlistCount();
  });

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      setWaitlist(getWaitlistCount());
      t = setTimeout(tick, 120000 + Math.random() * 120000);
    };
    t = setTimeout(tick, 60000 + Math.random() * 60000);
    return () => clearTimeout(t);
  }, []);

  const display = useMemo(() => {
    const v = typeof min === "number" ? Math.max(waitlist, min) : waitlist;
    return `${v}${suffix ?? ""}`;
  }, [min, suffix, waitlist]);

  return <>{display}</>;
}

