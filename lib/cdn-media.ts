/**
 * Isti origin kao showcase videi: NEXT_PUBLIC_BUNNY_VIDEO_BASE_URL.
 * Na Bunny-u zadrži iste putanje kao u public/ (npr. /hero-vsl.mp4, /examples/v1.mp4).
 */
const CDN_BASE = process.env.NEXT_PUBLIC_BUNNY_VIDEO_BASE_URL?.trim() ?? "";

export function getCdnMediaUrl(path: string): string {
  if (!CDN_BASE) return path.startsWith("/") ? path : `/${path}`;
  const base = CDN_BASE.replace(/\/+$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
