"use client";

import Link from "next/link";
import { Image, Film, Music, Sparkles, ArrowRight } from "lucide-react";

const tools = [
  {
    icon: Image, title: "Generisanje Slika", desc: "Kreiraj profesionalne slike pomoću 5 AI modela: Seedream, Nano Banana i više.",
    href: "/dashboard/studio/image", color: "#a855f7",
    models: ["Seedream 4.5", "Seedream 5.0", "Nano Banana", "Nano Banana 2", "Nano Banana Pro"],
  },
  {
    icon: Film, title: "AI Video Produkcija", desc: "Generiši videe iz teksta ili slike koristeći najmodernije video modele.",
    href: "/dashboard/studio/video", color: "#00d4ff",
    models: ["Kling 3.0", "Kling 2.6", "Kling Motion Control", "Google VEO 3.1"],
  },
  {
    icon: Music, title: "AI Muzika", desc: "Kreiraj originalnu muziku, pesme sa vokalima, instrumentale i više.",
    href: "/dashboard/studio/music", color: "#ec4899",
    models: ["Music Gen", "Vocals", "Instrumental", "Cover"],
  },
];

export default function StudioPage() {
  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Sparkles size={22} color="#00d4ff" />
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>AI Studio</h1>
        </div>
        <p style={{ fontSize: 14, color: "#888", maxWidth: 500 }}>
          Tvoj kreativni hub. Biraj alat, unesi prompt i pusti AI da radi.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {tools.map((t, i) => (
          <Link key={i} href={t.href} style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: 28, cursor: "pointer", display: "flex", gap: 24, alignItems: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20, flexShrink: 0,
                background: `${t.color}10`, border: `1px solid ${t.color}20`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <t.icon size={28} color={t.color} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{t.title}</div>
                <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, marginBottom: 10 }}>{t.desc}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {t.models.map(m => (
                    <span key={m} style={{
                      fontSize: 10, fontWeight: 600, color: "#666", padding: "3px 8px",
                      borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                    }}>{m}</span>
                  ))}
                </div>
              </div>
              <ArrowRight size={18} color="#555" style={{ flexShrink: 0 }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
