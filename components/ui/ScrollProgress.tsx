"use client";

import { useEffect, useRef } from "react";

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const el = document.documentElement;
        const scrolled = el.scrollTop || document.body.scrollTop;
        const total = el.scrollHeight - el.clientHeight;
        const pct = total > 0 ? scrolled / total : 0;
        bar.style.transform = `scaleX(${pct})`;
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 99990,
      height: 2, background: "transparent", pointerEvents: "none",
      contain: "layout paint",
    }}>
      <div ref={barRef} style={{
        height: "100%", width: "100%",
        transformOrigin: "left",
        transform: "scaleX(0)",
        background: "linear-gradient(90deg, #00d4ff, #a855f7)",
        boxShadow: "0 0 8px rgba(0,212,255,0.7)",
        willChange: "transform",
      }} />
    </div>
  );
}
