"use client";

import { useEffect, useState } from "react";

export default function CountdownTimer({ targetDate, label = "PRIJAVE SE ZATVARAJU ZA" }: { targetDate: Date; label?: string }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const calc = () => {
      const diff = Math.max(0, targetDate.getTime() - Date.now());
      return { d: Math.floor(diff / 864e5), h: Math.floor((diff % 864e5) / 36e5), m: Math.floor((diff % 36e5) / 6e4), s: Math.floor((diff % 6e4) / 1e3) };
    };
    setT(calc());
    const i = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(i);
  }, [targetDate]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const items = [
    { v: ready ? t.d : 0, l: "DANA" },
    { v: ready ? t.h : 0, l: "SATI" },
    { v: ready ? t.m : 0, l: "MIN" },
    { v: ready ? t.s : 0, l: "SEK" },
  ];

  return (
    <div style={{ textAlign: "center" }}>
      <style>{`
        .cd-label { font-size: 10px; letter-spacing: 0.15em; color: #8a8a9a; margin-bottom: 14px; text-transform: uppercase; font-weight: 500; }
        .cd-wrap { display: inline-flex; align-items: center; gap: 0; background: rgba(5,5,8,0.8); border: 1px solid rgba(0,212,255,0.2); border-radius: 18px; padding: 20px 28px; box-shadow: 0 0 40px rgba(0,212,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03); max-width: 100%; }
        .cd-num { font-size: clamp(28px, 8vw, 48px); font-weight: 700; color: #00d4ff; line-height: 1; font-variant-numeric: tabular-nums; }
        .cd-unit { font-size: 8px; color: #666; margin-top: 6px; letter-spacing: 0.12em; text-transform: uppercase; }
        .cd-item { text-align: center; min-width: clamp(40px, 10vw, 60px); }
        .cd-sep { font-size: clamp(24px, 6vw, 36px); color: rgba(0,212,255,0.25); font-weight: 200; margin: 0 4px; line-height: 1; margin-bottom: 14px; }
        @media (max-width: 380px) {
          .cd-wrap { padding: 14px 16px; border-radius: 14px; }
          .cd-sep { margin: 0 2px; }
        }
      `}</style>
      <p className="cd-label">{label}</p>
      <div className="cd-wrap">
        {items.map((item, i) => (
          <div key={item.l} style={{ display: "flex", alignItems: "center" }}>
            <div className="cd-item">
              <div className="cd-num">{pad(item.v)}</div>
              <div className="cd-unit">{item.l}</div>
            </div>
            {i < 3 && <span className="cd-sep">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
