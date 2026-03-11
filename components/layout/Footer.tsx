"use client";

import { Instagram, Youtube } from "lucide-react";
import Image from "next/image";

function TiktokIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer style={{ position: "relative", zIndex: 10, borderTop: "1px solid rgba(0,212,255,0.08)", background: "rgba(5,5,8,0.9)" }}>
      <div className="section-container" style={{ padding: "56px 24px 36px" }}>
        <style>{`.ft-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px}@media(min-width:640px){.ft-grid{grid-template-columns:2fr 1fr 1fr 1fr}}`}</style>
        <div className="ft-grid">
          <div>
            <div style={{ marginBottom: 12 }}>
              <Image src="/logo.png" alt="AI Hype Academy" width={130} height={40} style={{ height: 40, width: "auto", objectFit: "contain" }} />
            </div>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, maxWidth: 240 }}>Najkompletnija AI edukaciona platforma na Balkanu.</p>
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Platforma</h4>
            {["O nama", "Program"].map(l => <a key={l} href={l === "O nama" ? "#blog" : "#"} style={{ display: "block", fontSize: 13, color: "#666", textDecoration: "none", marginBottom: 8, transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#00d4ff")} onMouseLeave={e => (e.currentTarget.style.color = "#666")}>{l}</a>)}
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Podrška</h4>
            {["FAQ", "Kontakt", "Uslovi korišćenja"].map(l => <a key={l} href="#" style={{ display: "block", fontSize: 13, color: "#666", textDecoration: "none", marginBottom: 8, transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#00d4ff")} onMouseLeave={e => (e.currentTarget.style.color = "#666")}>{l}</a>)}
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Prati nas</h4>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { Icon: Instagram, href: "https://www.instagram.com/aihype.official?igsh=MTBrbWp1Y3V5NDBwMA==" },
                { Icon: TiktokIcon, href: "https://www.tiktok.com/@ai.hype.akademija?_r=1&_t=ZN-94bDDZdy9Sw" },
                { Icon: Youtube, href: "#" },
              ].map(({ Icon, href }, i) => (
                <a key={i} href={href} target={href !== "#" ? "_blank" : undefined} rel={href !== "#" ? "noopener noreferrer" : undefined} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(0,212,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#00d4ff"; e.currentTarget.style.borderColor = "rgba(0,212,255,0.3)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "rgba(0,212,255,0.1)"; }}>
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(0,212,255,0.06)", marginTop: 40, paddingTop: 20 }}>
          <p style={{ fontSize: 11, color: "#444", textAlign: "center" }}>&copy; {new Date().getFullYear()} AI HYPE Academy. Sva prava zadržana.</p>
        </div>
      </div>
    </footer>
  );
}
