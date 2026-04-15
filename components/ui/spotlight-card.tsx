"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SpotlightGlowColor = "blue" | "purple" | "green" | "red" | "orange";

const glowColorMap: Record<SpotlightGlowColor, { base: number; spread: number }> = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
};

export type SpotlightGlowCardProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  glowColor?: SpotlightGlowColor;
};

/**
 * Spotlight border/face glow prati pointer (samo fine pointer + bez reduced-motion).
 * Koordinate su relativne na karticu (nema background-attachment: fixed) — bolji skrol.
 */
export function SpotlightGlowCard({
  children,
  className,
  style,
  glowColor = "purple",
}: SpotlightGlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const el = cardRef.current;
    if (!el) return;

    let raf = 0;
    const pending = { lx: 0, ly: 0, xp: 0, yp: 0 };

    const flush = () => {
      raf = 0;
      el.style.setProperty("--lx", pending.lx.toFixed(2));
      el.style.setProperty("--ly", pending.ly.toFixed(2));
      el.style.setProperty("--xp", pending.xp.toFixed(4));
      el.style.setProperty("--yp", pending.yp.toFixed(4));
    };

    const sync = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pending.lx = e.clientX - rect.left;
      pending.ly = e.clientY - rect.top;
      pending.xp = e.clientX / Math.max(1, window.innerWidth);
      pending.yp = e.clientY / Math.max(1, window.innerHeight);
      if (raf === 0) raf = requestAnimationFrame(flush);
    };

    window.addEventListener("pointermove", sync, { passive: true });
    return () => {
      window.removeEventListener("pointermove", sync);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const { base, spread } = glowColorMap[glowColor];

  const cssVars = {
    "--base": String(base),
    "--spread": String(spread),
    "--radius": "18",
    "--border": "2",
    "--backdrop": "hsl(0 0% 60% / 0.12)",
    "--backup-border": "var(--backdrop)",
    "--size": "200",
    "--outer": "1",
    "--saturation": "100",
    "--lightness": "70",
    "--bg-spot-opacity": "0.14",
    "--border-spot-opacity": "0.85",
    "--border-light-opacity": "0.32",
    "--border-size": "calc(var(--border, 2) * 1px)",
    "--spotlight-size": "calc(var(--size, 150) * 1px)",
    "--hue": `calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))`,
    ...style,
  } as CSSProperties;

  return (
    <div
      ref={cardRef}
      data-spotlight-glow
      className={cn("spotlight-glow-card", className)}
      style={cssVars}
    >
      {children}
    </div>
  );
}

/** Alias kao u promptu */
export { SpotlightGlowCard as GlowCard };
