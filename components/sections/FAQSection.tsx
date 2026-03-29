"use client";

import { useRef, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useInView } from "@/lib/use-in-view";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const faqs = [
  {
    q: "Da li je ovo za potpune početnike?",
    a: "Da. Kurs je dizajniran od nule. Ne treba ti prethodno znanje o AI-u, kodiranju niti filmskoj produkciji. Vodiš se korak po korak od osnova do prvog projekta.",
  },
  {
    q: "Na kom jeziku je sadržaj?",
    a: "Ceo kurs je na srpsko-hrvatskom jeziku. Svi materijali, videi i zajednica su u potpunosti lokalizovani za Balkan.",
  },
  {
    q: "Koliko traje kurs i koliko vremena sedmično treba?",
    a: "Program ima 8 modula sa 30+ sati sadržaja. Možeš napredovati sopstvenim tempom, preporučujemo 3-5 sati sedmično za optimalne rezultate.",
  },
  {
    q: "Kada dobijam pristup kursu?",
    a: "Nakon što se prijaviš, dolaziš na listu čekanja. Za 3 nedelje otvaramo kupovinu samo za prijavljene. Imaš 7 dana da se odlučiš, posle toga zatvaramo prijave.",
  },
  {
    q: "Postoji li podrška tokom kursa?",
    a: "Da. Dobijаš pristup privatnoj zajednici gdje možeš postavljati pitanja, deliti projekte i dobijati feedback. Instruktori su aktivni u zajednici.",
  },
  {
    q: "Šta ako nisam zadovoljan kursem?",
    a: "Ovo je program koji zahteva akciju, ne pasivno gledanje. Ako prođeš kroz gradivo i ne vidiš vrednost, razgovaraćemo. Cilj nam je tvoj napredak, ne tvoj novac.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="faq-item-enter"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 0", background: "none", border: "none", cursor: "pointer",
          textAlign: "left", gap: 16, fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: open ? "#fff" : "#ccc", lineHeight: 1.4, transition: "color 0.2s" }}>
          {q}
        </span>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: open ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${open ? "rgba(0,212,255,0.25)" : "rgba(255,255,255,0.06)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.25s ease",
        }}>
          {open
            ? <Minus size={13} color="#00d4ff" />
            : <Plus size={13} color="#888" />}
        </div>
      </button>
      <div style={{
        maxHeight: open ? 300 : 0,
        overflow: "hidden",
        transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <p style={{ fontSize: 14, color: "#888", lineHeight: 1.75, paddingBottom: 20 }}>
          {a}
        </p>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const reduced = useReducedMotion();
  const iv = inView || reduced;

  return (
    <section ref={ref} className={reduced ? "sr-nomotion" : undefined} style={{ position: "relative", zIndex: 10, padding: "100px 24px", contentVisibility: "auto", containIntrinsicSize: "auto 550px" }}>
      <div className="section-container" style={{ maxWidth: 720 }}>
        <div className={`sr-from-y sr-from-y-xl sr-ease ${iv ? "sr-inview" : ""}`} style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 50, padding: "6px 16px", marginBottom: 18,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4ff", boxShadow: "0 0 6px #00d4ff" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>FAQ</span>
          </div>
          <h2 style={{ fontSize: "clamp(26px, 4.5vw, 44px)", fontWeight: 800, lineHeight: 1.15 }}>
            Imaš pitanja? <span style={{ color: "#00d4ff" }}>Mi imamo odgovore.</span>
          </h2>
        </div>

        {(inView || reduced) && (
          <div>
            {faqs.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
