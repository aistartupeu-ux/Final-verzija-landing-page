import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Sparkles, Zap, Gift, Check } from "lucide-react";
import { ShineBorder } from "@/components/ui/shine-border";

const COOKIE_NAME = "special_access";

// Boje iz smernica
const COLORS = {
  bg: "#0A0B10",
  surface: "#141720",
  text: "#FFFFFF",
  textSecondary: "#AAB2C0",
  accent: "#A3FF12",
  accentHover: "#8FE000",
  border: "#262B36",
};

const reasons = [
  {
    icon: Sparkles,
    title: "Od nule do AI skill-a",
    desc: "Bez predznanja. Prati korak po korak i stvori prvi AI video.",
  },
  {
    icon: Zap,
    title: "Praktično, bez teorije",
    desc: "Svaka lekcija ima konkretan rezultat koji možeš odmah da primeniš.",
  },
  {
    icon: Gift,
    title: "Specijalna cena samo za waitlist",
    desc: "Ova cena važi samo za one koji su na listi čekanja.",
  },
];

const faqs = [
  {
    q: "Da li je kurs za početnike?",
    a: "Da. Kurs je dizajniran za potpune početnike. Kreće se od nule i vodi te korak po korak kroz sve što ti treba da kreiraš AI sadržaj i monetizuješ ga.",
  },
  {
    q: "Šta tačno dobijam unutar kursa?",
    a: "8 modula sa 30+ sati praktičnih lekcija, pristup AI alatima za slike, video i muziku, pristup zajednici kreatora i sertifikat po završetku.",
  },
  {
    q: "Do kada važi ova cena?",
    a: "Pre-sale cena važi do javnog otvaranja kursa. Kao član waitliste, imaš ekskluzivan pristup ovoj ponudi dok traje pre-sale period.",
  },
];

