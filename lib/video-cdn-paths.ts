/** Relativne putanje ispod Bunny pull zone / public (isti sufiksi kao u public/). */

export const CDN_PATH_HERO_BG = "/hero-vsl.mp4";
/** U /examples/ da zamena fajla na istom path-u ne servira stari klip zbog CDN/browser keša (root /explainer-vsl.mp4 je problematičan pri overwrite). */
export const CDN_PATH_EXPLAINER_MP4 = "/examples/explainer-vsl.mp4";

/** Povećaj kad zameniš ovaj mp4 na Bunny-ju (isti path) da korisnici ne dobijaju stari keš. */
export const CDN_EXPLAINER_CACHE_TAG = "20260330";
export const CDN_PATH_EXPLAINER_POSTER = "/video-poster.webp";

export const CDN_PATH_SHOWCASE_ROW1 = [
  "/examples/v11.mp4",
  "/examples/v12.mp4",
  "/examples/v13.mp4",
  "/examples/v14.mp4",
  "/examples/v16.mp4",
  "/examples/v17.mp4",
] as const;

export const CDN_PATH_SHOWCASE_ROW2 = [
  "/examples/v1.mp4",
  "/examples/v2.mp4",
  "/examples/v3.mp4",
  "/examples/v4.mp4",
  "/examples/v5.mp4",
  "/examples/v6.mp4",
] as const;
