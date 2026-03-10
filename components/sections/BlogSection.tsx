"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Trophy, ChevronDown, ChevronUp, Cpu } from "lucide-react";
import Image from "next/image";

interface Article {
  id: string;
  badge: { icon: React.ReactNode; label: string; color: string; bg: string; border: string };
  heroImage: string;
  overlayLogo?: { src: string; alt: string; subtitle: string; title: string };
  title: React.ReactNode;
  intro: React.ReactNode;
  quote?: { text: string; author: string };
  full: React.ReactNode;
  date: string;
}

const articles: Article[] = [
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
  {
    id: "seedance",
    badge: {
      icon: <Cpu size={12} color="#00d4ff" />,
      label: "AI Alati",
      color: "#00d4ff",
      bg: "rgba(0,212,255,0.07)",
      border: "rgba(0,212,255,0.18)",
    },
    heroImage: "/blog-seedance-thumb.png",
    title: (
      <>Seedance 2.0: AI Video Generator{" "}<span style={{ color: "#00d4ff" }}>kompanije ByteDance</span></>
    ),
    date: "2026.",
    intro: (
      <>
        <p style={{ fontSize: 15, color: "#999", lineHeight: 1.75, marginBottom: 16 }}>
          <strong style={{ color: "#fff" }}>Seedance 2.0</strong> je napredni AI video generator koji razvija kompanija <strong style={{ color: "#fff" }}>ByteDance</strong>, globalno poznata po platformama kao što je TikTok. Ovaj alat predstavlja sledeću fazu u razvoju tekst-u-video tehnologije, gde korisnici mogu generisati dinamične, vizuelno sofisticirane video sekvence na osnovu jednostavnih promptova.
        </p>
        <p style={{ fontSize: 15, color: "#999", lineHeight: 1.75, marginBottom: 20 }}>
          Za razliku od ranijih AI video alata koji su često imali problem sa &ldquo;raspadanjem&rdquo; likova ili promenama identiteta između frejmova, Seedance 2.0 naglasak stavlja na <strong style={{ color: "#fff" }}>stabilnost i kontinuitet</strong>.
        </p>
      </>
    ),
    full: (
      <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div style={{ position: "relative", height: 160, borderRadius: 10, overflow: "hidden" }}>
            <Image src="/blog-seedance-hud.png" alt="Seedance interface" fill style={{ objectFit: "cover" }} sizes="25vw" />
          </div>
          <div style={{ position: "relative", height: 160, borderRadius: 10, overflow: "hidden" }}>
            <Image src="/blog-seedance-control.png" alt="Seedance controls" fill style={{ objectFit: "cover" }} sizes="25vw" />
          </div>
        </div>
        {[
          { t: "Konzistentnost kroz vreme", d: "Jedan od najvećih izazova u AI videu je održavanje istog lika, proporcija i stila kroz čitavu sekvencu. Seedance 2.0 značajno unapređuje ovaj aspekt." },
          { t: "Filmski kvalitet", d: "Vizuelni rezultat je bliži profesionalnoj produkciji. Dubina kadra, simulacija kamere i svetlosni uslovi deluju prirodnije." },
          { t: "Brza produkcija sadržaja", d: "Za kreatore sadržaja, brendove i marketinške timove, ovaj alat omogućava brzo kreiranje video koncepata bez velikih budžeta." },
          { t: "Integracija sa ekosistemom društvenih mreža", d: "S obzirom na to da dolazi iz kompanije koja stoji iza TikToka, potencijal za direktnu integraciju AI video generacije u društvene platforme može značajno promeniti način nastanka sadržaja." },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d4ff", flexShrink: 0, marginTop: 7 }} />
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{item.t}: </span>
              <span style={{ fontSize: 14, color: "#999", lineHeight: 1.7 }}>{item.d}</span>
            </div>
          </div>
        ))}
        <div style={{
          background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.1)",
          borderLeft: "3px solid #00d4ff", borderRadius: "0 12px 12px 0",
          padding: "16px 18px", marginTop: 20,
        }}>
          <p style={{ fontSize: 14, color: "#aaa", lineHeight: 1.75, fontStyle: "italic" }}>
            &ldquo;Seedance 2.0 nije samo tehnološki update. On pokazuje da kompanije poput ByteDance vide budućnost u AI generisanom videu kao centralnom alatu digitalne komunikacije.&rdquo;
          </p>
        </div>
        <p style={{ fontSize: 15, color: "#999", lineHeight: 1.75, marginTop: 16 }}>
          Za kreatore to znači veću brzinu, veću kontrolu i nove estetske mogućnosti. Za AI svet, to je još jedan dokaz da <strong style={{ color: "#fff" }}>video postaje sledeće veliko bojno polje generativne inteligencije</strong>.
        </p>
      </>
    ),
  },
];

function ArticleCard({ article, delay }: { article: Article; delay: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay }}
      className="card"
      style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      {/* Hero image */}
      <div style={{ position: "relative", height: 240, overflow: "hidden", flexShrink: 0 }}>
        <Image
          src={article.heroImage}
          alt=""
          fill
          style={{ objectFit: "cover" }}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
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
    <section ref={ref} style={{ position: "relative", zIndex: 10, padding: "80px 24px 100px" }}>
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
            <span style={{ fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Blog & Vesti</span>
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