export default async function SpecialOfferPage() {
  const isDev = process.env.NODE_ENV === "development";
  const cookieStore = await cookies();
  const hasAccess = cookieStore.has(COOKIE_NAME);

  if (!isDev && !hasAccess) {
    redirect("/special");
  }

  return (
    <div className="problem-solution-bg" style={{ position: "relative", minHeight: "100vh" }}>
      <div className="problem-solution-bg__image" aria-hidden />
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", color: COLORS.text }}>
      {/* Sekcija 1 — Hero / offer block */}
      <section
        style={{
          minHeight: "78vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 24px 80px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "min(48vw, 560px)",
          }}
        >
          <style>{`
            @keyframes offerCtaPulse {
              0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(163,255,18,0.25); }
              50% { transform: scale(1.02); box-shadow: 0 0 24px 2px rgba(163,255,18,0.35); }
            }
            .special-cta {
              animation: offerCtaPulse 2.8s ease-in-out infinite;
            }
            .special-cta:hover { background: #8FE000 !important; animation: none; }
            @media (max-width: 768px) {
              .special-offer-card-wrap { max-width: 92% !important; width: 92% !important; }
            }
          `}</style>
          <div className="special-offer-card-wrap" style={{ width: "100%", maxWidth: "min(48vw, 560px)" }}>
            <ShineBorder
              borderWidth={2}
              duration={4}
              contentClassName="border border-[#262B36] text-sm antialiased text-white"
              contentStyle={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                padding: "48px 40px",
              }}
            >
            {/* Badge */}
            <div
              style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: COLORS.accent,
                background: "rgba(163,255,18,0.1)",
                border: `1px solid rgba(163,255,18,0.3)`,
                padding: "8px 16px",
                borderRadius: 8,
                marginBottom: 24,
              }}
            >
              Uspešno si na waitlisti
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                fontSize: "clamp(24px, 3.2vw, 34px)",
                fontWeight: 700,
                lineHeight: 1.25,
                marginBottom: 14,
                color: COLORS.text,
              }}
            >
              Otključao si 30% popusta na AI Hype Academy
            </h1>

            {/* Subheadline */}
            <p
              style={{
                fontFamily: "var(--font-inter), Inter, sans-serif",
                fontSize: 15,
                color: COLORS.textSecondary,
                lineHeight: 1.65,
                marginBottom: 28,
              }}
            >
              Pošto si među prvima na listi čekanja, dobio si pristup pre-sale ceni pre javnog otvaranja kursa.
            </p>

            {/* Price block */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 14,
                padding: "20px 24px",
                marginBottom: 28,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 14,
                    color: COLORS.textSecondary,
                    textDecoration: "line-through",
                  }}
                >
                  Regularno: €300
                </span>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: COLORS.text,
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                  }}
                >
                  Danas: €210
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: COLORS.accent,
                    fontWeight: 600,
                  }}
                >
                  30%
                </span>
              </div>
              <p style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 6 }}>
                Štediš 30% danas
              </p>
            </div>

            {/* 3 bullets */}
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px" }}>
              {["Postani AI Ninja", "8 modula + jasan sistem korak po korak", "Bez prethodnog iskustva"].map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                    fontSize: 14,
                    color: COLORS.textSecondary,
                  }}
                >
                  <Check size={18} color={COLORS.accent} style={{ flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <a
              href="/join"
              className="special-cta"
              style={{
                display: "block",
                width: "100%",
                padding: "18px 32px",
                background: COLORS.accent,
                color: "#0A0B10",
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "var(--font-inter), Inter, sans-serif",
                textAlign: "center",
                textDecoration: "none",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
            >
              Otključaj 30% popusta
            </a>

            {/* Micro trust line */}
            <p
              style={{
                fontSize: 12,
                color: COLORS.textSecondary,
                textAlign: "center",
                marginTop: 16,
              }}
            >
              Sigurna kupovina • Ograničen pre-sale pristup
            </p>
            </ShineBorder>
          </div>
        </div>
      </section>

      {/* Sekcija 2 — 3 razloga */}
      <section
        style={{
          padding: "0 24px 80px",
          maxWidth: 1000,
          margin: "0 auto",
        }}
      >
        <style>{`
          .reasons-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
          @media (max-width: 768px) {
            .reasons-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
        <div className="reasons-grid">
          {reasons.map((r, i) => (
            <div
              key={i}
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 16,
                padding: "28px 24px",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(163,255,18,0.08)",
                  border: `1px solid rgba(163,255,18,0.2)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <r.icon size={22} color={COLORS.accent} />
              </div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  marginBottom: 8,
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                }}
              >
                {r.title}
              </h3>
              <p style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.55 }}>
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Sekcija 3 — Mini social proof */}
      <section
        style={{
          padding: "0 24px 60px",
          borderTop: `1px solid ${COLORS.border}`,
          paddingTop: 48,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "24px 48px",
            fontSize: 15,
            fontWeight: 600,
            color: COLORS.textSecondary,
          }}
        >
          <span>30+ sati lekcija</span>
          <span>8 modula</span>
          <span>100% praktično</span>
          <span>500+ na listi čekanja</span>
        </div>
      </section>

      {/* Sekcija 4 — FAQ */}
      <section
        style={{
          padding: "0 24px 80px",
          maxWidth: 640,
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 24,
            fontFamily: "var(--font-space-grotesk), sans-serif",
          }}
        >
          Pitanja i odgovori
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {faqs.map((f, i) => (
            <div
              key={i}
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                padding: "20px 24px",
              }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: COLORS.text }}>
                {f.q}
              </h3>
              <p style={{ fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.6 }}>
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer link */}
      <div
        style={{
          padding: "24px 24px 40px",
          textAlign: "center",
          borderTop: `1px solid ${COLORS.border}`,
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 13,
            color: COLORS.textSecondary,
            textDecoration: "none",
          }}
        >
          ← Nazad na sajt
        </Link>
      </div>
      </div>
    </div>
  );
}
