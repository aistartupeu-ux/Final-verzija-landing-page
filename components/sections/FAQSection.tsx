"use client";

import { useRef, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useInView } from "@/lib/use-in-view";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const faqs = [
  {
    q: "Koliko košta program?",
    a: `Razumemo zašto je to prvo pitanje.
Cena je 297€, jednokratno nema mesečnih plaćanja.

Ali realno pitanje nije cena.
Pitanje je da li ćeš nastaviti da gubiš vreme na lutanje…
ili ćeš imati jasan put šta da radiš.`,
  },
  {
    q: "Da li ovo stvarno može da donese zaradu?",
    a: [
      "Ovo je drugo najčešće pitanje.",
      "AI sam po sebi ne znači ništa.",
      "Ali ako znaš kako da ga koristiš za:",
      "",
      "ㆍReklame",
      "ㆍContent",
      "ㆍKlijente",
      "",
      "Onda postaje alat za prihod.",
    ].join("\n"),
  },
  {
    q: "Na kom jeziku je sadržaj?",
    a: "Ceo kurs je na srpsko-hrvatskom jeziku. Svi materijali, videi i zajednica su u potpunosti lokalizovani za Balkan.",
  },
  {
    q: "Koliko brzo mogu da dođem do prvog klijenta ili zarade?",
    a: `Brže nego što misliš,
ako prestaneš da čekaš i kreneš da radiš.

Neki ljudi čekaju da „nauče sve“ pa nikad ne krenu.
Drugi krenu odmah i uče kroz praksu.
Mi te vodimo da što pre dođeš do prvih konkretnih rezultata,
ne da samo gledaš i skupljaš informacije.`,
  },
  {
    q: "Da li je ovo za mene ako nemam iskustva i ne znam odakle da krenem?",
    a: `Ako ti je u glavi:
„nemam pojma odakle da krenem“
„nemam iskustva“
„da li mi treba znanje u programiranju“

Onda si tačno tamo gde većina počinje.
I to je normalno.

Ne treba ti nikakvo tehničko znanje.
Ne treba ti iskustvo.
Ako znaš da koristiš računar i internet, imaš sve što ti treba.

Problem nije što ne znaš AI.
Problem je što nemaš jasan smer.

Zato je kurs napravljen da te vodi od nule, korak po korak,
bez lutanja i bez komplikovanja.`,
  },
  {
    q: "Kada dobijam pristup kursu?",
    a: `Nakon prijave ulaziš na waitlistu.
Kupovina se 15. aprila, prvo za ljude sa liste.`,
  },
  {
    q: "Koje alate treba da koristim i koliko to košta?",
    a: `Realno pitanje, jer danas ih ima previše.
Zato ti tačno pokazujemo koje koristiti, kada i zašto,
bez bacanja para i bez testiranja naslepo.

Možeš da kreneš sa free verzijama i minimalnim troškom.
Kasnije, kad vidiš rezultate, tek tada ima smisla ulagati više.`,
  },
  {
    q: "Da li ovo stvarno radi ili je samo hype?",
    a: `Razumemo skeptičnost.
Većina ljudi tako razmišlja dok ne vidi kako izgleda u praksi.
AI već koriste ozbiljne firme, pitanje je samo da li ćeš i ti.`,
  },
  {
    q: "Šta ako nemam biznis?",
    a: `To je zapravo prednost.
Krećeš od nule, ali sa pravim smerom.
Gradiš skill koji možeš odmah da naplatiš.`,
  },
  {
    q: "Da li mogu sve ovo sam ili mi treba tim?",
    a: `Da li mogu sve ovo sam ili mi treba tim?
Danas više nego ikad, možeš sam.
AI ti daje brzinu i mogućnosti
koje su ranije imali samo timovi.`,
  },
  {
    q: "Postoji li podrška tokom kursa?",
    a: `Da.
Ne ostaješ sam sa materijalom.
Ako zapneš ili se izgubiš usput, tu smo.
Dobijaš pristup privatnoj zajednici gde možeš da pitaš,
podeliš šta radiš i dobiješ konkretan feedback.

Instruktori su aktivni u zajednici,
nije da postaviš pitanje i čekaš danima.`,
  },
  {
    q: "Šta ako nisam zadovoljan kursem?",
    a: `Fer pitanje.
Ovo nije kurs koji samo gledaš,
nego program koji traži da primeniš.
Ako prođeš kroz gradivo i stvarno ne vidiš vrednost,
razgovaraćemo.

Cilj nam je da napraviš rezultat,
ne da samo kupiš kurs.`,
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
        <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", color: "#ffffff", lineHeight: 1.4 }}>
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
        maxHeight: open ? 3200 : 0,
        overflow: "hidden",
        transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <p style={{ fontSize: 16, color: "rgba(245,245,247,0.55)", lineHeight: 1.55, paddingBottom: 20, whiteSpace: "pre-line" }}>
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
    <section
      ref={ref}
      className={`landing-section-y${reduced ? " sr-nomotion" : ""}`}
      style={{ position: "relative", zIndex: 10 }}
    >
      <div className="section-container landing-measure-narrow">
        <div className={`landing-section-head sr-from-y sr-from-y-xl sr-ease ${iv ? "sr-inview" : ""}`}>
          <div className="landing-eyebrow-pill landing-eyebrow-pill--muted">
            <span
              className="landing-eyebrow-dot landing-eyebrow-dot--muted"
              style={{ background: "#00d4ff", boxShadow: "0 0 8px rgba(0,212,255,0.4)" }}
            />
            <span className="landing-eyebrow-pill-label">FAQ</span>
          </div>
          <h2 className="landing-display">
            Imaš pitanja? <span className="apple-accent-gradient">Mi imamo odgovore.</span>
          </h2>
        </div>

        {(inView || reduced) && (
          <div>
            {faqs.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
