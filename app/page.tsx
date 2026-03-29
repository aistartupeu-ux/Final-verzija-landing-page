import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import { getServerCdnUrl } from "@/lib/bunny-cdn-sign";
import {
  CDN_PATH_HERO_BG,
  CDN_PATH_EXPLAINER_MP4,
  CDN_PATH_EXPLAINER_POSTER,
  CDN_PATH_SHOWCASE_ROW1,
  CDN_PATH_SHOWCASE_ROW2,
} from "@/lib/video-cdn-paths";

// Below-fold sections loaded lazily to reduce initial JS bundle
const ProblemSection = dynamic(() => import("@/components/sections/ProblemSection"));
const SolutionSection = dynamic(() => import("@/components/sections/SolutionSection"));
const SocialProofSection = dynamic(() => import("@/components/sections/SocialProofSection"));
const ForWhoSection = dynamic(() => import("@/components/sections/ForWhoSection"));
const HowToEnterSection = dynamic(() => import("@/components/sections/HowToEnterSection"));
const FAQSection = dynamic(() => import("@/components/sections/FAQSection"));
const FinalCTASection = dynamic(() => import("@/components/sections/FinalCTASection"));
const BlogSection = dynamic(() => import("@/components/sections/BlogSection"));
const AffiliateSection = dynamic(() => import("@/components/sections/AffiliateSection"));
const VideoShowcaseSection = dynamic(() => import("@/components/sections/VideoShowcaseSection"));

/** Osvežavanje HTML-a da Bunny token u media URL-ovima ne istekne (getServerCdnUrl koristi Date). */
export const revalidate = 3600;

export default function Home() {
  const heroMedia = {
    bgMp4: getServerCdnUrl(CDN_PATH_HERO_BG),
    explainerMp4: getServerCdnUrl(CDN_PATH_EXPLAINER_MP4),
    explainerPoster: getServerCdnUrl(CDN_PATH_EXPLAINER_POSTER),
  };
  const showcaseRow1Urls = CDN_PATH_SHOWCASE_ROW1.map((p) => getServerCdnUrl(p));
  const showcaseRow2Urls = CDN_PATH_SHOWCASE_ROW2.map((p) => getServerCdnUrl(p));

  return (
    <div style={{ position: "relative", minHeight: "100vh", contain: "layout" }}>
      <Header />
      <main style={{ position: "relative", zIndex: 1 }}>
        <HeroSection mediaUrls={heroMedia} />
        <div className="section-divider" />
        <div className="problem-solution-bg">
          <div className="problem-solution-bg__image" aria-hidden />
          <ProblemSection />
          <div className="section-divider section-divider--visible" />
          <SolutionSection />
        </div>
        <div className="section-divider" />
        <div className="plexus-sections-bg">
          <div className="plexus-sections-bg__image" aria-hidden />
          <BlogSection />
          <div className="section-divider section-divider--visible" />
          <VideoShowcaseSection row1Srcs={showcaseRow1Urls} row2Srcs={showcaseRow2Urls} />
          <div className="section-divider section-divider--visible" />
          <SocialProofSection />
          <div className="section-divider section-divider--visible" />
          <ForWhoSection />
          <div className="section-divider section-divider--visible" />
          <HowToEnterSection />
          <div className="section-divider section-divider--visible" />
          <FAQSection />
        </div>
        <div className="section-divider" />
        <FinalCTASection />
        <div className="section-divider" />
        <AffiliateSection />
      </main>
      <Footer />
      {/* Desktop-only: mobile CTA bar skriven */}
    </div>
  );
}
