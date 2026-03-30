"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Music2 } from "lucide-react";
import Image from "next/image";
import { useInView } from "@/lib/use-in-view";
import { useReducedMotion } from "@/lib/use-reduced-motion";

interface Article {
  id: string;
  badge: { icon: ReactNode; label: string; color: string; bg: string; border: string };
  heroImage: string;
  heroImages?: string[];
  heroImagePosition?: string;
  heroImagePositions?: string[];
  overlayLogo?: { src: string; alt: string; subtitle: string; title: string };
  title: ReactNode;
  intro: ReactNode;
  quote?: { text: string; author: string };
  full: ReactNode;
  date: string;
}

const articles: Article[] = [
  {
    id: "trile",
    badge: {
      icon: <Music2 size={12} color="#a855f7" />,
      label: "CEO",
      color: "#a855f7",
      bg: "rgba(168,85,247,0.07)",
      border: "rgba(168,85,247,0.18)",
    },
    heroImage: "/blog-trile-1.png",
    heroImages: ["/blog-trile-2.png", "/blog-trile-3.png", "/blog-trile-4b.jpg", "/blog-trile-5.png", "/blog-trile-6.png", "/blog-trile-7.png", "/blog-trile-8.png"],
    heroImagePosition: "center 25%",
    heroImagePositions: [
      "center 25%",
      "center 25%",
      "center 60%",
      "center 25%",
      "center 25%",
      "center 25%",
      "center 25%",
    ],
    title: (
      <>
        <a href="https://www.instagram.com/trileofficial?igsh=MXVud3U3bWJsdXMxdQ==" target="_blank" rel="noopener noreferrer" style={{ display: "block", color: "inherit", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.color = "#a855f7"; }} onMouseLeave={e => { e.currentTarget.style.color = "inherit"; }}>Trile</a>
        <span style={{ display: "block", fontSize: "0.85em", fontWeight: 600, color: "#a855f7", marginTop: 4 }}>Muzičar, osnivač AI Hype Akademije</span>
      </>
    ),
    date: "2026",
    intro: (
      <>
        <p style={{ fontSize: 15, color: "#999", lineHeight: 1.75, marginBottom: 16 }}>
          <strong style={{ color: "#fff" }}>Trile</strong> je poznati muzičar sa Balkana i osnivač AI Hype Akademije. Godinama je aktivan na regionalnoj muzičkoj sceni i kroz svoje pesme je izgradio veliku publiku širom Balkana, sa milionima pregleda na spotovima i pesmama.
        </p>
        <p style={{ fontSize: 15, color: "#999", lineHeight: 1.75, marginBottom: 20 }}>
          Autor je hitova poput „Ciganka“, „Hugo“, „Feragamo“, „Moja Lelo“ i „Kaljinka“. Poznat je po autentičnom stilu i spremnosti da eksperimentiše i pomera granice u produkciji.
        </p>
      </>
    ),
    full: (
      <>
        <p style={{ fontSize: 15, color: "#999", lineHeight: 1.75, marginBottom: 16 }}>
          U poslednjih nekoliko godina intenzivno koristi veštačku inteligenciju u video i audio produkciji, koristeći AI alate za razvoj ideja, kreiranje vizuelnih stilova i unapređenje kvaliteta produkcije.
        </p>
        <p style={{ fontSize: 15, color: "#999", lineHeight: 1.75, marginBottom: 16 }}>
          Iz tog iskustva nastala je <strong style={{ color: "#fff" }}>AI Hype Akademija</strong>. Cilj akademije je da pokaže ljudima kako uz pomoć AI alata mogu sami da prave muziku, video sadržaj i moderan digitalni sadržaj, čak i bez velikog produkcijskog tima.
        </p>
      </>
    ),
  },
];

