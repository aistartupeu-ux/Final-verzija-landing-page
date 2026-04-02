/** Session ključ: poslednji „landing” funnel (Meta početna vs TikTok klon). */
export const LANDING_CHANNEL_STORAGE_KEY = "aha_landing_channel";

export type LandingChannel = "meta" | "tiktok";

export function getLandingChannel(): LandingChannel {
  if (typeof window === "undefined") return "meta";
  try {
    return sessionStorage.getItem(LANDING_CHANNEL_STORAGE_KEY) === "tiktok" ? "tiktok" : "meta";
  } catch {
    return "meta";
  }
}

export function setLandingChannelFromPathname(pathname: string): void {
  if (typeof window === "undefined") return;
  try {
    if (pathname === "/" || pathname === "") {
      sessionStorage.setItem(LANDING_CHANNEL_STORAGE_KEY, "meta");
    } else if (pathname.startsWith("/tiktok")) {
      sessionStorage.setItem(LANDING_CHANNEL_STORAGE_KEY, "tiktok");
    }
  } catch {
    // ignore
  }
}

/** Kanal na osnovu URL-a (snapshot u trenutku slanja leada — ne zavisi od kasnijeg prelaska na /). */
export function landingChannelFromPathname(pathname: string): LandingChannel {
  if (pathname.startsWith("/tiktok")) return "tiktok";
  return "meta";
}
