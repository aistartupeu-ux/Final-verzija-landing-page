"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { trackAffiliateLeadOnSubmit, getLeadSourceData } from "@/lib/affiliate-tracking";
import { isAllowedEmailDomain, EMAIL_DOMAIN_ERROR } from "@/lib/email-domains";
import { useEmailVerify } from "@/lib/use-email-verify";
import {
  ArrowLeft, Mail, ArrowRight, Loader2, CheckCircle, XCircle,
  Sparkles, GraduationCap, Users, ShieldCheck, Zap, Award,
} from "lucide-react";
import NetworkBackground from "@/components/ui/NetworkBackground";

const benefits = [
  { icon: Sparkles, title: "AI Influenser Sistem", desc: "Nauči kako da kreiraš AI influensere koji zarađuju" },
  { icon: GraduationCap, title: "8 Modula Obuke", desc: "Od osnova do monetizacije, korak po korak" },
  { icon: Zap, title: "Pristup AI Alatima", desc: "Moderni alati za kreiranje sadržaja i automatizaciju" },
  { icon: Users, title: "Zajednica Članova", desc: "Pristupi ekskluzivnoj grupi kreatora i preduzimača" },
  { icon: Award, title: "Sertifikat", desc: "Potvrda tvog znanja koja gradi poverenje kod brendova" },
  { icon: ShieldCheck, title: "Bez Rizika", desc: "Uđi bez straha — ostaješ samo ako vidiš vrednost" },
];

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function JoinContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [focused, setFocused] = useState("");

  const { state: verifyState, error: verifyError, check: verifyCheck } = useEmailVerify();

  useEffect(() => {
    verifyCheck(email);
  }, [email, verifyCheck]);

  // Postavi af_ref cookie kad korisnik dođe preko /join?ref=CODE (affiliate direktni link)
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && typeof document !== "undefined") {
      document.cookie = `af_ref=${encodeURIComponent(ref.toUpperCase())}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || !name) return;
    if (!isAllowedEmailDomain(email)) {
      alert(EMAIL_DOMAIN_ERROR);
      return;
    }
    if (verifyState !== "valid") {
      alert(verifyError ?? "Proverite da li je email adresa validna i da postoji.");
      return;
    }
    setStatus("loading");
    try {
      const sourceData = getLeadSourceData();
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone: null,
          name,
          utm_source: sourceData.utm_source,
          utm_medium: sourceData.utm_medium,
          utm_campaign: sourceData.utm_campaign,
          affiliate_code: sourceData.affiliate_code,
          source_tag: sourceData.source_tag,
        }),
      });
      if (res.ok && typeof window !== "undefined") {
        const w = window as unknown as { fbq?: (a: string, b: string) => void; ttq?: { track: (ev: string) => void } };
        if (w.fbq) w.fbq("track", "Lead");
        if (w.ttq?.track) w.ttq.track("Lead");
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Greška pri prijavi");
      }
      trackAffiliateLeadOnSubmit({ email, phone: null });
    } catch (err) {
      setStatus("idle");
      alert(err instanceof Error ? err.message : "Greška pri prijavi. Pokušaj ponovo.");
      return;
    }
    await new Promise(r => setTimeout(r, 600));
    localStorage.setItem("ayhype_user", JSON.stringify({ name, email, hasPaid: false }));
    setStatus("success");
  };

  const handleGoogle = () => {
    // Will integrate NextAuth Google provider in Phase 2
    alert("Google login biće dostupan uskoro!");
  };

  const inputStyle = (field: string) => ({
    width: "100%", padding: "14px 18px", borderRadius: 14,
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${focused === field ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.08)"}`,
    outline: "none", color: "#fff", fontSize: 15, fontFamily: "inherit",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    boxShadow: focused === field ? "0 0 20px rgba(0,212,255,0.06)" : "none",
  });

  if (status === "success") {
    return (
      <div style={{ position: "relative", minHeight: "100vh" }}>
        <NetworkBackground />
        <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ textAlign: "center", maxWidth: 480 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 24, margin: "0 auto 28px",
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CheckCircle size={40} color="#22c55e" />
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Uspešno!</h1>
            <p style={{ fontSize: 16, color: "#999", lineHeight: 1.7, marginBottom: 32 }}>
              Tvoj nalog je kreiran. Bićeš obavešten/a čim se kurs otvori za kupovinu.
            </p>
            <Link href="/dashboard" className="glow-btn" style={{ textDecoration: "none", borderRadius: 14, fontSize: 14 }}>
              Uđi u Dashboard <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <NetworkBackground />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 24px 60px" }}>
        <style>{`.join-layout{display:grid;grid-template-columns:1fr;gap:40px;max-width:960px;width:100%;align-items:center}@media(min-width:768px){.join-layout{grid-template-columns:1fr 1fr;gap:64px}}`}</style>
        <div className="join-layout">

          {/* Left: Benefits */}
          <div>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#666", textDecoration: "none", fontSize: 13, marginBottom: 32, transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#00d4ff")} onMouseLeave={e => (e.currentTarget.style.color = "#666")}>
              <ArrowLeft size={14} /> Nazad
            </Link>

            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>AI <span style={{ color: "#00d4ff" }}>HYPE</span></span>
              <span style={{ fontSize: 10, color: "#666", letterSpacing: "0.2em", textTransform: "uppercase" as const, marginLeft: 6 }}>Academy</span>
            </div>

            <h1 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 12 }}>
              Pridruži se <span style={{ color: "#00d4ff" }}>AI revoluciji.</span>
            </h1>
            <p style={{ fontSize: 15, color: "#888", lineHeight: 1.7, marginBottom: 36 }}>
              Kreiraj nalog i obezbedi svoje mesto. Kurs se otvara uskoro, prijavljeni imaju prednost.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {benefits.map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <b.icon size={15} color="#00d4ff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#ddd", marginBottom: 2 }}>{b.title}</div>
                    <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Signup Form */}
          <div style={{
            padding: "40px 32px", borderRadius: 28, position: "relative", overflow: "hidden",
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(0,212,255,0.1)",
            boxShadow: "0 8px 60px rgba(0,0,0,0.4), 0 0 80px rgba(0,212,255,0.03)",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #00d4ff, #7c3aed, #00d4ff)" }} />

            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, textAlign: "center" }}>Kreiraj nalog</h2>
            <p style={{ fontSize: 13, color: "#666", textAlign: "center", marginBottom: 28 }}>Besplatno. Bez obaveza.</p>

            {/* Google button */}
            <button onClick={handleGoogle} style={{
              width: "100%", padding: "14px 20px", borderRadius: 14,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              fontFamily: "inherit", transition: "all 0.2s ease",
              marginBottom: 24,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            >
              <GoogleIcon />
              Nastavi sa Google nalogom
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              <span style={{ fontSize: 12, color: "#555", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>ili</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#777", fontWeight: 500, marginBottom: 6, display: "block" }}>Ime</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  onFocus={() => setFocused("name")} onBlur={() => setFocused("")}
                  placeholder="Tvoje ime" required
                  style={inputStyle("name")}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#777", fontWeight: 500, marginBottom: 6, display: "block" }}>Email</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")} onBlur={() => setFocused("")}
                    placeholder="tvoj@email.com" required
                    style={{
                      ...inputStyle("email"),
                      paddingRight: 44,
                      borderColor: verifyState === "invalid" ? "rgba(239,68,68,0.5)" : undefined,
                    }}
                  />
                  {verifyState === "checking" && (
                    <Loader2 size={18} color="#00d4ff" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", animation: "spin 1s linear infinite" }} />
                  )}
                  {verifyState === "valid" && (
                    <CheckCircle size={18} color="#22c55e" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }} />
                  )}
                  {verifyState === "invalid" && (
                    <XCircle size={18} color="#ef4444" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }} />
                  )}
                </div>
                {verifyError && (
                  <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>{verifyError}</p>
                )}
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#777", fontWeight: 500, marginBottom: 6, display: "block" }}>Lozinka</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")} onBlur={() => setFocused("")}
                  placeholder="Minimum 6 karaktera" required minLength={6}
                  style={inputStyle("password")}
                />
              </div>

              <button type="submit" disabled={status === "loading" || verifyState !== "valid"} className="glow-btn" style={{
                width: "100%", borderRadius: 14, marginTop: 6, fontSize: 14,
              }}>
                {status === "loading"
                  ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                  : <>Kreiraj nalog <ArrowRight size={16} /></>
                }
              </button>
            </form>

            <p style={{ fontSize: 11, color: "#444", textAlign: "center", marginTop: 18, lineHeight: 1.6 }}>
              Kreiranjem naloga prihvataš naše{" "}
              <a href="#" style={{ color: "#666", textDecoration: "underline" }}>uslove korišćenja</a>{" "}
              i{" "}
              <a href="#" style={{ color: "#666", textDecoration: "underline" }}>politiku privatnosti</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#050508" }}>...</div>}>
      <JoinContent />
    </Suspense>
  );
}
