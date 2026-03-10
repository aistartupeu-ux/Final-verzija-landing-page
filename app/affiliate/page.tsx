import Link from "next/link";
import { ArrowRight, DollarSign, Users, TrendingUp, Shield, Zap, Gift } from "lucide-react";

const benefits = [
  {
    icon: DollarSign,
    color: "#22c55e",
    title: "30% Provizija",
    desc: "Zaradite 30% od svake prodaje koju donesete. Bez ograničenja zarade.",
  },
  {
    icon: TrendingUp,
    color: "#00d4ff",
    title: "Real-time Praćenje",
    desc: "Pratite klikove, konverzije i zarade uživo u vašem panelu.",
  },
  {
    icon: Users,
    color: "#8b5cf6",
    title: "Doživotni Kolačić",
    desc: "Vaš referalni kod prati korisnike 30 dana. Svaka kupovina je vaša.",
  },
  {
    icon: Zap,
    color: "#f59e0b",
    title: "Brze Isplate",
    desc: "Podnosite zahtev za isplatu čim dostignete 1.000 RSD. Isplata u roku od 3 dana.",
  },
  {
    icon: Shield,
    color: "#ec4899",
    title: "Pouzdana Platforma",
    desc: "AI Hype Academy je provereni brand sa hiljadama polaznika i visokom konverzijom.",
  },
  {
    icon: Gift,
    color: "#00d4ff",
    title: "Marketinški Materijali",
    desc: "Dobijate spreman vizualni sadržaj, tekstove i linkove za promociju.",
  },
];

const steps = [
  { num: "01", title: "Registrujte se", desc: "Kreirajte besplatni affiliate nalog za manje od 2 minuta." },
  { num: "02", title: "Dobijte Vaš Link", desc: "Dobijate jedinstveni referalni link koji možete deliti svuda." },
  { num: "03", title: "Promovisajte", desc: "Delite link na društvenim mrežama, YouTube, TikToku, blogu..." },
  { num: "04", title: "Zaradite", desc: "Svaka kupovina kroz vaš link = 30% provizija direktno na vaš račun." },
];

