import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionChunkFallback from "@/components/layout/SectionChunkFallback";
import HeroSection from "@/components/sections/HeroSection";
import { getServerCdnUrl } from "@/lib/bunny-cdn-sign";
import {
  CDN_PATH_EXPLAINER_MP4,
  CDN_EXPLAINER_CACHE_TAG,
  CDN_PATH_SHOWCASE_ROW1,
  CDN_PATH_SHOWCASE_ROW2,
} from "@/lib/video-cdn-paths";

const sectionLoad = () => <SectionChunkFallback />;

const ProblemSection = dynamic(() => import("@/components/sections/ProblemSection"), {
  loading: sectionLoad,
});
const SolutionSection = dynamic(() => import("@/components/sections/SolutionSection"), {
  loading: sectionLoad,
});
const SocialProofSection = dynamic(() => import("@/components/sections/SocialProofSection"), {
  loading: sectionLoad,
});
const ForWhoSection = dynamic(() => import("@/components/sections/ForWhoSection"), {
  loading: sectionLoad,
});
const HowToEnterSection = dynamic(() => import("@/components/sections/HowToEnterSection"), {
  loading: sectionLoad,
});
const FAQSection = dynamic(() => import("@/components/sections/FAQSection"), { loading: sectionLoad });
const FinalCTASection = dynamic(() => import("@/components/sections/FinalCTASection"), {
  loading: sectionLoad,
});
const BlogSection = dynamic(() => import("@/components/sections/BlogSection"), { loading: sectionLoad });
const VideoShowcaseSection = dynamic(() => import("@/components/sections/VideoShowcaseSection"), {
  loading: sectionLoad,
});

function publicAsset(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function useLocalHeroMedia() {
  const v = process.env.NEXT_PUBLIC_LOCAL_HERO_MEDIA?.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return true;
  if (v === "0" || v === "false" || v === "no") return false;
  const bunny = process.env.NEXT_PUBLIC_BUNNY_VIDEO_BASE_URL?.trim();
  if (process.env.NODE_ENV === "development" && !bunny) return true;
  return false;
}

export default function HomeLanding() {
  const heroFromPublic = useLocalHeroMedia();
  const heroMedia = heroFromPublic
    ? {
        explainerMp4: publicAsset(CDN_PATH_EXPLAINER_MP4),
      }
    : {
        explainerMp4: getServerCdnUrl(CDN_PATH_EXPLAINER_MP4, undefined, CDN_EXPLAINER_CACHE_TAG),
      };
  const showcaseRow1Urls = CDN_PATH_SHOWCASE_ROW1.map((p) => getServerCdnUrl(p));
  const showcaseRow2Urls = CDN_PATH_SHOWCASE_ROW2.map((p) => getServerCdnUrl(p));

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
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
      </main>
      <Footer />
    </div>
  );
}
