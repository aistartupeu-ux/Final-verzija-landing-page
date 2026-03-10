"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const raf = useRef<number>(0);

  useEffect(() => {
    // Only enable on devices that support hover (non-touch)
    if (window.matchMedia("(hover: none)").matches) return;

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const animate = () => {
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.current.x - 4}px, ${pos.current.y - 4}px, 0)`;
      }
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.current.x - 20}px, ${ring.current.y - 20}px, 0)`;
      }
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      {/* Inner dot */}
      <div
        ref={dotRef}
        style={{
          position: "fixed", top: 0, left: 0, zIndex: 99999,
          width: 8, height: 8, borderRadius: "50%",
          background: "#00d4ff",
          boxShadow: "0 0 10px rgba(0,212,255,0.9), 0 0 20px rgba(0,212,255,0.4)",
          pointerEvents: "none",
          willChange: "transform",
          mixBlendMode: "screen",
        }}
      />
      {/* Outer ring */}
      <div
        ref={ringRef}
        style={{
          position: "fixed", top: 0, left: 0, zIndex: 99998,
          width: 40, height: 40, borderRadius: "50%",
          border: "1px solid rgba(0,212,255,0.35)",
          background: "rgba(0,212,255,0.04)",
          pointerEvents: "none",
          willChange: "transform",
          transition: "opacity 0.2s ease",
        }}
      />
    </>
  );
}
