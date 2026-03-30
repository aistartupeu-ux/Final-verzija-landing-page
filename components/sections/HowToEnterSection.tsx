"use client";

import { useRef, type CSSProperties } from "react";
import { UserPlus, Clock, ShoppingCart, Lock } from "lucide-react";
import EmailForm from "@/components/ui/EmailForm";
import { useInView } from "@/lib/use-in-view";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const steps = [
  { icon: UserPlus, step: "Korak 1", title: "Sada — prijave otvorene", desc: "Prijavljuješ se na listu čekanja i obezbeđuješ svoje mesto.", active: true },
  { icon: Clock, step: "Korak 2", title: "Posle 3 nedelje", desc: "Otvaramo kupovinu kursa samo za prijavljene.", active: false },
  { icon: ShoppingCart, step: "Korak 3", title: "Sledećih 7 dana", desc: "Kurs može da se kupi. Posle toga zatvaramo prijave.", active: false },
  { icon: Lock, step: "Korak 4", title: "Zatvaranje upisa", desc: "Ko uđe na vreme ima prednost. Ko čeka ostaje napolju.", active: false },
];

export default function HowToEnterSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const reduced = useReducedMotion();
  const iv = inView || reduced;

  return (
    <section ref={ref} id="kako-funkcionise" className={reduced ? "sr-nomotion" : undefined} style={{ position: "relative", zIndex: 10, padding: "120px 24px", textAlign: "center", contentVisibility: "auto", containIntrinsicSize: "auto 650px" }}>
      <div className="section-container" style={{ maxWidth: 720 }}>
        <div className={`sr-from-y sr-from-y-xl sr-ease ${iv ? "sr-inview" : ""}`}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)",
            borderRadius: 50, padding: "6px 16px", marginBottom: 24,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#22c55e", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Proces</span>
          </div>

          <h2 style={{ fontSize: "clamp(30px, 5vw, 50px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 12 }}>
            Kako ulaziš <span style={{ color: "#00d4ff" }}>unutra?</span>
          </h2>
          <p style={{ fontSize: 15, color: "#8a8a9a", marginBottom: 52 }}>Prvo se prijavljuješ. Onda imaš kratki prozor da uđeš u kurs.</p>
        </div>

        <div style={{ position: "relative", textAlign: "left" }}>
          <div style={{ position: "absolute", left: 28, top: 0, bottom: 0, width: 2, background: "linear-gradient(to bottom, rgba(0,212,255,0.3), rgba(124,58,237,0.15), transparent)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {steps.map((s, i) => (
              <div
                key={i}
                className={`sr-from-x-step ${iv ? "sr-inview" : ""}`}
                style={{ display: "flex", alignItems: "flex-start", gap: 22, position: "relative", "--sr-delay": reduced ? "0s" : `${0.1 + i * 0.12}s` } as CSSProperties}
              >

                <div style={{
                  width: 58, height: 58, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", zIndex: 2,
                  background: s.active
                    ? "linear-gradient(145deg, rgba(0,212,255,0.15), rgba(0,212,255,0.05))"
                    : "rgba(255,255,255,0.025)",
                  border: s.active ? "2px solid #00d4ff" : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: s.active ? "0 0 30px rgba(0,212,255,0.15)" : "none",
                }}>
                  <s.icon size={22} color={s.active ? "#00d4ff" : "#555"} strokeWidth={s.active ? 2 : 1.5} />
                </div>

                <div style={{ paddingTop: 6, minWidth: 0, flex: 1, wordBreak: "break-word" }}>
                  <div style={{
                    display: "inline-block", fontSize: 10, fontWeight: 700,
                    textTransform: "uppercase" as const, letterSpacing: "0.14em",
                    color: s.active ? "#050508" : "#555",
                    background: s.active ? "#00d4ff" : "rgba(255,255,255,0.04)",
                    padding: "3px 10px", borderRadius: 6, marginBottom: 8,
                  }}>{s.step}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: "#888", lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`sr-from-y sr-from-y-tight sr-ease ${iv ? "sr-inview" : ""}`}
          style={{ marginTop: 56, transitionDelay: reduced ? "0s" : "0.6s" }}
        >
          <EmailForm variant="hero" />
        </div>
      </div>
    </section>
  );
}
