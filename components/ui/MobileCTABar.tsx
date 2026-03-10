"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

export default function MobileCTABar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let prev = false;
    const onScroll = () => {
      const scrollY = window.scrollY;
      const finalCTA = document.getElementById("final-cta");
      const finalTop = finalCTA ? finalCTA.getBoundingClientRect().top + scrollY : Infinity;
      const now = scrollY > 600 && scrollY < finalTop - 200;
      if (now !== prev) {
        prev = now;
        setVisible(now);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const jump = () => {
    document.getElementById("final-cta")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        .mobile-cta-bar { display: flex; }
        @media (min-width: 768px) { .mobile-cta-bar { display: none !important; } }
      `}</style>
      <div
        className="mobile-cta-bar"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9990,
          padding: "12px 16px 20px",
          background: "linear-gradient(to top, rgba(5,5,8,0.98) 0%, rgba(5,5,8,0.95) 100%)",
          borderTop: "1px solid rgba(0,212,255,0.12)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          flexDirection: "column", gap: 0,
          transform: visible ? "translateY(0)" : "translateY(110%)",
          transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
        }}
      >
        <button
          onClick={jump}
          style={{
            width: "100%", padding: "14px 20px",
            background: "linear-gradient(135deg, #00d4ff, #00b0e0)",
            border: "none", borderRadius: 14, cursor: "pointer",
            color: "#050508", fontWeight: 700, fontSize: 14,
            letterSpacing: "0.06em", textTransform: "uppercase",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontFamily: "inherit",
            boxShadow: "0 0 24px rgba(0,212,255,0.35)",
          }}
        >
          Join The Hype <ArrowRight size={16} />
        </button>
        <p style={{ textAlign: "center", fontSize: 10, color: "#555", marginTop: 6, letterSpacing: "0.03em" }}>
          Ograničen broj mesta · Bez kreditne kartice
        </p>
      </div>
    </>
  );
}
