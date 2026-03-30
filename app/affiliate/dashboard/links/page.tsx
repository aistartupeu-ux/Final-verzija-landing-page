"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Info } from "lucide-react";

interface AffiliateData {
  name: string;
  affiliateCode: string;
  commissionRate: number;
}

export default function AffiliateLinksPage() {
  const [affiliate] = useState<AffiliateData | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("ayhype_affiliate");
    if (!stored) return null;
    try {
      return JSON.parse(stored) as AffiliateData;
    } catch {
      return null;
    }
  });
  const [copied, setCopied] = useState<string>("");

  const origin = typeof window !== "undefined" ? window.location.origin : "https://aihype-academy.com";
  const code = affiliate?.affiliateCode ?? "";

  const links = [
    { label: "Referalni Link (Početna)", url: `${origin}/ref/${code}`, desc: "Koristite ovaj link za generisanje klikova i praćenje." },
    { label: "Direktni Link na Prijavu", url: `${origin}/join?ref=${code}`, desc: "Šalje korisnika direktno na stranicu za prijavu." },
    { label: "Affiliate Info Stranica", url: `${origin}/affiliate`, desc: "Stranica sa detaljima o affiliate programu." },
  ];

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(""), 2000);
  };

  const promoTexts = [
    `Učite AI kreaciju sa najboljim kursom na Balkanu! 🚀 Generišite slike, video i muziku uz AI alate. Prijavite se ovde: ${origin}/ref/${code}`,
    `Da li znate kako da zaradite od AI alata? AI Hype Academy vas uči korak po korak. Link za pristup: ${origin}/ref/${code}`,
    `AI nije budućnost, AI je SADA. Ovaj kurs mi je promenio igru. Proverite: ${origin}/ref/${code}`,
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Moji Linkovi</h1>
        <p style={{ fontSize: 14, color: "#666" }}>Sve vaše referalne veze na jednom mestu.</p>
      </div>

      {/* Links */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 36 }}>
        {links.map((link, i) => (
          <div key={i} style={{ padding: "22px 24px", borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#ddd", marginBottom: 6 }}>{link.label}</div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 14 }}>{link.desc}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                readOnly
                value={link.url}
                style={{ flex: 1, padding: "10px 14px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.12)", borderRadius: 10, color: "#aaa", fontSize: 12, fontFamily: "monospace", outline: "none" }}
              />
              <button
                onClick={() => copyLink(link.url)}
                style={{
                  padding: "10px 16px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
                  background: copied === link.url ? "rgba(34,197,94,0.1)" : "rgba(0,212,255,0.1)",
                  border: `1px solid ${copied === link.url ? "rgba(34,197,94,0.25)" : "rgba(0,212,255,0.2)"}`,
                  color: copied === link.url ? "#22c55e" : "#00d4ff",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {copied === link.url ? <><Check size={13} /> Kopirano</> : <><Copy size={13} /> Kopiraj</>}
              </button>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#666", display: "flex", alignItems: "center" }}
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Promo texts */}
      <div style={{ padding: "24px", borderRadius: 18, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Info size={15} color="#8b5cf6" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#ddd" }}>Gotovi Promotivni Tekstovi</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {promoTexts.map((text, i) => (
            <div key={i} style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", position: "relative" }}>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.7, marginRight: 40 }}>{text}</div>
              <button
                onClick={() => { navigator.clipboard.writeText(text); setCopied(`promo${i}`); setTimeout(() => setCopied(""), 2000); }}
                style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", color: copied === `promo${i}` ? "#22c55e" : "#555", padding: 4 }}
              >
                {copied === `promo${i}` ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