export default function AffiliatePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "inherit" }}>
      <style>{`
        .aff-hero{padding:100px 24px 80px;text-align:center;max-width:760px;margin:0 auto}
        .aff-hero h1{font-size:clamp(2.2rem,6vw,4rem);font-weight:900;line-height:1.1;margin-bottom:24px}
        .aff-hero p{font-size:1.1rem;color:#888;line-height:1.7;margin-bottom:40px}
        .aff-cta-row{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
        .aff-btn-primary{display:inline-flex;align-items:center;gap:8px;padding:16px 36px;border-radius:14px;font-size:15px;font-weight:700;background:linear-gradient(135deg,#00d4ff,#8b5cf6);color:#fff;text-decoration:none;transition:opacity .2s,transform .2s}
        .aff-btn-primary:hover{opacity:.9;transform:translateY(-2px)}
        .aff-btn-secondary{display:inline-flex;align-items:center;gap:8px;padding:16px 32px;border-radius:14px;font-size:15px;font-weight:600;border:1px solid rgba(255,255,255,0.1);color:#aaa;text-decoration:none;background:rgba(255,255,255,0.03);transition:all .2s}
        .aff-btn-secondary:hover{border-color:rgba(0,212,255,0.3);color:#fff}
        .aff-benefits{padding:80px 24px;max-width:1100px;margin:0 auto}
        .aff-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;margin-top:48px}
        .aff-card{padding:32px 28px;border-radius:22px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);transition:all .3s}
        .aff-card:hover{border-color:rgba(0,212,255,0.12);transform:translateY(-3px)}
        .aff-steps{padding:80px 24px;max-width:900px;margin:0 auto}
        .aff-steps-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;margin-top:48px}
        .aff-step{padding:28px 24px;border-radius:20px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);position:relative}
        .aff-stat-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px;max-width:700px;margin:60px auto 0;text-align:center}
        .aff-bottom-cta{padding:80px 24px;text-align:center;background:rgba(0,212,255,0.03);border-top:1px solid rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.04);margin-top:40px}
        .aff-nav{padding:20px 32px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.04);position:sticky;top:0;background:rgba(5,5,8,0.9);backdrop-filter:blur(12px);z-index:50}
        @media(max-width:600px){.aff-hero h1{font-size:2rem}.aff-cta-row{flex-direction:column;align-items:center}}
      `}</style>

      {/* Nav */}
      <nav className="aff-nav">
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#00d4ff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14, color: "#fff", fontWeight: 900 }}>A</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800 }}>AI <span style={{ color: "#00d4ff" }}>HYPE</span> <span style={{ color: "#555", fontSize: 11 }}>Academy</span></span>
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/affiliate/login" style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>Prijava</Link>
          <Link href="/affiliate/register" className="aff-btn-primary" style={{ padding: "10px 22px", fontSize: 13 }}>
            Registruj se
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="aff-hero">
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)", marginBottom: 28, fontSize: 12, color: "#00d4ff", fontWeight: 600 }}>
          <Gift size={13} /> Affiliate Program
        </div>
        <h1>
          Zaradite{" "}
          <span style={{ background: "linear-gradient(135deg,#00d4ff,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Promovisanjem
          </span>{" "}
          AI Kursa
        </h1>
        <p>
          Pridružite se našem affiliate programu i zaradite <strong style={{ color: "#22c55e" }}>30% provizije</strong> od svake prodaje.
          Potpuno besplatno. Bez ograničenja. Isplata direktno na vaš račun.
        </p>
        <div className="aff-cta-row">
          <Link href="/affiliate/register" className="aff-btn-primary">
            Počni odmah besplatno <ArrowRight size={16} />
          </Link>
          <Link href="/affiliate/login" className="aff-btn-secondary">
            Već imaš nalog? Prijavi se
          </Link>
        </div>

        {/* Stats */}
        <div className="aff-stat-row">
          {[
            { val: "30%", label: "Provizija po prodaji" },
            { val: "1.000 RSD", label: "Min. za isplatu" },
            { val: "30 dana", label: "Trajanje kolačića" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "20px", borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#00d4ff", marginBottom: 4 }}>{s.val}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="aff-benefits">
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <h2 style={{ fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 800, marginBottom: 12 }}>Zašto postati Affiliate?</h2>
          <p style={{ color: "#666", fontSize: 15 }}>Sve što treba da znate o programu</p>
        </div>
        <div className="aff-grid">
          {benefits.map((b, i) => (
            <div key={i} className="aff-card">
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${b.color}12`, border: `1px solid ${b.color}22`,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18,
              }}>
                <b.icon size={22} color={b.color} strokeWidth={1.8} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "#eee" }}>{b.title}</div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.7 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="aff-steps">
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <h2 style={{ fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 800, marginBottom: 12 }}>Kako funkcioniše?</h2>
          <p style={{ color: "#666", fontSize: 15 }}>4 koraka do zarade</p>
        </div>
        <div className="aff-steps-list">
          {steps.map((s, i) => (
            <div key={i} className="aff-step">
              <div style={{ fontSize: 36, fontWeight: 900, color: "rgba(0,212,255,0.12)", marginBottom: 12, lineHeight: 1 }}>{s.num}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#ddd", marginBottom: 8 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.65 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="aff-bottom-cta">
        <h2 style={{ fontSize: "clamp(1.5rem,4vw,2.2rem)", fontWeight: 800, marginBottom: 14 }}>
          Spreman da počneš?
        </h2>
        <p style={{ color: "#666", marginBottom: 32, fontSize: 15 }}>
          Registracija je besplatna i traje manje od 2 minuta.
        </p>
        <Link href="/affiliate/register" className="aff-btn-primary" style={{ fontSize: 16, padding: "18px 48px" }}>
          Registruj se besplatno <ArrowRight size={17} />
        </Link>
      </div>

      {/* Footer minimal */}
      <div style={{ padding: "24px 32px", textAlign: "center", color: "#444", fontSize: 12 }}>
        © 2025 AI Hype Academy · <Link href="/" style={{ color: "#555", textDecoration: "none" }}>Početna</Link>
      </div>
    </div>
  );
}
