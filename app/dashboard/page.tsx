"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Lock, Image, Film, Music, Wand2, ArrowRight, Crown, CheckCircle } from "lucide-react";

interface UserData { name: string; email: string; hasPaid: boolean; }

const DEFAULT_USER: UserData = { name: "Korisnik", email: "user@example.com", hasPaid: false };

export default function DashboardPage() {
  const [user, setUser] = useState<UserData>(() => {
    if (typeof window === "undefined") return DEFAULT_USER;
    const stored = localStorage.getItem("ayhype_user");
    if (!stored) return DEFAULT_USER;
    try {
      return JSON.parse(stored) as UserData;
    } catch {
      return DEFAULT_USER;
    }
  });

  useEffect(() => {
    const stored = localStorage.getItem("ayhype_user");
    if (!stored) localStorage.setItem("ayhype_user", JSON.stringify(DEFAULT_USER));
  }, []);

  const handlePay = () => {
    const updated = { ...user, hasPaid: true };
    localStorage.setItem("ayhype_user", JSON.stringify(updated));
    setUser(updated);
  };

  const tools = [
    { icon: Image, title: "Generisanje Slika", desc: "Seedream, Nano Banana i više", href: "/dashboard/studio/image", color: "#a855f7", count: "5 modela" },
    { icon: Film, title: "AI Video Produkcija", desc: "Kling 3.0, VEO 3.1 i više", href: "/dashboard/studio/video", color: "#00d4ff", count: "4 modela" },
    { icon: Music, title: "AI Muzika", desc: "Kreiraj pesme, instrumentale i vokale", href: "/dashboard/studio/music", color: "#ec4899", count: "Suno V5" },
  ];

  const initial = user.name ? user.name.charAt(0).toUpperCase() : "K";

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            Dobrodošao, <span style={{ color: "#00d4ff" }}>{user.name || "Korisnik"}</span>
          </h1>
          <p style={{ fontSize: 14, color: "#666" }}>Tvoj kreativni AI studio te čeka.</p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
          borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))",
            border: "1px solid rgba(0,212,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "#00d4ff",
          }}>{initial}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#ddd" }}>{user.name || "Korisnik"}</div>
            <div style={{ fontSize: 11, color: "#555" }}>{user.email}</div>
          </div>
        </div>
      </div>

      {/* Status + Course */}
      <style>{`.dash-top{display:grid;grid-template-columns:1fr;gap:16px;margin-bottom:36px}@media(min-width:700px){.dash-top{grid-template-columns:1fr 1.2fr}}`}</style>
      <div className="dash-top">
        {/* Membership */}
        <div style={{
          padding: 28, borderRadius: 22,
          background: user.hasPaid
            ? "linear-gradient(145deg, rgba(0,212,255,0.06), rgba(124,58,237,0.04))"
            : "rgba(255,255,255,0.02)",
          border: `1px solid ${user.hasPaid ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.04)"}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Crown size={18} color={user.hasPaid ? "#00d4ff" : "#facc15"} />
            <span style={{ fontSize: 14, fontWeight: 700, color: user.hasPaid ? "#00d4ff" : "#facc15" }}>
              {user.hasPaid ? "Premium član" : "Besplatan nalog"}
            </span>
          </div>
          {user.hasPaid ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Pristup svim modulima", "AI Studio alati", "Sertifikat"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={14} color="#22c55e" />
                  <span style={{ fontSize: 13, color: "#999" }}>{t}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>
              Nadogradi na Premium za pristup svim kursevima, AI alatima i sertifikatu.
            </p>
          )}
        </div>

        {/* Course */}
        <div style={{
          padding: 28, borderRadius: 22, position: "relative", overflow: "hidden",
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #00d4ff, #7c3aed, #ec4899)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GraduationCap size={18} color="#00d4ff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>AI Hype Kurs</div>
              <div style={{ fontSize: 11, color: "#555" }}>8 modula obuke</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#777", lineHeight: 1.65, marginBottom: 20 }}>
            Od osnova do monetizacije. Pristup svim materijalima, projektima i sertifikatu.
          </p>
          {user.hasPaid ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#22c55e", fontSize: 14, fontWeight: 600 }}>
              <CheckCircle size={16} /> Pristup aktiviran
            </div>
          ) : (
            <button onClick={handlePay} className="glow-btn" style={{ borderRadius: 12, fontSize: 13, padding: "12px 28px" }}>
              <Lock size={14} /> Otključaj kurs
            </button>
          )}
        </div>
      </div>

      {/* AI Studio */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(124,58,237,0.1))", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wand2 size={17} color="#00d4ff" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700 }}>AI Studio</span>
          </div>
          <Link href="/dashboard/studio" style={{ fontSize: 13, color: "#00d4ff", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
            Svi alati <ArrowRight size={14} />
          </Link>
        </div>

        <style>{`.tools-row{display:grid;grid-template-columns:1fr;gap:14px}@media(min-width:600px){.tools-row{grid-template-columns:1fr 1fr 1fr}}`}</style>
        <div className="tools-row">
          {tools.map((t, i) => (
            <Link key={i} href={t.href} style={{ textDecoration: "none" }}>
              <div style={{
                padding: "24px 22px", borderRadius: 20, cursor: "pointer", position: "relative", overflow: "hidden",
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
                transition: "all 0.3s ease",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${t.color}30`; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${t.color}08`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 14,
                    background: `${t.color}0a`, border: `1px solid ${t.color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <t.icon size={20} color={t.color} strokeWidth={1.8} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#555", background: "rgba(255,255,255,0.03)", padding: "3px 8px", borderRadius: 6 }}>{t.count}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#eee", marginBottom: 4 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{t.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
