import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GiveawayForm from "@/components/promo/GiveawayForm";
import CountdownTimer from "@/components/ui/CountdownTimer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giveaway — 10 mesta u kursu",
  robots: { index: false, follow: false },
};

/**
 * Tajmer do 14.04.2026. 00:00:00, Europe/Belgrade (CEST = UTC+2 u aprilu).
 */
const TARGET_DATE = new Date("2026-04-14T00:00:00+02:00");

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
        <section
          className="giveaway-page__section"
          style={{
            padding: "110px 24px 120px",
            maxWidth: 980,
            margin: "0 auto",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h1 className="giveaway-page__headline">Osvoji besplatan pristup kursu</h1>
            <p className="giveaway-page__subtitle">Poklanjamo 10 mesta potpuno besplatno.</p>
          </div>

          <div className="giveaway-page__card">
            <GiveawayForm accent="gold" />
            <div style={{ marginTop: 20, marginBottom: 8, display: "flex", justifyContent: "center" }}>
              <CountdownTimer targetDate={TARGET_DATE} theme="giveaway" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
