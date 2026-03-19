/**
 * dataLayer + gtag push za TikTok Conversions API / GTM.
 * Koristi SHA-256 hash za email i phone (TikTok zahteva hashed PII).
 *
 * Za purchase (kad dodate checkout), pozovite:
 *   gtag('event', 'purchase', {
 *     transaction_id: 'T_xxx',
 *     value: 200.0,
 *     currency: 'USD',
 *     user_data: { sha256_email_address, sha256_phone_number?, address? },
 *     items: [{ item_id, item_name, item_brand, item_category, price, quantity }],
 *     tt_external_id: '<sha256_hash>',
 *     tt_content_type: 'product'
 *   });
 *   + dataLayer.push({ ecommerce: null }); dataLayer.push({ event: 'purchase', ... });
 */

async function sha256Hex(str: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle) return "";
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Push lead event na dataLayer za GTM/TikTok.
 * Email i phone se hashuju SHA-256 (lowercase, trimmed; phone digits only).
 * Format je kompatibilan sa TikTok Conversions API / Events Manager.
 */
export async function pushLeadToDataLayer(
  email: string,
  phone: string | null | undefined
): Promise<void> {
  if (typeof window === "undefined") return;
  const w = window as Window & { dataLayer?: unknown[] };
  if (!Array.isArray(w.dataLayer)) w.dataLayer = [];

  const emailNorm = email.toLowerCase().trim();
  const emailHash = emailNorm ? await sha256Hex(emailNorm) : "";

  let phoneHash = "";
  if (phone) {
    const phoneNorm = String(phone).replace(/\D/g, ""); // digits only
    if (phoneNorm) phoneHash = await sha256Hex(phoneNorm);
  }

  const user_data: Record<string, string> = {
    sha256_email_address: emailHash,
  };
  if (phoneHash) user_data.sha256_phone_number = phoneHash;

  w.dataLayer.push({ ecommerce: null });
  w.dataLayer.push({
    event: "CompleteRegistration",
    user_data,
    tt_content_type: "product",
  });

  const gtag = (w as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === "function") {
    gtag("event", "CompleteRegistration", {
      user_data,
      tt_content_type: "product",
    });
    gtag("event", "generate_lead", {
      event_category: "lead",
      event_label: "waitlist",
      user_data,
    });
  }
}

const LEAD_CONFIRM_KEY = "lead_confirm";

/** Sačuvaj email/phone/eventId pre redirecta na thank-you (za Meta Lead na confirmation page). */
export function storeLeadForThankYou(
  email: string,
  phone: string | null | undefined,
  eventId?: string | null
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      LEAD_CONFIRM_KEY,
      JSON.stringify({ email, phone: phone ?? null, event_id: eventId ?? null })
    );
  } catch {
    // ignore
  }
}

/**
 * Na thank-you page: pročita stored lead, push-uje lead_confirmation event, briše storage.
 * Event "lead_confirmation" = korisnik je stigao na confirmation page.
 * eventIdFromUrl = iz ?eid= (Meta preporuka: eksplicitno prosleđivanje za deduplikaciju).
 */
