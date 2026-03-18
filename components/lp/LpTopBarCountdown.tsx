"use client";

import { useEffect, useMemo, useState } from "react";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function getCountdownParts(targetDateMs: number, nowMs: number) {
  const diff = Math.max(0, targetDateMs - nowMs);
  const d = Math.floor(diff / 864e5);
  const h = Math.floor((diff % 864e5) / 36e5);
  const m = Math.floor((diff % 36e5) / 6e4);
  const s = Math.floor((diff % 6e4) / 1e3);
  return { d, h, m, s, done: diff === 0 };
}

export default function LpTopBarCountdown({
  targetDateMs,
  doneText,
  activeText,
}: {
  targetDateMs: number;
  doneText?: string;
  activeText?: string;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const cd = useMemo(() => getCountdownParts(targetDateMs, nowMs), [targetDateMs, nowMs]);

  if (doneText || activeText) {
    return <>{cd.done ? (doneText ?? "") : (activeText ?? "")}</>;
  }

  const text = `${pad2(cd.d)}:${pad2(cd.h)}:${pad2(cd.m)}:${pad2(cd.s)}`;
  return <span className="lp-countdown">{text}</span>;
}