function HeroSlideshow({
  images,
  alt,
  objectPosition,
  objectPositions,
  active,
}: {
  images: string[];
  alt?: string;
  objectPosition?: string;
  objectPositions?: string[];
  active: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  const currentObjectPosition = objectPositions?.[index] ?? objectPosition ?? "center";
  const imgStyle = { objectFit: "cover" as const, objectPosition: currentObjectPosition };

  useEffect(() => {
    if (images.length <= 1 || prefersReducedMotion || isHovered || !active) return;
    const id = setInterval(() => setIndex(i => (i + 1) % images.length), 3200);
    return () => clearInterval(id);
  }, [images.length, prefersReducedMotion, isHovered, active]);

  if (images.length === 1) {
    const oneObjectPosition = objectPositions?.[0] ?? objectPosition ?? "center";
    return (
      <Image src={images[0]} alt={alt ?? ""} fill style={{ objectFit: "cover", objectPosition: oneObjectPosition }} sizes="(max-width: 768px) 100vw, 50vw" />
    );
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: "absolute", inset: 0 }}
    >
      {images.map((src, i) => (
        <div
          key={src}
          className="blog-slide-layer"
          style={{
            opacity: i === index ? 1 : 0,
            zIndex: i === index ? 1 : 0,
            pointerEvents: i === index ? "auto" : "none",
          }}
        >
          <Image
            src={src}
            alt={alt ?? ""}
            fill
            style={imgStyle}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      ))}
      <div style={{
        position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: 6, zIndex: 2,
      }}>
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => setIndex(i)}
            style={{
              width: 6, height: 6, borderRadius: "50%",
              background: i === index ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
              border: "none", cursor: "pointer", padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ArticleCard({ article, active }: { article: Article; active: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const images = article.heroImages?.length ? article.heroImages : [article.heroImage];

  return (
    <div
      className="card blog-article-card"
      style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      <div style={{ position: "relative", height: 240, overflow: "hidden", flexShrink: 0 }}>
        <HeroSlideshow
          images={images}
          objectPosition={article.heroImagePosition}
          objectPositions={article.heroImagePositions}
          active={active}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(5,5,12,0.95) 0%, rgba(5,5,12,0.3) 50%, transparent 100%)",
          zIndex: 2,
          pointerEvents: "none",
        }} />
        {article.overlayLogo && (
          <div style={{ position: "absolute", bottom: 16, left: 20, display: "flex", alignItems: "center", gap: 10, zIndex: 3 }}>
            <Image src={article.overlayLogo.src} alt={article.overlayLogo.alt} width={44} height={44}
              style={{ borderRadius: 8, objectFit: "cover", border: `2px solid ${article.badge.color}66` }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: article.badge.color, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{article.overlayLogo.title}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{article.overlayLogo.subtitle}</div>
            </div>
          </div>
        )}
        <div style={{ position: "absolute", top: 14, left: 16, zIndex: 3 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: article.badge.bg, border: `1px solid ${article.badge.border}`,
            borderRadius: 50, padding: "4px 12px",
          }}>
            {article.badge.icon}
            <span style={{ fontSize: 10, fontWeight: 700, color: article.badge.color, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{article.badge.label}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 24px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 11, color: "#555", marginBottom: 10 }}>{article.date}</div>
        <h3 style={{ fontSize: "clamp(16px, 2.5vw, 22px)", fontWeight: 800, lineHeight: 1.3, marginBottom: 16, color: "#fff" }}>
          {article.title}
        </h3>

        {article.intro}

        {article.quote && (
          <div style={{
            background: `${article.badge.bg}`, border: `1px solid ${article.badge.border}`,
            borderLeft: `3px solid ${article.badge.color}`,
            borderRadius: "0 10px 10px 0", padding: "14px 16px", marginBottom: 16,
          }}>
            <p style={{ fontSize: 12, color: "#bbb", lineHeight: 1.75, fontStyle: "italic", marginBottom: 6 }}>
              &ldquo;{article.quote.text}&rdquo;
            </p>
            <span style={{ fontSize: 10, color: article.badge.color, fontWeight: 700, letterSpacing: "0.06em" }}>— {article.quote.author}</span>
          </div>
        )}

        {expanded && (
          <div className="blog-expand-body">
            {article.full}
          </div>
        )}

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16,
            background: "none", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, padding: "8px 14px", cursor: "pointer",
            color: "#666", fontSize: 12, fontFamily: "inherit",
            transition: "all 0.2s ease", alignSelf: "flex-start",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
        >
          {expanded ? <><ChevronUp size={13} /> Prikaži manje</> : <><ChevronDown size={13} /> Pročitaj ceo članak</>}
        </button>
      </div>
    </div>
  );
}

export default function BlogSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.08, margin: "180px 0px 220px 0px" });
  const reduced = useReducedMotion();
  const iv = inView || reduced;

  return (
    <section id="blog" ref={ref} className={reduced ? "sr-nomotion" : undefined} style={{ position: "relative", zIndex: 10, padding: "80px 24px 100px", contentVisibility: "auto", containIntrinsicSize: "auto 700px" }}>
      <div className="section-container">

        <div className={`sr-from-y sr-from-y-lg sr-ease ${iv ? "sr-inview" : ""}`} style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 50, padding: "6px 16px", marginBottom: 18,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4ff", boxShadow: "0 0 6px #00d4ff" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Ko stoji iza AI Hype Akademije</span>
          </div>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800, lineHeight: 1.15 }}>
            Muzika, video i <span style={{ color: "#00d4ff" }}>AI eksperti</span>
          </h2>
        </div>

        <style>{`.blog-grid{display:grid;grid-template-columns:1fr;gap:24px;max-width:400px;margin:0 auto;width:100%}`}</style>
        <div className={`blog-grid sr-blog-cards ${iv ? "sr-inview" : ""}`}>
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} active={Boolean(inView)} />
          ))}
        </div>
      </div>
    </section>
  );
}
