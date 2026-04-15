"use client";

import HeroSectionAppleLayout from "./HeroSectionAppleLayout";
import type { HeroSectionMediaUrls } from "./HeroSectionClassic";

export type { HeroSectionMediaUrls };

export default function HeroSection(props: Readonly<{ mediaUrls?: HeroSectionMediaUrls }>) {
  return <HeroSectionAppleLayout {...props} />;
}
