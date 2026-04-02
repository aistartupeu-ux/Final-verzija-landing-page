import type { Metadata } from "next";
import HomeLanding from "@/components/pages/HomeLanding";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "AI Hype Academy | TikTok",
  robots: { index: false, follow: true },
  alternates: {
    canonical: "https://aihype-academy.com/",
  },
};

export default function TikTokLandingPage() {
  return <HomeLanding />;
}
