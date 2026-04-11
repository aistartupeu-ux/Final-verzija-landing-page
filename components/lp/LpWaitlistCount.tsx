"use client";

import { useWaitlistLiveCount } from "@/lib/use-waitlist-live-count";

/** Live broj sa servera: WAITLIST_DISPLAY_BASE (default 9000) + stvarni upisi u `leads`. */
export default function LpWaitlistCount({ min, suffix }: { min?: number; suffix?: string }) {
  const { display } = useWaitlistLiveCount({ min, pollIntervalMs: 35_000 });
  return (
    <>
      {display}
      {suffix ?? ""}
    </>
  );
}
