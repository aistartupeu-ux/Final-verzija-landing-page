/**
 * Affiliate tracking — client-side helper
 * Koristi af_ref cookie (kompatibilno sa /ref/[code] redirect)
 */

export function getParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

export function setCookie(name: string, value: string, days = 30): void {
  if (typeof document === "undefined") return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Na ulazu: visitor_id + ref + UTM iz URL-a u cookie */
export function initAffiliateTracking(): void {
  if (typeof window === "undefined") return;
  if (!getCookie("af_vid")) setCookie("af_vid", randomId(), 30);
  const ref = getParam("ref") || getParam("utm_campaign");
  // Čuvamo affiliate kod tačno onako kako je u linku (bez forsiranja UPPERCASE),
  // da se poklapa sa kodovima koje definišeš u Sheet-u i u GHL-u.
  if (ref) setCookie("af_ref", ref.trim().toLowerCase(), 30);
  const utmSource = getParam("utm_source");
  const utmMedium = getParam("utm_medium");
  const utmCampaign = getParam("utm_campaign");
  if (utmSource) setCookie("af_utm_source", utmSource, 7);
  if (utmMedium) setCookie("af_utm_medium", utmMedium, 7);
  if (utmCampaign) setCookie("af_utm_campaign", utmCampaign, 7);
}

/** Podaci o izvoru za lead (UTM + affiliate) — za Sheet "Leads by Source" i Supabase */
export function getLeadSourceData(): {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  affiliate_code: string | null;
  source_tag: string;
} {
  const affiliateCode = getCookie("af_ref");
  const utmSource = getCookie("af_utm_source") || getParam("utm_source");
  const utmMedium = getCookie("af_utm_medium") || getParam("utm_medium");
  const utmCampaign = getCookie("af_utm_campaign") || getParam("utm_campaign");

  let sourceTag = "direct";
  if (affiliateCode) sourceTag = "affiliate";
  else {
    const s = (utmSource + "").toLowerCase();
    const m = (utmMedium + "").toLowerCase();
    const probe = `${s} ${m}`;
    if (probe.includes("instagram") || s === "ig" || m === "ig") sourceTag = "instagram";
    else if (probe.includes("facebook") || s === "fb" || m === "fb") sourceTag = "facebook";
    else if (probe.includes("tiktok") || s === "tt" || m === "tt") sourceTag = "tiktok";
    else if (s.includes("meta")) sourceTag = "meta";
    else if (s) sourceTag = s;
  }

  return {
    utm_source: utmSource || null,
    utm_medium: utmMedium || null,
    utm_campaign: utmCampaign || null,
    affiliate_code: affiliateCode || null,
    source_tag: sourceTag,
  };
}

/** Šalje click event (1x po visitor+affiliate) */
export async function trackClickOnce(): Promise<void> {
  const ref = getCookie("af_ref");
  const vid = getCookie("af_vid");
  if (!ref || !vid) return;
  if (getCookie("af_clicked") === "1") return;
  setCookie("af_clicked", "1", 7);

  try {
    await fetch("/api/affiliate/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "click",
        affiliate_code: ref,
        visitor_id: vid,
        page_url: typeof window !== "undefined" ? window.location.href : "",
        utm_source: getParam("utm_source"),
        utm_campaign: getParam("utm_campaign"),
      }),
    });
  } catch {
    // silent
  }
}

/** Šalje lead event — samo ako postoji affiliate (af_ref) */
export async function trackAffiliateLeadOnSubmit(payload: { email: string; phone?: string | null }): Promise<void> {
  const ref = getCookie("af_ref");
  const vid = getCookie("af_vid");
  if (!ref) return;

  try {
    await fetch("/api/affiliate/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "lead",
        affiliate_code: ref,
        visitor_id: vid ?? undefined,
        email: payload.email,
        phone: payload.phone ?? null,
        page_url: typeof window !== "undefined" ? window.location.href : "",
        utm_source: getParam("utm_source"),
        utm_campaign: getParam("utm_campaign"),
        created_at: new Date().toISOString(),
      }),
    });
  } catch {
    // silent
  }
}