export async function pushThankYouPageTracking(opts?: { eventIdFromUrl?: string | null }): Promise<void> {
  if (typeof window === "undefined") return;
  let data: { email: string; phone: string | null; event_id?: string | null } | null = null;
  try {
    const raw = sessionStorage.getItem(LEAD_CONFIRM_KEY);
    if (raw) {
      data = JSON.parse(raw) as { email: string; phone: string | null; event_id?: string | null };
      sessionStorage.removeItem(LEAD_CONFIRM_KEY);
    }
  } catch {
    // ignore
  }

  if (!data?.email) return;

  // event_id: prioritet URL param (Meta preporuka), pa sessionStorage
  const eventId = opts?.eventIdFromUrl ?? data.event_id ?? undefined;

  const w = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; ttq?: { page?: () => void; track: (ev: string, opts?: object) => void }; fbq?: (a: string, b: string, c?: object, d?: { eventID?: string }) => void };
  const emailNorm = data.email.toLowerCase().trim();
  const emailHash = await sha256Hex(emailNorm);
  let phoneHash = "";
  if (data.phone) {
    const phoneNorm = String(data.phone).replace(/\D/g, "");
    if (phoneNorm) phoneHash = await sha256Hex(phoneNorm);
  }

  const user_data: Record<string, string> = { sha256_email_address: emailHash };
  if (phoneHash) user_data.sha256_phone_number = phoneHash;

  if (!Array.isArray(w.dataLayer)) w.dataLayer = [];
  w.dataLayer.push({ ecommerce: null });
  w.dataLayer.push({
    event: "lead_confirmation",
    user_data,
    tt_content_type: "product",
  });

  if (typeof w.gtag === "function") {
    w.gtag("event", "lead_confirmation", { user_data, tt_content_type: "product" });
    w.gtag("event", "generate_lead", { event_category: "lead", event_label: "thank_you_page", user_data });
  }
  if (w.ttq) {
    if (typeof w.ttq.page === "function") w.ttq.page(); // PageView kao Meta
    if (typeof w.ttq.track === "function") {
      w.ttq.track("Lead", { content_name: "thank_you_page" }); // isto kao fbq Lead
      w.ttq.track("CompleteRegistration", { content_name: "thank_you_page" });
    }
  }

  // Meta: PageView + Lead na thank-you stranici (client-side navigacija ne šalje auto PageView).
  if (w.fbq) {
    w.fbq("track", "PageView"); // Meta mora da vidi posetu thank-you stranici
    w.fbq("track", "Lead", {}, { eventID: eventId });
  }

  // Meta CAPI — server-side Lead; eksplicitan thank-you URL da Meta uvek vidi /thank-you
  const thankYouUrl = typeof window !== "undefined" ? `${window.location.origin}/thank-you` : null;
  fetch("/api/leads/meta-capi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: data.email,
      phone: data.phone,
      event_id: eventId,
      event_source_url: thankYouUrl,
    }),
  }).catch(() => {});
}

export type PurchaseItem = {
  item_id: string;
  item_name: string;
  item_brand: string;
  item_category: string;
  price: number;
  quantity: number;
};

export type PurchaseUserData = {
  sha256_email_address: string;
  sha256_phone_number?: string;
  address?: {
    sha256_first_name?: string;
    sha256_last_name?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
};

/**
 * Za purchase (checkout uspešan). Hashuje email/phone, push-uje dataLayer + gtag.
 * Pozovi na stranici potvrde narudžbine.
 */
export async function pushPurchaseToDataLayer(params: {
  transaction_id: string;
  value: number;
  currency: string;
  items: PurchaseItem[];
  email: string;
  phone?: string | null;
  address?: PurchaseUserData["address"];
  tt_external_id?: string;
}): Promise<void> {
  if (typeof window === "undefined") return;
  const w = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

  const emailHash = params.email
    ? await sha256Hex(params.email.toLowerCase().trim())
    : "";
  let phoneHash = "";
  if (params.phone) {
    const phoneNorm = String(params.phone).replace(/\D/g, "");
    if (phoneNorm) phoneHash = await sha256Hex(phoneNorm);
  }

  const user_data: PurchaseUserData = {
    sha256_email_address: emailHash,
  };
  if (phoneHash) user_data.sha256_phone_number = phoneHash;
  if (params.address) user_data.address = params.address;

  const payload = {
    transaction_id: params.transaction_id,
    value: params.value,
    currency: params.currency,
    user_data,
    items: params.items,
    tt_external_id: params.tt_external_id ?? emailHash,
    tt_content_type: "product" as const,
  };

  if (!Array.isArray(w.dataLayer)) w.dataLayer = [];
  w.dataLayer.push({ ecommerce: null });
  w.dataLayer.push({
    event: "purchase",
    user_data,
    ecommerce: {
      transaction_id: params.transaction_id,
      value: params.value,
      currency: params.currency,
      items: params.items,
    },
    tt_external_id: payload.tt_external_id,
    tt_content_type: "product",
  });

  if (typeof w.gtag === "function") {
    w.gtag("event", "purchase", payload);
  }
}
