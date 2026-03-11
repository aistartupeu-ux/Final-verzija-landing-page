"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Trophy, ChevronDown, ChevronUp, Music2, Briefcase } from "lucide-react";
import Image from "next/image";

interface Article {
  id: string;
  badge: { icon: React.ReactNode; label: string; color: string; bg: string; border: string };
  heroImage: string;
  heroImages?: string[];
  heroImagePosition?: string; // npr. "center 30%" da se vidi lik
  overlayLogo?: { src: string; alt: string; subtitle: string; title: string };
  title: React.ReactNode;
  intro: React.ReactNode;
  quote?: { text: string; author: string };
  full: React.ReactNode;
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
    heroImage: "/blog-trile-2.png",
    heroImages: ["/blog-trile-2.png", "/blog-trile-3.png", "/blog-trile-4.png", "/blog-trile-5.png"],
    heroImagePosition: "center 25%",
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
  {
    id: "rok-kadoic",
    badge: {
      icon: <Briefcase size={12} color="#22c55e" />,
      label: "Project manager",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.07)",
      border: "rgba(34,197,94,0.18)",
    },
    heroImage: "/blog-rok-kadoic.png",
    heroImagePosition: "center 5%",
    title: (
      <>
        <a href="https://www.instagram.com/rok_kadoic?igsh=eW1weW81N3Rhbjkw" target="_blank" rel="noopener noreferrer" style={{ display: "block", color: "inherit", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => { e.currentTarget.style.color = "#22c55e"; }} onMouseLeave={e => { e.currentTarget.style.color = "inherit"; }}>Rok Kadoič</a>
        <span style={{ display: "block", fontSize: "0.85em", fontWeight: 600, color: "#22c55e", marginTop: 4 }}>Reditelj, kreativni producent AI Hype Akademije</span>
      </>
    ),
    date: "2026",
    intro: (
      <>
        <p style={{ fontSize: 15, color: "#999", lineHeight: 1.75, marginBottom: 16 }}>
          <strong style={{ color: "#fff" }}>Rok Kadoič</strong> je slovenački reditelj, direktor fotografije i kreativni producent koji godinama radi na muzičkim spotovima i vizuelnim projektima za izvođače iz regiona i inostranstva. Njegov rad je prepoznatljiv po snažnoj vizuelnoj estetici i filmskom pristupu video produkciji.
        </p>
        <p style={{ fontSize: 15, color: "#999", lineHeight: 1.75, marginBottom: 20 }}>
          Pored rada u muzici, Rok je deo glavnog video tima MMA borca <strong style={{ color: "#fff" }}>Francisa Ngannoua</strong>, gde učestvuje u produkciji sadržaja i razvoju vizuelne strategije za globalnu publiku.
        </p>
      </>
    ),
    full: (
      <>
        <p style={{ fontSize: 15, color: "#999", lineHeight: 1.75, marginBottom: 16 }}>
          U poslednje vreme intenzivno radi sa AI tehnologijom u muzici i videu. Njegov AI film „Milivojka“ osvojio je nagradu na AI International Music Video Festivalu u Los Anđelesu, a već ima iskustvo u produkciji potpuno AI muzičkih spotova i AI pesama.
        </p>
        <p style={{ fontSize: 15, color: "#999", lineHeight: 1.75, marginBottom: 16 }}>
          U AI Hype Akademiji, zajedno sa Triletom, deli svoje iskustvo iz video produkcije i rada sa AI alatima kako bi pokazao kako danas mogu da se prave AI spotovi, muzika i video sadržaj na profesionalnom nivou.
        </p>
      </>
    ),
  },
  {
    id: "milivojka",
    badge: {
      icon: <Trophy size={12} color="#facc15" fill="#facc15" />,
      label: "Vest",
      color: "#facc15",
      bg: "rgba(250,204,21,0.07)",
      border: "rgba(250,204,21,0.18)",
    },
    heroImage: "/blog-milivojka-thumb.png",
    overlayLogo: {
      src: "/blog-festival-logo.jpg",
      alt: "Festival logo",
      title: "AI International Music Video Festival",
      subtitle: "Los Anđeles · mart 2026.",
    },
    title: (
      <>Rok Kadoič osvojio nagradu u Los Anđelesu za AI film{" "}<span style={{ color: "#facc15" }}>&ldquo;Milivojka&rdquo;</span></>
    ),
    date: "Los Anđeles, mart 2026.",
    intro: (
      <>
        <p style={{ fontSize: 15, color: "#999", lineHeight: 1.75, marginBottom: 16 }}>
          Slovenački reditelj <strong style={{ color: "#fff" }}>Rok Kadoič</strong> nagrađen je na AI International Music Video Festival u Los Anđelesu za svoj trominutni AI muzički film <em>Milivojka</em>. Festival, koji okuplja autore iz celog sveta i fokusiran je na spoj muzike, filma i veštačke inteligencije, prepoznaje projekte koji pomeraju granice savremene vizuelne umetnosti.
        </p>
        <p style={{ fontSize: 15, color: "#999", lineHeight: 1.75, marginBottom: 20 }}>
          Film <em>Milivojka</em> <span style={{ color: "#aaa" }}>(Slovenija, 2026, 3 min)</span> duboko je ukorenjen u balkanski, slovenski emotivni pejzaž, oslanjajući se na folklorne senzibilitete kako bi ispričao priču o ljubavi, gubitku i trajnom sećanju.
        </p>
      </>
    ),
    quote: {
      text: "Milivojka by Rok Kadoič is unmistakably rooted in a Balkan, Slavic emotional landscape, drawing on folkloric sensibilities to tell a story of love, loss, and enduring memory. The cinematic structure, moving between a younger and older version of the protagonist, provides a clear and emotionally effective narrative arc...",
      author: "Žiri festivala, AI International Music Video Festival",
    },
    full: (
      <>
        <p style={{ fontSize: 15, color: "#999", lineHeight: 1.75, marginBottom: 16 }}>
          Žiri je posebno istakao snažnu emocionalnu atmosferu, povezanost muzike i slike, kao i doslednost u vizuelnom izrazu. Iako su primetili tehnička ograničenja aktuelnih AI alata u prenošenju najdubljih nijansi bola, ukupna realizacija ocenjena je kao koherentna, zrela i umetnički uverljiva.
        </p>
        <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 20, position: "relative", height: 220 }}>
          <Image src="/blog-theater.jpg" alt="Festival venue" fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
        <p style={{ fontSize: 15, color: "#999", lineHeight: 1.75, marginBottom: 16 }}>
          Pored autorskog rada, <strong style={{ color: "#fff" }}>Rok Kadoič</strong> je i produkcijski vođa te autor filmmaking kursa u najvećoj balkanskoj AI edukativnoj platformi{" "}
          <strong style={{ color: "#00d4ff" }}>AI HYPE Akademija</strong>, gde aktivno edukuje novu generaciju kreatora u oblasti AI filma, vizuelne naracije i savremene produkcije.
        </p>
        <p style={{ fontSize: 15, color: "#999", lineHeight: 1.75 }}>
          Nagrada u Los Anđelesu dodatno potvrđuje njegovu poziciju jednog od vodećih regionalnih autora koji uspešno spajaju tradicionalni emotivni narativ sa savremenim AI alatima, stvarajući radove sa međunarodnim odjekom.
        </p>
        <p style={{ fontSize: 12, color: "#555", marginTop: 16, fontStyle: "italic" }}>Izvor: AI International Music Video Festival, mart 2026.</p>
      </>
    ),
  },
];

