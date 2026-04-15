import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionChunkFallback from "@/components/layout/SectionChunkFallback";
import ViewportDeferredSection from "@/components/layout/ViewportDeferredSection";
import HeroSection from "@/components/sections/HeroSection";
import { getServerCdnUrl } from "@/lib/bunny-cdn-sign";
import {
  CDN_PATH_EXPLAINER_MP4,
  CDN_EXPLAINER_CACHE_TAG,
  CDN_PATH_SHOWCASE_VIDEOS,
} from "@/lib/video-cdn-paths";

const sectionLoad = () => <SectionChunkFallback />;

const ProblemSection = dynamic(() => import("@/components/sections/ProblemSection"), {
  loading: sectionLoad,
});
const SolutionSection = dynamic(() => import("@/components/sections/SolutionSection"), {
  loading: sectionLoad,
});
const ForWhoSection = dynamic(() => import("@/components/sections/ForWhoSection"), {
  loading: sectionLoad,
});
const SocialProofSection = dynamic(() => import("@/components/sections/SocialProofSection"), {
  loading: sectionLoad,
});
const CourseStructureSection = dynamic(() => import("@/components/sections/CourseStructureSection"), {
  loading: sectionLoad,
});
const FAQSection = dynamic(() => import("@/components/sections/FAQSection"), {
  loading: sectionLoad,
});
const FinalCTASection = dynamic(() => import("@/components/sections/FinalCTASection"), {
  loading: sectionLoad,
});
const BlogSection = dynamic(() => import("@/components/sections/BlogSection"), {
  loading: sectionLoad,
});
const VideoShowcaseSection = dynamic(() => import("@/components/sections/VideoShowcaseSection"), {
  loading: sectionLoad,
});

function publicAsset(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function showcasePosterPathFromVideo(videoPath: string): string {
  return videoPath.replace("/examples/", "/examples/posters/").replace(/\.webm$/i, ".jpg");
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
  const showcaseUrls = CDN_PATH_SHOWCASE_VIDEOS.map((p) => getServerCdnUrl(p));
  const showcasePosterUrls = CDN_PATH_SHOWCASE_VIDEOS.map((p) =>
    publicAsset(showcasePosterPathFromVideo(p))
  );
  const showcaseMp4Urls = CDN_PATH_SHOWCASE_VIDEOS.map((p) =>
    getServerCdnUrl(p.replace(/\.webm$/i, ".mp4"))
  );

  return (
    <div className="lp-landing-apple" style={{ position: "relative", minHeight: "100vh" }}>
      <Header />
      <main style={{ position: "relative", zIndex: 1 }}>
        <HeroSection mediaUrls={heroMedia} />
        <div className="section-divider" />
        <div className="problem-solution-bg">
          <div className="problem-solution-bg__image" aria-hidden />
          <ViewportDeferredSection rootMargin="200px 0px 440px 0px">
            <>
              <ProblemSection />
              <div className="section-divider section-divider--visible" />
              <SolutionSection />
            </>
          </ViewportDeferredSection>
        </div>
        <div className="section-divider" />
        <div className="plexus-sections-bg">
          <div className="plexus-sections-bg__image" aria-hidden />
          <ViewportDeferredSection rootMargin="240px 0px 320px 0px">
            <BlogSection />
          </ViewportDeferredSection>
          <div className="section-divider section-divider--visible" />
          <ViewportDeferredSection rootMargin="160px 0px 240px 0px">
            <VideoShowcaseSection
              videoSrcs={showcaseUrls}
              posterSrcs={showcasePosterUrls}
              mp4Srcs={showcaseMp4Urls}
            />
          </ViewportDeferredSection>
          <div className="section-divider section-divider--visible" />
          <ViewportDeferredSection rootMargin="240px 0px 300px 0px">
            <ForWhoSection />
          </ViewportDeferredSection>
          <div className="section-divider section-divider--visible" />
          <ViewportDeferredSection rootMargin="240px 0px 300px 0px">
            <CourseStructureSection />
          </ViewportDeferredSection>
          <ViewportDeferredSection rootMargin="240px 0px 300px 0px">
            <SocialProofSection />
          </ViewportDeferredSection>
          <ViewportDeferredSection rootMargin="240px 0px 320px 0px">
            <FAQSection />
          </ViewportDeferredSection>
        </div>
        <div className="section-divider" />
        <ViewportDeferredSection rootMargin="280px 0px 400px 0px">
          <FinalCTASection />
        </ViewportDeferredSection>
        <div className="section-divider" />
      </main>
      <Footer />
    </div>
  );
}
