"use client";

import { DollarSign, TrendingUp, Users, Clock } from "lucide-react";

const perks = [
  { icon: DollarSign, color: "#555", title: "30% Provizija", desc: "Za svaku prodaju koju ostvarite kroz vaš link." },
  { icon: TrendingUp, color: "#555", title: "Real-time Statistike", desc: "Pratite klikove i zarade uživo u svom panelu." },
  { icon: Users, color: "#555", title: "Neograničena Zarada", desc: "Bez gornje granice. Što više deliš, više zarađuješ." },
];

export default function AffiliateSection() {
  return (
    <section style={{ padding: "100px 24px", position: "relative", overflow: "hidden" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>

        {/* Badge */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 18px",
            borderRadius: 100, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            <Clock size={12} /> Uskoro dostupno
          </span>
        </div>

        {/* Heading */}
        <h2 style={{
          textAlign: "center", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900,
          lineHeight: 1.15, marginBottom: 20, color: "#555",
        }}>
          Zaradite s Nama
        </h2>

        <p style={{ textAlign: "center", fontSize: "clamp(15px,2vw,17px)", color: "#444", lineHeight: 1.75, maxWidth: 560, margin: "0 auto 48px" }}>
          Affiliate program je trenutno u pripremi. Uskoro ćete moći da zaradite <strong style={{ color: "#555" }}>30% provizije</strong> od svake prodaje kroz vaš link.
        </p>

        {/* Perks — greyed out */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 18, marginBottom: 44, opacity: 0.4, pointerEvents: "none" }}>
          {perks.map((p, i) => (
            <div key={i} style={{
              padding: "26px 22px", borderRadius: 20,
              background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)",
              display: "flex", gap: 16, alignItems: "flex-start",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <p.icon size={20} color="#444" strokeWidth={1.8} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#555", marginBottom: 5 }}>{p.title}</div>
                <div style={{ fontSize: 13, color: "#444", lineHeight: 1.6 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Greyed out CTA */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 9,
            padding: "16px 40px", borderRadius: 14, fontSize: 15, fontWeight: 700,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
            color: "#444", cursor: "not-allowed",
          }}>
            <Clock size={16} /> Uskoro dostupno
          </div>
          <div style={{ marginTop: 14, fontSize: 13, color: "#3a3a3a" }}>
            Radimo na tome. Pratite nas za najavu.
          </div>
        </div>

      </div>
    </section>
  );
}
