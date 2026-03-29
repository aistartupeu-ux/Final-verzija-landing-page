"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "@/lib/use-in-view";

const stats = [
  { value: 500, suffix: "+", label: "Polaznika", sublabel: "na čekanju" },
  { value: 8, suffix: "", label: "Modula", sublabel: "kompletnog sadržaja" },
  { value: 30, suffix: "+", label: "Sati sadržaja", sublabel: "praktičnih lekcija" },
  { value: 1, suffix: "", label: "Međunarodna nagrada", sublabel: "Los Anđeles 2026." },
];

function CountUp({ target, suffix, active }: { target: number; suffix: string; active: boolean }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    const duration = 1800;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target]);

  return <>{val}{suffix}</>;
}

export default function StatsSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} style={{ position: "relative", zIndex: 10, padding: "60px 24px" }}>
      <div className="section-container">
        <style>{`
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; }
          @media (min-width: 640px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
          .stats-item { position: relative; padding: 32px 20px; text-align: center; }
          .stats-item::after { content: ''; position: absolute; top: 20%; right: 0; bottom: 20%; width: 1px; background: rgba(0,212,255,0.08); }
          .stats-item:last-child::after { display: none; }
          @media (max-width: 639px) { .stats-item:nth-child(even)::after { display: none; } .stats-item:nth-child(odd)::after { display: block; } }
        `}</style>
        <div style={{
          background: "rgba(255,255,255,0.015)",
          border: "1px solid rgba(0,212,255,0.08)",
          borderRadius: 20,
          overflow: "hidden",
        }}>
          <div className="stats-grid">
            {stats.map((s, i) => (
              <div key={i} className="stats-item">
                <div style={{
                  fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800,
                  background: "linear-gradient(135deg, #fff 40%, rgba(0,212,255,0.7) 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: 1, marginBottom: 8,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  <CountUp target={s.value} suffix={s.suffix} active={inView} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "#555" }}>{s.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
