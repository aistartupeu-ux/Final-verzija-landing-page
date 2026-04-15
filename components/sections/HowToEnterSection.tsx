"use client";

import { useRef, useState, useEffect, type CSSProperties } from "react";
import { UserPlus, Clock, ShoppingCart, Lock } from "lucide-react";
import SkoolCtaButton from "@/components/ui/SkoolCtaButton";
import { useInView } from "@/lib/use-in-view";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const steps = [
  { icon: UserPlus, step: "Korak 1", title: "Sada — prijave otvorene", desc: "Prijavljuješ se na listu čekanja i obezbeđuješ svoje mesto." },
  { icon: Clock, step: "Korak 2", title: "Posle 3 nedelje", desc: "Otvaramo kupovinu kursa samo za prijavljene." },
  { icon: ShoppingCart, step: "Korak 3", title: "Sledećih 7 dana", desc: "Kurs može da se kupi. Posle toga zatvaramo prijave." },
  { icon: Lock, step: "Korak 4", title: "Zatvaranje upisa", desc: "Ko uđe na vreme ima prednost. Ko čeka ostaje napolju." },
];

export default function HowToEnterSection() {
  const ref = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const reduced = useReducedMotion();
  const iv = inView || reduced;

  useEffect(() => {
    if (reduced) return;

    const els = steps.map((_, i) => stepRefs.current[i]).filter((x): x is HTMLDivElement => x !== null);
    if (els.length !== steps.length) return;

    const ratios = new Map<Element, number>();

    const apply = () => {
      let bestIdx = 0;
      let bestR = -1;
      els.forEach((el, i) => {
        const r = ratios.get(el) ?? 0;
        if (r > bestR) {
          bestR = r;
          bestIdx = i;
        }
      });
      if (bestR > 0.02) {
        setActiveIndex(bestIdx);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          ratios.set(e.target, e.isIntersecting ? e.intersectionRatio : 0);
        }
        apply();
      },
      {
        root: null,
        rootMargin: "-36% 0px -36% 0px",
        threshold: [0, 0.08, 0.15, 0.25, 0.4, 0.55, 0.7, 0.85, 1],
      }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reduced]);

  const transition = reduced ? "none" : "border-color 0.22s ease, background 0.22s ease, box-shadow 0.22s ease";

  return (
    <section
      ref={ref}
      id="kako-funkcionise"
      className={`landing-section-y--spacious${reduced ? " sr-nomotion" : ""}`}
      style={{ position: "relative", zIndex: 10, textAlign: "center" }}
    >
      <div className="section-container landing-measure-narrow">
        <div className={`landing-section-head sr-from-y sr-from-y-xl sr-ease ${iv ? "sr-inview" : ""}`}>
          <div className="landing-eyebrow-pill landing-eyebrow-pill--green">
            <span
              className="landing-eyebrow-dot landing-eyebrow-dot--green"
              style={{ background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.45)" }}
            />
            <span className="landing-eyebrow-pill-label">Proces</span>
          </div>

          <h2 className="landing-display">
            Kako ulaziš <span className="apple-accent-word">unutra?</span>
          </h2>
          <p className="landing-lede" style={{ marginBottom: 52 }}>Prvo se prijavljuješ. Onda imaš kratki prozor da uđeš u kurs.</p>
        </div>

        <div style={{ position: "relative", textAlign: "left" }}>
          <div style={{ position: "absolute", left: 28, top: 0, bottom: 0, width: 2, background: "linear-gradient(to bottom, rgba(0,212,255,0.3), rgba(124,58,237,0.15), transparent)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {steps.map((s, i) => {
              const active = i === activeIndex;
              return (
                <div
                  key={s.step}
                  ref={(el) => {
                    stepRefs.current[i] = el;
                  }}
                  className={`sr-from-x-step ${iv ? "sr-inview" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 22,
                    position: "relative",
                    "--sr-delay": reduced ? "0s" : `${0.1 + i * 0.12}s`,
                  } as CSSProperties}
                >
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      position: "relative",
                      zIndex: 2,
                      background: active
                        ? "linear-gradient(145deg, rgba(0,212,255,0.15), rgba(0,212,255,0.05))"
                        : "rgba(255,255,255,0.025)",
                      border: active ? "2px solid #00d4ff" : "1px solid rgba(255,255,255,0.06)",
                      boxShadow: active ? "0 0 24px rgba(0,212,255,0.12)" : "none",
                      transition,
                    }}
                  >
                    <s.icon size={22} color={active ? "#00d4ff" : "#555"} strokeWidth={active ? 2 : 1.5} />
                  </div>

                  <div style={{ paddingTop: 6, minWidth: 0, flex: 1, wordBreak: "break-word" }}>
                    <div
                      style={{
                        display: "inline-block",
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.14em",
                        color: active ? "#050508" : "#555",
                        background: active ? "#00d4ff" : "rgba(255,255,255,0.04)",
                        padding: "3px 10px",
                        borderRadius: 6,
                        marginBottom: 8,
                        transition: reduced ? "none" : "background 0.22s ease, color 0.22s ease",
                      }}
                    >
                      {s.step}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "#f5f5f7", marginBottom: 6 }}>{s.title}</div>
                    <div style={{ fontSize: 15, color: "rgba(245,245,247,0.55)", lineHeight: 1.55 }}>{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className={`sr-from-y sr-from-y-tight sr-ease ${iv ? "sr-inview" : ""}`}
          style={{ marginTop: 56, transitionDelay: reduced ? "0s" : "0.6s" }}
        >
          <SkoolCtaButton />
        </div>
      </div>
    </section>
  );
}
