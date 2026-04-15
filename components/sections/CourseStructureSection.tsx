"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { Zap, Star, Gift, Crown, BookOpen } from "lucide-react";
import { useInView } from "@/lib/use-in-view";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import styles from "./CourseStructureSection.module.css";

interface BonusItem {
  icon: LucideIcon;
  title: string;
  description: string;
  value: string;
}

const BONUSES: BonusItem[] = [
  {
    icon: Crown,
    title: "Privatna Zajednica",
    description:
      "Pristup privatnoj zajednici gde deliš radove, dobijaš feedback i napreduješ brže uz ljude koji rade isto što i ti.",
    value: "Vrednost: €1.000",
  },
  {
    icon: Zap,
    title: "AI Prompt Biblioteka",
    description: "Tačno strukturirani promptovi koji ti ubrzavaju ceo proces, manje razmišljanja, više rezultata.",
    value: "Vrednost: €300",
  },
  {
    icon: Star,
    title: "Live Group Coaching",
    description:
      "Live sesije sa profesorima i zajednicom, hot seat coaching, feedback na sadržaj i jasna strategija za rast.",
    value: "Vrednost: €700",
  },
  {
    icon: BookOpen,
    title: "Moduli",
    description: "Ukupna vrednost lekcija",
    value: "Vrednost: €1.000",
  },
  {
    icon: Gift,
    title: "Lifetime Updates",
    description:
      "Besplatni pristup svim budućim modulima, informacijama o novim alatima i update-ovima kursa, zauvek.",
    value: "Vrednost: Neprocenjivo",
  },
];

export default function CourseStructureSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.08 });
  const reduced = useReducedMotion();
  const iv = inView || reduced;

  return (
    <section
      ref={ref}
      id="ekskluzivni-bonusi"
      className={`landing-section-y ${styles.courseStructure}${reduced ? " sr-nomotion" : ""}`}
      style={{
        position: "relative",
        zIndex: 10,
        textAlign: "center",
      }}
    >
      <div className={styles.courseStructureBg} aria-hidden />

      <div className={`section-container ${styles.courseStructureInner}`}>
        <div className={`landing-section-head sr-from-y sr-from-y-xl sr-ease ${iv ? "sr-inview" : ""}`}>
          <div className="landing-eyebrow-pill landing-eyebrow-pill--problem">
            <span
              className="landing-eyebrow-dot landing-eyebrow-dot--problem"
              style={{ background: "#FFB547", boxShadow: "0 0 8px rgba(255,181,71,0.55)" }}
            />
            <span className={`landing-eyebrow-pill-label ${styles.bonusEyebrowLabel}`}>
              Ovo je prava vrednost
              <br />
              AI Hype Akademije.
            </span>
          </div>

          <h2 className="landing-display">
            Ukupna vrednost kursa <span className="gradient-text">€3.000</span>
          </h2>
          <p className="landing-lede landing-measure-copy" style={{ marginBottom: 0 }}>
            Sve ovo dolazi uz kurs – potpuno besplatno. Alati, template-i i resursi koji te stavljaju u prednost od prvog
            dana.
          </p>
        </div>

        <div className={`${styles.bonusGrid} sr-outcomes ${iv ? "sr-inview" : ""}`}>
          {BONUSES.map((bonus) => {
            const BIcon = bonus.icon;
            return (
              <div key={bonus.title} className={`${styles.bonusCard} outcome-card-sr`}>
                <div className={styles.bonusCardIcon}>
                  <BIcon size={32} strokeWidth={1.65} aria-hidden />
                </div>
                <h3 className={styles.bonusCardTitle}>{bonus.title}</h3>
                <p className={styles.bonusCardDescription}>{bonus.description}</p>
                <div className={styles.bonusCardValue}>{bonus.value}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
