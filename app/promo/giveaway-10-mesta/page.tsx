import Header from "@/components/layout/Header";
import GiveawayForm from "@/components/promo/GiveawayForm";
import CountdownTimer from "@/components/ui/CountdownTimer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giveaway — 5 mesta u kursu",
  robots: { index: false, follow: false },
};

/**
 * Tajmer do 15.04.2026. 00:00:00, Europe/Belgrade (CEST = UTC+2 u aprilu).
 */
const TARGET_DATE = new Date("2026-04-15T00:00:00+02:00");

const SPARKLE_INDICES = [0, 1, 2, 3, 4, 5, 6, 7] as const;

export default function GiveawayPage() {
  return (
    <div className="giveaway-page" style={{ contain: "layout" }}>
      <div className="giveaway-page__bg" aria-hidden>
        <div className="giveaway-page__glow-gold" />
        <div className="giveaway-page__glow-violet" />
        <div className="giveaway-page__sparkles">
          {SPARKLE_INDICES.map((i) => (
            <span key={i} className={`giveaway-page__sparkle giveaway-page__sparkle--${i}`} />
          ))}
        </div>
      </div>
      <Header />
      <main className="giveaway-page__main">
        <section className="giveaway-page__section giveaway-layout">
          <style>{`
            .giveaway-layout{
              position: relative;
              isolation: isolate;
              overflow: hidden;
              padding: clamp(36px, 5vw, 56px) 20px clamp(14px, 2vw, 22px);
              width: 100vw;
              max-width: none;
              margin-left: calc(50% - 50vw);
              margin-right: calc(50% - 50vw);
              border-radius: clamp(22px, 2.4vw, 32px);
              background: #040913;
            }
            .giveaway-layout::before{
              content:"";
              position:absolute;
              z-index:0;
              inset:0;
              border-radius: inherit;
              background:url("/giveaway-layout-bg.png") center 12% / min(100%, 1680px) auto no-repeat;
              filter: blur(1.15px) saturate(0.84) brightness(0.78);
              pointer-events:none;
            }
            .giveaway-layout::after{
              content:"";
              position:absolute;
              z-index:1;
              inset:0;
              border-radius: inherit;
              pointer-events:none;
              background:
                linear-gradient(to bottom, rgba(4, 9, 19, 0) 0%, rgba(4, 9, 19, 0) 52%, rgba(4, 9, 19, 0.45) 80%, rgba(4, 9, 19, 0.92) 100%),
                linear-gradient(165deg, rgba(1, 4, 12, 0.28) 0%, rgba(3, 6, 14, 0.32) 48%, rgba(2, 4, 10, 0.34) 100%);
            }
            .gv-shell{
              position: relative;
              z-index: 2;
              max-width: 840px;
              margin: 0 auto;
              padding: clamp(22px, 3.4vw, 40px) clamp(18px, 3.2vw, 40px) clamp(10px, 1.6vw, 16px);
              border-radius: clamp(20px, 2.2vw, 28px);
              border: 1px solid rgba(0, 212, 255, 0.24);
              background: linear-gradient(165deg, rgba(3, 8, 18, 0.70) 0%, rgba(8, 8, 24, 0.74) 42%, rgba(6, 7, 12, 0.80) 100%);
              box-shadow:
                0 0 20px rgba(0, 212, 255, 0.10),
                0 0 40px rgba(102, 45, 145, 0.12),
                0 16px 42px rgba(0, 0, 0, 0.42);
            }
            .gv-hero{
              text-align:center;
              max-width: 700px;
              margin: 0 auto;
              animation: gvFadeUp .62s cubic-bezier(.22,.61,.36,1) both;
            }
            .gv-hero .giveaway-page__headline{
              margin: 0 auto 10px;
              letter-spacing: -0.02em;
              text-wrap: balance;
              font-size: clamp(34px, 4.6vw, 52px);
              line-height: 1.06;
              font-weight: 800;
              filter: none;
            }
            .gv-hero .gv-subheadline{
              margin: 0 auto 20px;
              font-weight: 700;
              font-size: clamp(21px, 2.5vw, 30px);
              line-height: 1.2;
              letter-spacing: -0.01em;
              color: rgba(234, 242, 255, 0.96);
              text-wrap: balance;
            }
            .gv-hero .giveaway-page__subtitle{
              max-width: 62ch;
              margin: 0 auto;
              text-align: center;
              line-height: 1.72;
              color: rgba(245, 247, 250, 0.90);
              text-wrap: pretty;
              font-size: clamp(16px, 1.28vw, 19px);
              letter-spacing: 0;
              font-weight: 500;
            }
            .gv-subtitle-line{display:block;}
            .gv-subtitle-line + .gv-subtitle-line{margin-top:8px;}
            .gv-subtitle-bullets{
              list-style:none;
              margin:14px auto 0;
              padding:0;
              max-width:60ch;
              display:grid;
              gap:10px;
              justify-items:center;
            }
            .gv-subtitle-bullets li{
              padding-left:0;
              line-height: 1.62;
              text-align:left;
              text-wrap: pretty;
              display:flex;
              align-items:flex-start;
              justify-content:center;
              gap:10px;
              max-width:min(48ch,100%);
            }
            .gv-subtitle-bullets li::before{
              content:"";
              flex-shrink:0;
              width:6px;
              height:6px;
              margin-top:0.48em;
              border-radius:999px;
              background:#7B61FF;
              box-shadow:0 0 8px rgba(123,97,255,0.38);
            }
            .gv-subtitle-bullets + .gv-subtitle-line{margin-top:14px;}
            .gv-badge{
              position:relative;overflow:hidden;
              display:inline-flex;align-items:center;gap:10px;padding:8px 14px;border-radius:999px;
              margin:0 auto 14px;background:rgba(255,181,71,0.14);border:1px solid rgba(255,181,71,0.48);
              color:#FFB547;font-weight:900;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;
              box-shadow:0 0 18px rgba(255,181,71,0.26),0 0 32px rgba(255,181,71,0.12);
              animation:gvBadgePulse 1.9s ease-in-out infinite;
            }
            .gv-badge::after{
              content:"";
              position:absolute;
              inset:0;
              border-radius:inherit;
              background:linear-gradient(110deg, transparent 24%, rgba(255,255,255,0.42) 50%, transparent 76%);
              transform:translateX(-130%);
              animation:gvBadgeSweep 2.4s ease-in-out infinite;
              pointer-events:none;
            }
            @keyframes gvBadgePulse{
              0%,100%{box-shadow:0 0 18px rgba(255,181,71,0.22),0 0 30px rgba(255,181,71,0.10);filter:saturate(1);}
              50%{box-shadow:0 0 30px rgba(255,181,71,0.45),0 0 54px rgba(255,181,71,0.22);filter:saturate(1.08);}
            }
            @keyframes gvBadgeSweep{
              0%,15%{transform:translateX(-130%);}
              55%,100%{transform:translateX(130%);}
            }
            .gv-main-card{max-width:640px;margin:40px auto 0;}
            .gv-card-timer-wrap{margin-top:12px;margin-bottom:10px;}
            .gv-main-card .giveaway-page__card{
              padding:22px 20px 18px;
              animation: gvFadeUp .68s cubic-bezier(.22,.61,.36,1) both;
              animation-delay: .08s;
              transition: transform .35s ease, box-shadow .35s ease, border-color .35s ease;
            }
            .gv-main-card .giveaway-page__card:hover{
              transform: translateY(-1px);
            }
            .gv-value{
              max-width: 660px;
              margin: 36px auto 0;
              text-align: center;
              animation: gvFadeUp .74s cubic-bezier(.22,.61,.36,1) both;
              animation-delay: .16s;
            }
            .gv-value-title{
              display:inline-flex;
              align-items:center;
              justify-content:center;
              gap:6px;
              color:#DCE6F2;
              font-weight:800;
              font-size:clamp(22px,3.5vw,30px);
              line-height:1.18;
              margin:0 auto 16px;
              padding:8px 16px;
              border-radius:999px;
              border:1px solid rgba(167,139,250,0.38);
              background:rgba(124,58,237,0.14);
              box-shadow:0 0 14px rgba(124,58,237,0.22),0 0 20px rgba(102,45,145,0.18);
            }
            .gv-value-title .gv-accent-violet{
              color:#7B61FF;
              text-shadow:0 0 14px rgba(123,97,255,0.28);
            }
            .gv-bullets{list-style:none;padding:0;margin:0 auto;display:grid;gap:14px;max-width:620px;text-align:left;}
            .gv-bullets li{
              position: relative;
              color:rgba(245, 247, 250, 0.96);
              font-size:clamp(14.5px,1.6vw,16.5px);
              line-height:1.62;
              padding:8px 0 8px 42px;
              text-wrap: pretty;
              transition: color .28s ease, transform .28s ease;
            }
            .gv-bullets li:hover{transform: translateX(2px);}
            .gv-bullets li:nth-child(1){animation: gvFadeUp .58s cubic-bezier(.22,.61,.36,1) both; animation-delay: .22s;}
            .gv-bullets li:nth-child(2){animation: gvFadeUp .58s cubic-bezier(.22,.61,.36,1) both; animation-delay: .30s;}
            .gv-bullets li:nth-child(3){animation: gvFadeUp .58s cubic-bezier(.22,.61,.36,1) both; animation-delay: .38s;}
            .gv-bullets li::before{
              content:"";
              position:absolute;
              left:0;
              top:50%;
              width:26px;
              height:26px;
              transform:translateY(-50%);
              border-radius:999px;
              background:radial-gradient(circle, rgba(107,76,224,0.95) 0 28%, rgba(91,63,214,0.62) 30% 52%, rgba(91,63,214,0.20) 54% 100%);
              box-shadow:0 0 16px rgba(91,63,214,0.40), 0 0 26px rgba(72,45,166,0.30);
            }
            .gv-footer-copy{
              color:rgba(245, 247, 250, 0.92);
              font-size:clamp(14px,1.6vw,15.5px);
              line-height:1.7;
              margin:12px auto 0;
              max-width:620px;
              text-align:left;
              text-wrap: pretty;
            }
            .gv-accent-cyan{color:#4FE3F0;font-weight:800;}
            .gv-accent-violet{color:#7B61FF;font-weight:700;}
            @keyframes gvFadeUp{
              from{opacity:0;transform:translateY(10px);}
              to{opacity:1;transform:translateY(0);}
            }
            @media (prefers-reduced-motion: reduce){
              .gv-hero,.gv-main-card .giveaway-page__card,.gv-value,.gv-bullets li{
                animation:none !important;
                transition:none !important;
                transform:none !important;
              }
              .giveaway-layout::before{
                filter: saturate(0.88) brightness(0.80);
                transform: none;
                inset: 0;
              }
            }
            @media (max-width: 640px){
              .giveaway-layout{
                border-radius: 20px;
                margin-left: 0;
                margin-right: 0;
                width: auto;
              }
              .giveaway-layout::before{
                background-size: 100% auto;
                background-position: center 10%;
              }
              .gv-shell{
                padding: 16px 12px 12px;
                border-radius: 18px;
              }
              .gv-main-card{margin-top: 32px;}
              .gv-main-card .giveaway-page__card{padding:14px 12px 16px;}
              .gv-card-timer-wrap{margin-top:8px;margin-bottom:8px;}
              .gv-badge{font-size:11px;letter-spacing:0.09em;padding:7px 12px;}
              .gv-hero .giveaway-page__headline{font-size:clamp(30px, 9vw, 42px);line-height:1.08;}
              .gv-hero .gv-subheadline{font-size:clamp(20px, 6.2vw, 26px);margin-bottom:16px;}
              .gv-hero .giveaway-page__subtitle{font-size:16px;line-height:1.65;max-width:36ch;}
              .gv-value{margin-top: 28px;}
              .gv-bullets{gap:12px;}
              .gv-bullets li{padding:8px 0 8px 36px;}
              .gv-bullets li::before{width:22px;height:22px;}
            }
          `}</style>

          <div className="gv-shell">
            <div className="gv-hero">
              <p className="gv-badge">⚠️ LANSIRANJE: 15. APRIL 2026.</p>
              <h1 className="giveaway-page__headline">Samo 5 besplatnih pristupa.</h1>
              <h2 className="gv-subheadline">Jednom. Bez ponavljanja.</h2>
              <div className="giveaway-page__subtitle">
                <span className="gv-subtitle-line">Na dan lansiranja nasumično biramo 5 imena sa ove liste.</span>
                <span className="gv-subtitle-line">Ako želiš da budeš u igri, prijava mora biti završena na vreme.</span>
                <ul className="gv-subtitle-bullets">
                  <li>Ako nisi na listi, nisi u izvlačenju.</li>
                  <li>Nema kasnije prijave.</li>
                  <li>Nema ponovnog kruga.</li>
                </ul>
                <span className="gv-subtitle-line">
                  Za 10 sekundi zatvaraš temu i znaš da si <span className="gv-accent-violet">unutra</span>.
                </span>
              </div>
            </div>

            <div className="gv-main-card">
              <div className="giveaway-page__card">
                <div className="gv-card-timer-wrap" style={{ display: "flex", justifyContent: "center" }}>
                  <CountdownTimer targetDate={TARGET_DATE} theme="giveaway" />
                </div>
                <GiveawayForm accent="cyan" />
              </div>
            </div>
            <p className="gv-footer-copy" style={{ marginTop: 22, marginBottom: 4 }}>
              Misliš da nećeš biti izvučen? Nema veze! Svi prijavljeni dobijaju{" "}
              <span className="giveaway-page__accent-word">POKLON</span> na dan lansiranja! Prijavi se i preuzmi svoj poklon
              15. aprila za sigurniji <span className="gv-accent-violet">rast</span>!
            </p>

            <div className="gv-value">
              <p className="gv-value-title">
                Sta te ceka <span className="gv-accent-violet">unutra</span>?
              </p>
              <ul className="gv-bullets">
                <li>
                  Vrhunska video produkcija bez studija i skupe opreme za brži{" "}
                  <span className="gv-accent-cyan">start</span>
                </li>
                <li>
                  Precizni <span className="gv-accent-cyan">alati</span> i <span className="gv-accent-cyan">sistemi</span> koje već
                  koristi 1% najboljih kreatora
                </li>
                <li>
                  Potpuna dominacija nad algoritmom uz drastičnu uštedu vremena i brži{" "}
                  <span className="gv-accent-cyan">rezultat</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
