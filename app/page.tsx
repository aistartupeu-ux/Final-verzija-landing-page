import dynamic from "next/dynamic";

import NetworkBackground from "@/components/ui/NetworkBackground";
import ChatBubble from "@/components/ui/ChatBubble";
import ScrollProgress from "@/components/ui/ScrollProgress";
import CursorGlow from "@/components/ui/CursorGlow";
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
      <CursorGlow />
      <NetworkBackground />
      <Header />
      <main style={{ position: "relative", zIndex: 1 }}>
        <HeroSection />
        <div className="section-divider" />
        <ProblemSection />
        <SolutionSection />
        <div className="section-divider" />
        <VideoShowcaseSection />
        <div className="section-divider" />
        <SocialProofSection />
        <div className="section-divider" />
        <ForWhoSection />
        <HowToEnterSection />
        <FAQSection />
        <FinalCTASection />
        <div className="section-divider" />
        <BlogSection />
        <div className="section-divider" />
        <AffiliateSection />
      </main>
      <Footer />
      <ChatBubble />
      <MobileCTABar />
    </div>
  );
}
