"use client";

import dynamic from "next/dynamic";
import HeroSectionClassic from "./HeroSectionClassic";
import type { HeroSectionMediaUrls } from "./HeroSectionClassic";

export type { HeroSectionMediaUrls };

/** Samo u `next dev` — produkcijski build ne uključuje ovaj chunk. */
const HeroSectionAppleLayout =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("./HeroSectionAppleLayout"))
    : null;

export default function HeroSection(props: Readonly<{ mediaUrls?: HeroSectionMediaUrls }>) {
  if (process.env.NODE_ENV === "development" && HeroSectionAppleLayout) {
    return <HeroSectionAppleLayout {...props} />;
  }
  return <HeroSectionClassic {...props} />;
}
