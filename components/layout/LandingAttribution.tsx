"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { setLandingChannelFromPathname } from "@/lib/landing-attribution";

/** Postavi session atribuciju za / (Meta) vs /tiktok (TikTok) da thank-you zna koji pixel koristiti. */
export default function LandingAttribution() {
  const pathname = usePathname() ?? "";

  useEffect(() => {
    setLandingChannelFromPathname(pathname);
  }, [pathname]);

  return null;
}
