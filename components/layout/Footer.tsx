"use client";

import { Instagram, Youtube, Twitter, Linkedin } from "lucide-react";
import Image from "next/image";

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
            {["O nama", "Program", "Cene"].map(l => <a key={l} href="#" style={{ display: "block", fontSize: 13, color: "#666", textDecoration: "none", marginBottom: 8, transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#00d4ff")} onMouseLeave={e => (e.currentTarget.style.color = "#666")}>{l}</a>)}
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Podrška</h4>
            {["FAQ", "Kontakt", "Uslovi korišćenja"].map(l => <a key={l} href="#" style={{ display: "block", fontSize: 13, color: "#666", textDecoration: "none", marginBottom: 8, transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#00d4ff")} onMouseLeave={e => (e.currentTarget.style.color = "#666")}>{l}</a>)}
          </div>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Prati nas</h4>
            <div style={{ display: "flex", gap: 8 }}>
              {[Instagram, Youtube, Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(0,212,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", textDecoration: "none", transition: "all 0.2s" }}
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
