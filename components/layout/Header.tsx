"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";

const NAV_SECTIONS = ["blog", "kako-funkcionise"];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const prevScrolled = useRef(false);

  useEffect(() => {
    let raf = 0;
    const h = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const now = window.scrollY > 40;
        if (now !== prevScrolled.current) {
          prevScrolled.current = now;
          setScrolled(now);
        }
        raf = 0;
      });
    };
    h();
    window.addEventListener("scroll", h, { passive: true });

    let activeRaf = 0;
    const observers: IntersectionObserver[] = [];
    NAV_SECTIONS.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          if (activeRaf) cancelAnimationFrame(activeRaf);
          activeRaf = requestAnimationFrame(() => {
            setActive(id);
            activeRaf = 0;
          });
        },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => {
      window.removeEventListener("scroll", h);
      if (raf) cancelAnimationFrame(raf);
      if (activeRaf) cancelAnimationFrame(activeRaf);
      observers.forEach(o => o.disconnect());
    };
  }, []);

  const jump = () => {
    setOpen(false);
    document.getElementById("final-cta")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        width: "100%",
        /* Čista pozadina umesto blur — blur opterećuje pri skrolu */
        background: scrolled ? "rgba(5,5,8,0.98)" : "transparent",
        borderBottom: scrolled ? "1px solid rgba(0,212,255,0.08)" : "1px solid transparent",
        transition: "background 0.2s ease, border-color 0.2s ease",
        transform: "translateZ(0)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
        <a href="#" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Image src="/logo.png" alt="AI Hype Academy" width={140} height={44} style={{ height: 44, width: "auto", objectFit: "contain" }} priority />
        </a>

        <nav style={{ display: "flex", alignItems: "center", gap: 32 }} className="hide-mobile">
          {[
            { href: "#blog", label: "O nama", id: "blog" },
            { href: "#kako-funkcionise", label: "Kako funkcioniše", id: "kako-funkcionise" },
          ].map(link => (
            <a key={link.id} href={link.href} style={{
              fontSize: 14, textDecoration: "none", transition: "color 0.2s",
              color: active === link.id ? "#00d4ff" : "#8a8a9a",
              position: "relative",
            }}>
              {link.label}
              {active === link.id && (
                <span style={{
                  position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)",
                  width: 4, height: 4, borderRadius: "50%", background: "#00d4ff",
                  boxShadow: "0 0 6px #00d4ff",
                  display: "block",
                }} />
              )}
            </a>
          ))}
          <button onClick={jump} className="glow-btn" style={{ padding: "10px 24px", fontSize: 12, borderRadius: 10 }}>Join The Hype</button>
        </nav>

        <button onClick={() => setOpen(!open)} className="show-mobile" style={{ background: "none", border: "none", color: "#8a8a9a", cursor: "pointer", padding: 8 }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="show-mobile" style={{ background: "rgba(5,5,8,0.98)", borderTop: "1px solid rgba(0,212,255,0.08)", padding: "20px 24px", flexDirection: "column", fontFamily: "inherit" }}>
          <a href="#blog" onClick={() => setOpen(false)} style={{ display: "block", fontSize: 14, color: "#8a8a9a", textDecoration: "none", padding: "10px 0", fontFamily: "inherit" }}>O nama</a>
          <a href="#kako-funkcionise" onClick={() => setOpen(false)} style={{ display: "block", fontSize: 14, color: "#8a8a9a", textDecoration: "none", padding: "10px 0", fontFamily: "inherit" }}>Kako funkcioniše</a>
          <button onClick={jump} className="glow-btn" style={{ width: "100%", marginTop: 12, borderRadius: 10, fontFamily: "inherit" }}>Join The Hype</button>
        </div>
      )}

      <style>{`
        .hide-mobile { display: none !important; }
        .show-mobile { display: flex !important; }
        @media (min-width: 768px) {
          .hide-mobile { display: flex !important; }
          .show-mobile { display: none !important; }
        }
      `}</style>
    </header>
  );
}
