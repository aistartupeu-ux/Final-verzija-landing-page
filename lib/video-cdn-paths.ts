/** Relativne putanje ispod Bunny pull zone / public (isti sufiksi kao u public/). */

export const CDN_PATH_HERO_BG = "/hero-vsl.webm";
/** Hero VSL sada koristi optimizovani webm. */
export const CDN_PATH_EXPLAINER_MP4 = "/hero-vsl.webm";

/** Povećaj kad zameniš ovaj mp4 na Bunny-ju (isti path) da korisnici ne dobijaju stari keš. */
export const CDN_EXPLAINER_CACHE_TAG = "20260403-webm";
export const CDN_PATH_EXPLAINER_POSTER = "/video-poster.webp";

export const CDN_PATH_SHOWCASE_ROW1 = [
  "/examples/v11.webm",
  "/examples/v12.webm",
  "/examples/v13.webm",
  "/examples/v14.webm",
  "/examples/v16.webm",
  "/examples/v17.webm",
] as const;

export const CDN_PATH_SHOWCASE_ROW2 = [
  "/examples/v1.webm",
  "/examples/v2.webm",
  "/examples/v3.webm",
  "/examples/v4.webm",
  "/examples/v5.webm",
  "/examples/v6.webm",
] as const;