function HeroSlideshow({ images, alt, objectPosition }: { images: string[]; alt?: string; objectPosition?: string }) {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const imgStyle = { objectFit: "cover" as const, objectPosition: objectPosition || "center" };
  useEffect(() => {
    setPrefersReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (images.length <= 1 || prefersReducedMotion || isHovered) return;
    const id = setInterval(() => setIndex(i => (i + 1) % images.length), 4500);
    return () => clearInterval(id);
  }, [images.length, prefersReducedMotion, isHovered]);

  if (images.length === 1) {
    return (
      <Image src={images[0]} alt={alt ?? ""} fill style={imgStyle} sizes="(max-width: 768px) 100vw, 50vw" />
    );
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: "absolute", inset: 0 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{ position: "absolute", inset: 0 }}
        >
          <Image
            src={images[index]}
            alt={alt ?? ""}
            fill
            style={imgStyle}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </motion.div>
      </AnimatePresence>
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

function ArticleCard({ article, delay }: { article: Article; delay: number }) {
  const [expanded, setExpanded] = useState(false);
  const images = article.heroImages?.length ? article.heroImages : [article.heroImage];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay }}
      className="card"
      style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      {/* Hero image / slideshow */}
      <div style={{ position: "relative", height: 240, overflow: "hidden", flexShrink: 0 }}>
        <HeroSlideshow images={images} objectPosition={article.heroImagePosition} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(5,5,12,0.95) 0%, rgba(5,5,12,0.3) 50%, transparent 100%)",
        }} />
        {article.overlayLogo && (
          <div style={{ position: "absolute", bottom: 16, left: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <Image src={article.overlayLogo.src} alt={article.overlayLogo.alt} width={44} height={44}
              style={{ borderRadius: 8, objectFit: "cover", border: `2px solid ${article.badge.color}66` }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: article.badge.color, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{article.overlayLogo.title}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{article.overlayLogo.subtitle}</div>
            </div>
          </div>
        )}
        <div style={{ position: "absolute", top: 14, left: 16 }}>
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

      {/* Content */}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
            {article.full}
          </motion.div>
        )}

        <button
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
    </motion.div>
  );
}

export default function BlogSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section id="blog" ref={ref} style={{ position: "relative", zIndex: 10, padding: "80px 24px 100px" }}>
      <div className="section-container">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 50, padding: "6px 16px", marginBottom: 18,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4ff", boxShadow: "0 0 6px #00d4ff" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Ko stoji iza AI Hype Akademije</span>
          </div>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800, lineHeight: 1.15 }}>
            Šta se dešava u <span style={{ color: "#00d4ff" }}>AI svetu?</span>
          </h2>
        </motion.div>

        <style>{`.blog-grid{display:grid;grid-template-columns:1fr;gap:24px}@media(min-width:768px){.blog-grid{grid-template-columns:1fr 1fr}}`}</style>
        {inView && (
          <div className="blog-grid">
            {articles.map((article, i) => (
              <ArticleCard key={article.id} article={article} delay={i * 0.12} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
