import dynamic from "next/dynamic";

import NetworkBackground from "@/components/ui/NetworkBackground";
import ChatBubble from "@/components/ui/ChatBubble";
import ScrollProgress from "@/components/ui/ScrollProgress";
import { SpotlightCursor } from "@/components/ui/spotlight-cursor";
import MobileCTABar from "@/components/ui/MobileCTABar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";

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

export default function Home() {
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <ScrollProgress />
      <SpotlightCursor />
      <NetworkBackground />
      <Header />
      <main style={{ position: "relative", zIndex: 1 }}>
        <HeroSection />
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
          <VideoShowcaseSection />
          <div className="section-divider section-divider--visible" />
          <SocialProofSection />
          <div className="section-divider section-divider--visible" />
          <ForWhoSection />
          <div className="section-divider section-divider--visible" />
          <HowToEnterSection />
          <div className="section-divider section-divider--visible" />
          <FAQSection />
          <div className="section-divider section-divider--visible" />
          <FinalCTASection />
          <div className="section-divider section-divider--visible" />
          <BlogSection />
        </div>
        <div className="section-divider" />
        <AffiliateSection />
      </main>
      <Footer />
      <ChatBubble />
      <MobileCTABar />
    </div>
  );
}
