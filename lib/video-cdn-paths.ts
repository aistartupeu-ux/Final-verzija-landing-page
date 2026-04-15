/** Relativne putanje ispod Bunny pull zone / public (isti sufiksi kao u public/). */

/** Hero / VSL — WebM na pull zone i u `public/hero-vsl.webm` za lokal. */
export const CDN_PATH_HERO_BG = "/hero-vsl.webm";
/**
 * Jedan izvor za hero VSL (`<video>`). Ime konstante ostaje iz istorije koda; fajl je .webm.
 */
export const CDN_PATH_EXPLAINER_MP4 = "/hero-vsl.webm";

/** Povećaj posle zamene fajla na CDN-u da se poremeti keš query param. */
export const CDN_EXPLAINER_CACHE_TAG = "20260411-hero-webm";
export const CDN_PATH_EXPLAINER_POSTER = "/video-poster.webp";

/**
 * Jedna horizontalna traka u showcase-u (manje opterećenja nego dve markee).
 * Skraćeni set: v1–6 i v11–16 (bez v7–10, v17).
 */
export const CDN_PATH_SHOWCASE_VIDEOS = [
  "/examples/v1.webm",
  "/examples/v2.webm",
  "/examples/v3.webm",
  "/examples/v4.webm",
  "/examples/v5.webm",
  "/examples/v6.webm",
  "/examples/v11.webm",
  "/examples/v12.webm",
  "/examples/v13.webm",
  "/examples/v14.webm",
  "/examples/v15.webm",
  "/examples/v16.webm",
] as const;
